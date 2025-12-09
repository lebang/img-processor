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

  // 核心功能
  selectImageFolder: safe(bridge.selectImageFolder),
  generatePdf: safe(bridge.generatePdf),

  // PDF 进度监听
  onPdfProgress: safe(bridge.onPdfProgress),
  removePdfProgressListener: safe(bridge.removePdfProgressListener),

  // 菜单事件监听
  onMenuOpenFolder: safe(bridge.onMenuOpenFolder),
  onMenuExportPdf: safe(bridge.onMenuExportPdf),
  removeMenuListeners: safe(bridge.removeMenuListeners)
}
