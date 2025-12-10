/**
 * Electron API 封装层 - 极简透传
 */

const bridge = window.electronAPI || {}

// 安全调用包装器
const safe = (fn) => (...args) => {
  if (typeof fn !== 'function') {
    console.warn('Electron API 不可用')
    return Promise.resolve(null)
  }
  return fn(...args)
}

export default {
  isAvailable: () => !!window.electronAPI,
  platform: bridge.platform || '',

  // 【新】分步加载 - 选择目录
  selectFolder: safe(bridge.selectFolder),
  
  // 【新】分步加载 - 加载图片
  loadImages: safe(bridge.loadImages),
  
  // 【新】图片扫描事件
  onImagesScanned: safe(bridge.onImagesScanned),
  onThumbnailsBatch: safe(bridge.onThumbnailsBatch),
  onThumbnailsComplete: safe(bridge.onThumbnailsComplete),
  removeImageListeners: safe(bridge.removeImageListeners),

  // 【保留兼容】核心功能（一次性返回）
  generatePdf: safe(bridge.generatePdf),

  // 【新】分步PDF生成 - 显示保存对话框
  showSavePdfDialog: safe(bridge.showSavePdfDialog),
  
  // 【新】分步PDF生成 - 直接生成（不带对话框）
  generatePdfDirect: safe(bridge.generatePdfDirect || bridge.generatePdf),

  // PDF 进度监听
  onPdfProgress: safe(bridge.onPdfProgress),
  removePdfProgressListener: safe(bridge.removePdfProgressListener),

  // 菜单事件监听
  onMenuOpenFolder: safe(bridge.onMenuOpenFolder),
  onMenuExportPdf: safe(bridge.onMenuExportPdf),
  removeMenuListeners: safe(bridge.removeMenuListeners)
}
