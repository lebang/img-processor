import { join, extname, relative } from 'path'
import { readdir, stat } from 'fs/promises'
import sharp from 'sharp'

// 支持的图片格式
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

// 缩略图批次大小
const THUMBNAIL_BATCH_SIZE = 10

/**
 * 生成图片缩略图（base64格式）
 * @param {string} imagePath - 图片路径
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<string>} base64 缩略图
 */
export async function generateThumbnail(imagePath, maxWidth = 400, maxHeight = 400) {
  try {
    const buffer = await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',  // 保持比例，不裁剪
        withoutEnlargement: true  // 如果图片比目标小，不放大
      })
      .jpeg({ quality: 70 })  // 转为 jpeg 压缩
      .toBuffer()
    
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error(`生成缩略图失败: ${imagePath}`, err.message)
    return null
  }
}

/**
 * 递归遍历目录，获取所有图片文件
 * @param {string} dir - 目录路径
 * @param {string} baseDir - 基础目录（用于计算相对路径）
 * @returns {Promise<Array>} 图片文件列表
 */
export async function getAllImages(dir, baseDir = dir) {
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

/**
 * 快速扫描目录，只返回图片列表（不生成缩略图）
 * @param {string} folderPath - 目录路径
 * @returns {Promise<Array>} 图片列表（无缩略图，使用占位符）
 */
export async function scanImagesFromFolder(folderPath) {
  // 递归遍历目录下的所有图片文件
  const images = await getAllImages(folderPath)
  
  // 按相对路径排序（自然排序，支持数字序号）
  images.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }))

  // 返回带占位缩略图的图片列表
  return images.map((image, index) => ({
    ...image,
    id: index, // 添加唯一 ID，用于后续更新
    thumbnail: null // 占位，稍后分批加载
  }))
}

/**
 * 分批生成缩略图并通过回调返回
 * @param {Array} images - 图片列表
 * @param {Function} onBatchComplete - 每批完成的回调 (batchImages, progress)
 * @param {Function} onAllComplete - 全部完成的回调
 */
export async function loadThumbnailsInBatches(images, onBatchComplete, onAllComplete) {
  const total = images.length
  let processed = 0

  // 分批处理
  for (let i = 0; i < total; i += THUMBNAIL_BATCH_SIZE) {
    const batch = images.slice(i, i + THUMBNAIL_BATCH_SIZE)
    
    // 并行生成这一批的缩略图
    const batchResults = await Promise.all(
      batch.map(async (image) => {
        const thumbnail = await generateThumbnail(image.path)
        return { ...image, thumbnail }
      })
    )

    processed += batch.length
    const progress = Math.round((processed / total) * 100)

    // 回调返回这一批的结果
    if (onBatchComplete) {
      onBatchComplete(batchResults, { processed, total, progress })
    }
  }

  // 全部完成
  if (onAllComplete) {
    onAllComplete()
  }
}

/**
 * 选择并加载图片目录（原方法，保留兼容）
 * @param {string} folderPath - 目录路径
 * @returns {Promise<Array>} 包含缩略图的图片列表
 */
export async function loadImagesFromFolder(folderPath) {
  // 递归遍历目录下的所有图片文件（包含子目录）
  const images = await getAllImages(folderPath)
  
  // 按相对路径排序（自然排序，支持数字序号）
  images.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }))

  // 并行生成所有缩略图
  console.log(`开始生成 ${images.length} 张缩略图...`)
  const thumbnailPromises = images.map(async (image) => {
    const thumbnail = await generateThumbnail(image.path)
    return { ...image, thumbnail }
  })
  const imagesWithThumbnails = await Promise.all(thumbnailPromises)
  console.log('缩略图生成完成')

  return imagesWithThumbnails
}
