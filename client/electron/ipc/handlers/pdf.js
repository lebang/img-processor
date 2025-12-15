import { ipcMain, dialog, shell } from 'electron'
import { generatePdf } from '../../services/pdfService.js'
import * as channels from '../channels.js'
import { getMainWindow, send } from '../index.js'

/**
 * 注册 PDF 生成相关的 IPC 处理程序
 */
export function registerPdfHandlers() {
  // 显示保存 PDF 对话框
  ipcMain.handle(channels.SHOW_SAVE_PDF_DIALOG, async () => {
    try {
      const mainWindow = getMainWindow()
      const saveResult = await dialog.showSaveDialog(mainWindow, {
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
  ipcMain.handle(channels.GENERATE_PDF_DIRECT, async (event, { images, outputPath, options = {} }) => {
    try {
      // 进度回调
      const onProgress = (progress) => {
        send(channels.PDF_PROGRESS, progress)
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
