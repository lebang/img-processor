import { contextBridge } from 'electron'
import { debugInvoke, debugOn, removeListeners } from './ipc/debug.js'
import * as channels from './ipc/channels.js'

/**
 * Electron Preload 脚本
 * 通过 contextBridge 暴露安全的 API 给渲染进程
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // ==================== 系统信息 ====================
  
  /** 连接测试 */
  ping: () => debugInvoke(channels.PING),
  
  /** 平台信息 */
  platform: process.platform,
  
  /** 进程信息 */
  process: {
    arch: process.arch,
    version: process.version,
    versions: { ...process.versions },
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  },

  // ==================== 试用状态 ====================
  
  /** 获取试用状态 */
  getTrialStatus: () => debugInvoke(channels.GET_TRIAL_STATUS),

  // ==================== 文件夹选择 ====================
  
  /** 选择目录 */
  selectFolder: () => debugInvoke(channels.SELECT_FOLDER),
  
  // ==================== 图片加载 ====================
  
  /** 加载图片（分批返回缩略图） */
  loadImages: (folderPath) => debugInvoke(channels.LOAD_IMAGES, { folderPath }),
  
  /** 监听图片扫描完成（返回图片列表，无缩略图） */
  onImagesScanned: (callback) => {
    debugOn(channels.IMAGES_SCANNED, callback)
  },
  
  /** 监听缩略图批次完成 */
  onThumbnailsBatch: (callback) => {
    debugOn(channels.THUMBNAILS_BATCH, callback)
  },
  
  /** 监听缩略图全部完成 */
  onThumbnailsComplete: (callback) => {
    debugOn(channels.THUMBNAILS_COMPLETE, callback)
  },
  
  /** 移除图片加载相关监听 */
  removeImageListeners: () => {
    removeListeners([
      channels.IMAGES_SCANNED,
      channels.THUMBNAILS_BATCH,
      channels.THUMBNAILS_COMPLETE
    ])
  },
  
  // ==================== PDF 生成 ====================
  
  /** 显示保存 PDF 对话框 */
  showSavePdfDialog: () => debugInvoke(channels.SHOW_SAVE_PDF_DIALOG),
  
  /** 直接生成 PDF（不带对话框） */
  generatePdfDirect: (images, outputPath, options) => 
    debugInvoke(channels.GENERATE_PDF_DIRECT, { images, outputPath, options }),
  
  /** 监听 PDF 生成进度 */
  onPdfProgress: (callback) => {
    debugOn(channels.PDF_PROGRESS, callback)
  },
  
  /** 移除 PDF 进度监听 */
  removePdfProgressListener: () => {
    removeListeners([channels.PDF_PROGRESS])
  },

  // ==================== 菜单事件 ====================

  /** 监听菜单事件 - 打开文件夹 */
  onMenuOpenFolder: (callback) => {
    debugOn(channels.MENU_OPEN_FOLDER, callback)
  },

  /** 监听菜单事件 - 导出 PDF */
  onMenuExportPdf: (callback) => {
    debugOn(channels.MENU_EXPORT_PDF, callback)
  },

  /** 移除菜单事件监听 */
  removeMenuListeners: () => {
    removeListeners([
      channels.MENU_OPEN_FOLDER,
      channels.MENU_EXPORT_PDF
    ])
  }
})
