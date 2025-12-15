/**
 * IPC 处理程序入口
 * 统一注册所有 IPC handlers
 */

// 导入各模块的 handler 注册函数
import { registerSystemHandlers } from './handlers/system.js'
import { registerFolderHandlers } from './handlers/folder.js'
import { registerImageHandlers } from './handlers/image.js'
import { registerPdfHandlers } from './handlers/pdf.js'

// ==================== 主窗口引用管理 ====================

/** 主窗口引用 */
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
 * @param {string} channel - IPC 通道名称
 * @param {any} data - 要发送的数据
 */
export function send(channel, data) {
  mainWindowRef?.webContents.send(channel, data)
}

// ==================== IPC 注册入口 ====================

/**
 * 注册所有 IPC 处理程序
 */
export function registerIpcHandlers() {
  registerSystemHandlers()
  registerFolderHandlers()
  registerImageHandlers()
  registerPdfHandlers()
}
