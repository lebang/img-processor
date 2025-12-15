import { ipcMain, dialog } from 'electron'
import * as channels from '../channels.js'
import { getMainWindow } from '../index.js'

/**
 * 注册文件夹选择相关的 IPC 处理程序
 */
export function registerFolderHandlers() {
  // 选择目录
  ipcMain.handle(channels.SELECT_FOLDER, async () => {
    const mainWindow = getMainWindow()
    const result = await dialog.showOpenDialog(mainWindow, {
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
}
