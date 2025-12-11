/**
 * Electron 状态管理 Hook
 * 管理 Electron 连接状态和平台信息
 */
import { ref, onUnmounted } from 'vue'
import electron from '@/bridge/electronBridge'

export function useElectron() {
  // 立即检查 Electron 是否可用（不等待 onMounted）
  const electronAvailable = electron.isAvailable()
  
  const isElectronReady = ref(electronAvailable)
  const platform = ref(electronAvailable ? electron.platform : '')
  const process = ref(electronAvailable ? electron.process : '')

  onUnmounted(() => {
    electron.removePdfProgressListener()
    electron.removeMenuListeners()
  })

  return {
    isElectronReady,
    platform,
    process
  }
}
