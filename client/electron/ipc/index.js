import { ipcMain, dialog, shell } from 'electron'
import { scanImagesFromFolder, loadThumbnailsInBatches, loadImagesFromFolder } from '../services/imageService.js'
import { generatePdf } from '../services/pdfService.js'
import { checkTrial, getTrialDays } from '../license/index.js'

// 存储主窗口引用
let mainWindowRef = null

/**
 * 设置主窗口引用
 * @param {BrowserWindow} window - 主窗口实例
 */
export function setMainWindow(window) {
  mainWindowRef = window
}

/**
 * 获取主窗口引用
 * @returns {BrowserWindow} 主窗口实例
 */
export function getMainWindow() {
  return mainWindowRef
}

/**
 * 向渲染进程发送消息
 */
function send(channel, data) {
  mainWindowRef?.webContents.send(channel, data)
}

/**
 * 注册所有 IPC 处理程序
 */
export function registerIpcHandlers() {
  // 测试通信
  ipcMain.handle('ping', async () => {
    return 'pong'
  })

  // 获取试用状态
  ipcMain.handle('get-trial-status', async () => {
    const status = checkTrial()
    return {
      ...status,
      totalDays: getTrialDays()
    }
  })

  // 【新】仅选择目录（不扫描图片）
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindowRef, {
      properties: ['openDirectory'],
      title: '选择图片目录'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, folderPath: null }
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0]
    }
  })

  // 【新】加载图片（快速扫描 + 分批返回缩略图）
  ipcMain.handle('load-images', async (event, { folderPath }) => {
    try {
      // 第一步：快速扫描目录，返回图片列表（无缩略图）
      const images = await scanImagesFromFolder(folderPath)

      if (images.length === 0) {
        return { success: true, images: [], total: 0 }
      }

      // 立即返回图片列表（无缩略图），让前端先显示
      send('images-scanned', {
        images,
        total: images.length
      })

      // 第二步：分批生成缩略图，边生成边返回
      loadThumbnailsInBatches(
        images,
        // 每批完成回调
        (batchImages, progress) => {
          send('thumbnails-batch', {
            images: batchImages,
            progress
          })
        },
        // 全部完成回调
        () => {
          send('thumbnails-complete', {})
        }
      )

      return { success: true, total: images.length }
    } catch (error) {
      console.error('加载图片失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 显示保存 PDF 对话框
  ipcMain.handle('show-save-pdf-dialog', async () => {
    try {
      const saveResult = await dialog.showSaveDialog(mainWindowRef, {
        title: '保存 PDF 文件',
        defaultPath: 'output.pdf',
        filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { canceled: true, filePath: null }
      }

      return { canceled: false, filePath: saveResult.filePath }
    } catch (error) {
      console.error('显示保存对话框失败:', error)
      return { canceled: true, filePath: null, error: error.message }
    }
  })

  // 生成 PDF（不带对话框，直接生成）
  ipcMain.handle('generate-pdf-direct', async (event, { images, outputPath, options = {} }) => {
    try {
      // 进度回调
      const onProgress = (progress) => {
        send('pdf-progress', progress)
      }

      // 调用 PDF 生成服务
      const result = await generatePdf(outputPath, images, onProgress)

      // 成功后打开文件所在目录
      if (result.success) {
        shell.showItemInFolder(outputPath)
      }

      return result
    } catch (outerError) {
      console.error('generate-pdf-direct 外层错误:', outerError)
      return {
        success: false,
        error: String(outerError.message || outerError || '处理 PDF 请求时发生错误')
      }
    }
  })
}
