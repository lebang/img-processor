import { join, dirname, basename } from 'path'
import { createWriteStream, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { app } from 'electron'
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import { decompress } from 'woff2-encoder'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 生成 PDF 文件
 * @param {string} outputPath - 输出路径
 * @param {Array} images - 图片列表
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<Object>} 生成结果
 */
export async function generatePdf(outputPath, images, onProgress) {
  const totalImages = images.length

  return new Promise(async (resolve) => {
    try {
      // 创建 PDF 文档（不自动创建第一页）
      const doc = new PDFDocument({ autoFirstPage: false })
      const stream = createWriteStream(outputPath)
      doc.pipe(stream)

      // 加载字体文件（用于显示中文目录名）
      // 在开发环境下，当前文件在 dist-electron/services/pdfService.js
      // 在打包后，当前文件在 app.asar 内
      const possiblePaths = [
        // 开发环境：从 dist-electron/services 向上两级到 client，再进入 electron/fonts
        join(__dirname, '..', '..', 'electron', 'fonts', 'SourceHanSans.woff2'),
        // 打包后：从 app.asar 内的位置查找
        join(app.getAppPath(), 'electron', 'fonts', 'SourceHanSans.woff2'),
        // 备用：从 resources 目录查找
        join(dirname(app.getAppPath()), 'electron', 'fonts', 'SourceHanSans.woff2')
      ]
      
      let fontPath = null
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          fontPath = path
          break
        }
      }
      
      let decompressedFont = null
      if (fontPath) {
        try {
          const fontBuffer = readFileSync(fontPath)
          decompressedFont = await decompress(fontBuffer)
          doc.font(decompressedFont)
        } catch (fontErr) {
          console.error('字体加载失败，使用默认字体:', fontErr.message)
        }
      } else {
        console.warn('字体文件未找到，使用默认字体')
      }

      // 边距
      const margin = 40

      // 逐个添加图片
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        
        // 发送进度更新
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: totalImages,
            percent: Math.round(((i + 1) / totalImages) * 100)
          })
        }

        try {
          // 使用 sharp 压缩图片
          const compressedBuffer = await sharp(image.path)
            .jpeg({ quality: 75, progressive: true })
            .toBuffer()

          // 打开图片获取尺寸
          const pdfImage = doc.openImage(compressedBuffer)
          
          // 获取目录名（用于显示在图片上方）
          const dirName = basename(dirname(image.path))

          // 计算字体大小和文本区域高度
          const FONT_SIZE_RATIO = 10
          const fontSize = Math.max(16, Math.min(120, Math.floor(pdfImage.width / FONT_SIZE_RATIO)))
          const textHeight = fontSize * 1.5

          // 添加页面
          doc.addPage({
            size: [pdfImage.width + margin * 2, pdfImage.height + margin * 2 + textHeight]
          })

          // 绘制目录名
          doc.fontSize(fontSize).text(dirName, margin, margin, {
            align: 'center',
            width: pdfImage.width
          })

          // 绘制图片
          doc.image(pdfImage, margin, margin + textHeight, {
            width: pdfImage.width,
            height: pdfImage.height
          })

        } catch (imgError) {
          console.error(`处理图片失败: ${image.path}`, imgError.message)
          // 跳过无法处理的图片，继续处理其他图片
        }
      }

      doc.end()

      stream.on('finish', () => {
        console.log(`PDF 已成功生成: ${outputPath}`)
        resolve({
          success: true,
          outputPath,
          totalPages: images.length
        })
      })

      stream.on('error', (err) => {
        console.error('保存 PDF 时出错:', err.message)
        resolve({
          success: false,
          error: String(err.message || '保存文件时出错')
        })
      })

    } catch (error) {
      console.error('生成 PDF 失败:', error)
      resolve({
        success: false,
        error: String(error.message || error || '生成 PDF 时发生未知错误')
      })
    }
  })
}
