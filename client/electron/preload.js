import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // ping-pong 测试
  ping: () => ipcRenderer.invoke('ping'),
  
  // 平台信息
  platform: process.platform,
  process: {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    versions: process.versions,
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  },

  
  // 【新】仅选择目录
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // 【新】加载图片（分批返回）
  loadImages: (folderPath) => ipcRenderer.invoke('load-images', { folderPath }),
  
  // 【新】监听图片扫描完成（立即返回图片列表，无缩略图）
  onImagesScanned: (callback) => {
    ipcRenderer.on('images-scanned', (event, data) => callback(data))
  },
  
  // 【新】监听缩略图批次完成
  onThumbnailsBatch: (callback) => {
    ipcRenderer.on('thumbnails-batch', (event, data) => callback(data))
  },
  
  // 【新】监听缩略图全部完成
  onThumbnailsComplete: (callback) => {
    ipcRenderer.on('thumbnails-complete', () => callback())
  },
  
  // 【新】移除图片加载相关监听
  removeImageListeners: () => {
    ipcRenderer.removeAllListeners('images-scanned')
    ipcRenderer.removeAllListeners('thumbnails-batch')
    ipcRenderer.removeAllListeners('thumbnails-complete')
  },
  
  // 生成 PDF
  generatePdf: (images, options) => ipcRenderer.invoke('generate-pdf', { images, options }),
  
  // 【新】显示保存 PDF 对话框
  showSavePdfDialog: () => ipcRenderer.invoke('show-save-pdf-dialog'),
  
  // 【新】直接生成 PDF（不带对话框）
  generatePdfDirect: (images, outputPath, options) => ipcRenderer.invoke('generate-pdf-direct', { images, outputPath, options }),
  
  // 监听 PDF 生成进度
  onPdfProgress: (callback) => {
    ipcRenderer.on('pdf-progress', (event, data) => callback(data))
  },
  
  // 移除 PDF 进度监听
  removePdfProgressListener: () => {
    ipcRenderer.removeAllListeners('pdf-progress')
  },

  // 监听菜单事件 - 打开文件夹
  onMenuOpenFolder: (callback) => {
    ipcRenderer.on('menu-open-folder', () => callback())
  },

  // 监听菜单事件 - 导出 PDF
  onMenuExportPdf: (callback) => {
    ipcRenderer.on('menu-export-pdf', () => callback())
  },

  // 移除菜单事件监听
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-open-folder')
    ipcRenderer.removeAllListeners('menu-export-pdf')
  }
})
