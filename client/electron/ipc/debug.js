import { ipcRenderer } from 'electron'

/**
 * IPC 调试工具
 * 用于在渲染进程中输出 IPC 调用日志到 DevTools Console
 */

// ==================== 配置 ====================

/**
 * 是否启用调试（开发环境启用，生产环境禁用）
 */
export const DEBUG_IPC = process.env.NODE_ENV !== 'production'

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

// ==================== 工具函数 ====================

/**
 * 获取当前时间戳
 * @returns {string} 格式化的时间戳 HH:mm:ss.SSS
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
function logIpc(type, channel, data) {
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

// ==================== IPC 包装器 ====================

/**
 * 包装 ipcRenderer.invoke，添加调试日志
 * @param {string} channel - IPC 通道名称
 * @param {...any} args - 传递给主进程的参数
 * @returns {Promise<any>} 主进程返回的结果
 */
export async function debugInvoke(channel, ...args) {
  logIpc('invoke', channel, args.length === 1 ? args[0] : args)
  try {
    const result = await ipcRenderer.invoke(channel, ...args)
    logIpc('invoke-result', channel, result)
    return result
  } catch (error) {
    logIpc('invoke-error', channel, { error: error.message })
    throw error
  }
}

/**
 * 包装 ipcRenderer.on，添加调试日志
 * @param {string} channel - IPC 通道名称
 * @param {Function} callback - 接收消息的回调函数
 */
export function debugOn(channel, callback) {
  ipcRenderer.on(channel, (_event, data) => {
    logIpc('on', channel, data)
    callback(data)
  })
}

/**
 * 移除指定通道的所有监听器
 * @param {string} channel - IPC 通道名称
 */
export function removeAllListeners(channel) {
  ipcRenderer.removeAllListeners(channel)
}

/**
 * 批量移除多个通道的监听器
 * @param {string[]} channels - IPC 通道名称数组
 */
export function removeListeners(channels) {
  channels.forEach(channel => ipcRenderer.removeAllListeners(channel))
}
