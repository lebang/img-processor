import { contextBridge, ipcRenderer } from 'electron'

// ==================== IPC 调试配置 ====================

/**
 * 是否启用调试（开发环境启用，生产环境禁用）
 */
const DEBUG_IPC = process.env.NODE_ENV !== 'production'

/**
 * IPC 类型对应的图标
 */
const IPC_ICONS = {
  'invoke': '📤',        // 发起 invoke 调用
  'invoke-result': '📥', // invoke 调用返回结果
  'invoke-error': '❌',  // invoke 调用出错
  'on': '👂',            // 监听到主进程消息
  'send': '📨',          // 发送单向消息
  'default': '📡'        // 默认图标
}

/**
 * 获取当前时间戳
 */
function getTimestamp() {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0')
}

/**
 * IPC 日志输出（输出到 DevTools Console）
 * @param {string} type - 日志类型：invoke | invoke-result | invoke-error | on | send
 * @param {string} channel - IPC 通道名称
 * @param {any} data - 传输的数据
 */
function logIpcRenderer(type, channel, data) {
  if (!DEBUG_IPC) return
  
  const timestamp = getTimestamp()
  const icon = IPC_ICONS[type] || IPC_ICONS.default
  
  console.groupCollapsed(`%c${timestamp} ${icon} [IPC ${type}] ${channel}`, 
    type === 'invoke-error' ? 'color: red' : 'color: #6b7280')
  if (data !== undefined) {
    console.log('数据:', data)
  }
  console.trace('调用堆栈')
  console.groupEnd()
}

// ==================== IPC 调用包装器 ====================

/**
 * 包装 ipcRenderer.invoke，添加调试日志
 * @param {string} channel - IPC 通道名称
 * @param {...any} args - 传递给主进程的参数
 * @returns {Promise<any>} 主进程返回的结果
 */
async function debugInvoke(channel, ...args) {
  logIpcRenderer('invoke', channel, args.length === 1 ? args[0] : args)
  try {
    const result = await ipcRenderer.invoke(channel, ...args)
    logIpcRenderer('invoke-result', channel, result)
    return result
  } catch (error) {
    logIpcRenderer('invoke-error', channel, { error: error.message })
    throw error
  }
}

/**
 * 包装 ipcRenderer.on，添加调试日志
 * @param {string} channel - IPC 通道名称
 * @param {Function} callback - 接收消息的回调函数
 */
function debugOn(channel, callback) {
  ipcRenderer.on(channel, (_event, data) => {
    logIpcRenderer('on', channel, data)
    callback(data)
  })
}

// ==================== 暴露 API 给渲染进程 ====================

contextBridge.exposeInMainWorld('electronAPI', {
  // -------- 系统信息 --------
  
  // ping-pong 测试
  ping: () => debugInvoke('ping'),
  
  // 平台信息
  platform: process.platform,
  process: {
    arch: process.arch,
    version: process.version,
    versions: { ...process.versions },
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  },

  // -------- 文件夹选择 --------
  
  // 选择目录
  selectFolder: () => debugInvoke('select-folder'),
  
  // -------- 图片加载 --------
  
  // 加载图片（分批返回缩略图）
  loadImages: (folderPath) => debugInvoke('load-images', { folderPath }),
  
  // 监听图片扫描完成（返回图片列表，无缩略图）
  onImagesScanned: (callback) => {
    debugOn('images-scanned', callback)
  },
  
  // 监听缩略图批次完成
  onThumbnailsBatch: (callback) => {
    debugOn('thumbnails-batch', callback)
  },
  
  // 监听缩略图全部完成
  onThumbnailsComplete: (callback) => {
    debugOn('thumbnails-complete', callback)
  },
  
  // 移除图片加载相关监听
  removeImageListeners: () => {
    ipcRenderer.removeAllListeners('images-scanned')
    ipcRenderer.removeAllListeners('thumbnails-batch')
    ipcRenderer.removeAllListeners('thumbnails-complete')
  },
  
  // -------- PDF 生成 --------
  
  // 生成 PDF（旧接口，保留兼容）
  generatePdf: (images, options) => debugInvoke('generate-pdf', { images, options }),
  
  // 显示保存 PDF 对话框
  showSavePdfDialog: () => debugInvoke('show-save-pdf-dialog'),
  
  // 直接生成 PDF（不带对话框）
  generatePdfDirect: (images, outputPath, options) => debugInvoke('generate-pdf-direct', { images, outputPath, options }),
  
  // 监听 PDF 生成进度
  onPdfProgress: (callback) => {
    debugOn('pdf-progress', callback)
  },
  
  // 移除 PDF 进度监听
  removePdfProgressListener: () => {
    ipcRenderer.removeAllListeners('pdf-progress')
  },

  // -------- 菜单事件 --------

  // 监听菜单事件 - 打开文件夹
  onMenuOpenFolder: (callback) => {
    debugOn('menu-open-folder', callback)
  },

  // 监听菜单事件 - 导出 PDF
  onMenuExportPdf: (callback) => {
    debugOn('menu-export-pdf', callback)
  },

  // 移除菜单事件监听
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-open-folder')
    ipcRenderer.removeAllListeners('menu-export-pdf')
  }
})
