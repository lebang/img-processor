import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // ping-pong 测试
  ping: () => ipcRenderer.invoke('ping'),
  
  // 平台信息
  platform: process.platform,
  
  // 选择图片目录
  selectImageFolder: () => ipcRenderer.invoke('select-image-folder'),
  
  // 生成 PDF
  generatePdf: (images, options) => ipcRenderer.invoke('generate-pdf', { images, options }),
  
  // 监听 PDF 生成进度
  onPdfProgress: (callback) => {
    ipcRenderer.on('pdf-progress', (event, data) => callback(data))
  },
  
  // 移除 PDF 进度监听
  removePdfProgressListener: () => {
    ipcRenderer.removeAllListeners('pdf-progress')
  }
})
