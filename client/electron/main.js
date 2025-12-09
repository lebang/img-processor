import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join, extname, relative, dirname, basename } from 'path'
import { readdir, readFile, stat } from 'fs/promises'
import { createWriteStream, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import { decompress } from 'woff2-encoder'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 禁用 Autofill 相关警告
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')

// 判断是否为开发模式
// VITE_DEV_SERVER_URL 由 vite-plugin-electron 自动注入
const isDev = !!process.env.VITE_DEV_SERVER_URL

// 支持的图片格式
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

/**
 * 递归遍历目录，获取所有图片文件
 * @param {string} dir - 目录路径
 * @param {string} baseDir - 基础目录（用于计算相对路径）
 * @returns {Promise<Array>} 图片文件列表
 */
async function getAllImages(dir, baseDir = dir) {
  const images = []
  
  try {
    const entries = await readdir(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      
      try {
        const fileStat = await stat(fullPath)
        
        if (fileStat.isDirectory()) {
          // 递归遍历子目录
          const subImages = await getAllImages(fullPath, baseDir)
          images.push(...subImages)
        } else if (fileStat.isFile()) {
          // 检查是否为支持的图片格式
          const ext = extname(entry).toLowerCase()
          if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
            images.push({
              name: entry,
              path: fullPath,
              relativePath: relative(baseDir, fullPath) // 相对路径，用于显示
            })
          }
        }
      } catch (err) {
        console.error(`无法访问文件: ${fullPath}`, err)
        // 跳过无法访问的文件，继续处理其他文件
      }
    }
  } catch (err) {
    console.error(`无法读取目录: ${dir}`, err)
  }
  
  return images
}

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      // 允许加载本地文件（用于图片预览）
      webSecurity: false
    },
    titleBarStyle: 'default',
    show: false
  })

  // 根据环境加载不同的页面
  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // 开发模式下打开开发者工具（独立窗口）
    if (isDev) {
      mainWindow.webContents.openDevTools()
      // mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 通信
ipcMain.handle('ping', async () => {
  return 'pong'
})

// 选择图片目录
ipcMain.handle('select-image-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择图片目录'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, images: [] }
  }

  const folderPath = result.filePaths[0]
  
  try {
    // 递归遍历目录下的所有图片文件（包含子目录）
    const images = await getAllImages(folderPath)
    
    // 按相对路径排序（自然排序，支持数字序号）
    images.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }))

    return {
      canceled: false,
      folderPath,
      images
    }
  } catch (error) {
    console.error('读取目录失败:', error)
    return { canceled: false, error: error.message, images: [] }
  }
})

// 生成 PDF
ipcMain.handle('generate-pdf', async (event, { images, options = {} }) => {
  try {
    // 弹出保存对话框
    const saveResult = await dialog.showSaveDialog(mainWindow, {
    title: '保存 PDF 文件',
    defaultPath: 'output.pdf',
    filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
  })

  if (saveResult.canceled || !saveResult.filePath) {
    return { success: false, canceled: true }
  }

  const outputPath = saveResult.filePath
  const totalImages = images.length

  return new Promise(async (resolve) => {
    try {
      // 创建 PDF 文档（不自动创建第一页）
      const doc = new PDFDocument({ autoFirstPage: false })
      const stream = createWriteStream(outputPath)
      doc.pipe(stream)

      // 加载字体文件（用于显示中文目录名）
      const fontPath = join(__dirname, 'fonts', 'SourceHanSans.woff2')
      if (existsSync(fontPath)) {
        try {
          const fontBuffer = readFileSync(fontPath)
          const decompressedFont = await decompress(fontBuffer)
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
        mainWindow.webContents.send('pdf-progress', {
          current: i + 1,
          total: totalImages,
          percent: Math.round(((i + 1) / totalImages) * 100)
        })

        try {
          // 使用 sharp 压缩图片
          console.log(`正在压缩图片: ${basename(image.path)}`)
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
        // 打开PDF所在目录并选中文件
        shell.showItemInFolder(outputPath)
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
  } catch (outerError) {
    console.error('generate-pdf 外层错误:', outerError)
    return {
      success: false,
      error: String(outerError.message || outerError || '处理 PDF 请求时发生错误')
    }
  }
})
