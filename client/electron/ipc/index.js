import { ipcMain, dialog, shell } from 'electron'
import { loadImagesFromFolder } from '../services/imageService.js'
import { generatePdf } from '../services/pdfService.js'

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
 * 注册所有 IPC 处理程序
 */
export function registerIpcHandlers() {
  // 测试通信
  ipcMain.handle('ping', async () => {
    return 'pong'
  })

  // 选择图片目录
  ipcMain.handle('select-image-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindowRef, {
      properties: ['openDirectory'],
      title: '选择图片目录'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, images: [] }
    }

    const folderPath = result.filePaths[0]
    
    try {
      const imagesWithThumbnails = await loadImagesFromFolder(folderPath)

      return {
        canceled: false,
        folderPath,
        images: imagesWithThumbnails
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
      const saveResult = await dialog.showSaveDialog(mainWindowRef, {
        title: '保存 PDF 文件',
        defaultPath: 'output.pdf',
        filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, canceled: true }
      }

      const outputPath = saveResult.filePath

      // 进度回调
      const onProgress = (progress) => {
        mainWindowRef?.webContents.send('pdf-progress', progress)
      }

      // 调用 PDF 生成服务
      const result = await generatePdf(outputPath, images, onProgress)

      // 成功后打开文件所在目录
      if (result.success) {
        shell.showItemInFolder(outputPath)
      }

      return result
    } catch (outerError) {
      console.error('generate-pdf 外层错误:', outerError)
      return {
        success: false,
        error: String(outerError.message || outerError || '处理 PDF 请求时发生错误')
      }
    }
  })
}
