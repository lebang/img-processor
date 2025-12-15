import { ipcMain } from 'electron'
import { scanImagesFromFolder, loadThumbnailsInBatches } from '../../services/imageService.js'
import * as channels from '../channels.js'
import { send } from '../index.js'

/**
 * 注册图片加载相关的 IPC 处理程序
 */
export function registerImageHandlers() {
  // 加载图片（快速扫描 + 分批返回缩略图）
  ipcMain.handle(channels.LOAD_IMAGES, async (event, { folderPath }) => {
    try {
      // 第一步：快速扫描目录，返回图片列表（无缩略图）
      const images = await scanImagesFromFolder(folderPath)

      if (images.length === 0) {
        return { success: true, images: [], total: 0 }
      }

      // 立即返回图片列表（无缩略图），让前端先显示
      send(channels.IMAGES_SCANNED, {
        images,
        total: images.length
      })

      // 第二步：分批生成缩略图，边生成边返回
      loadThumbnailsInBatches(
        images,
        // 每批完成回调
        (batchImages, progress) => {
          send(channels.THUMBNAILS_BATCH, {
            images: batchImages,
            progress
          })
        },
        // 全部完成回调
        () => {
          send(channels.THUMBNAILS_COMPLETE, {})
        }
      )

      return { success: true, total: images.length }
    } catch (error) {
      console.error('加载图片失败:', error)
      return { success: false, error: error.message }
    }
  })
}
