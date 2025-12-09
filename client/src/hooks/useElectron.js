/**
 * Electron 状态管理 Hook
 * 管理 Electron 连接状态和平台信息
 */
import { ref, onMounted, onUnmounted } from 'vue'
import electron from '@/api/electronBridge'

export function useElectron() {
  const isElectronReady = ref(false)
  const platform = ref('')

  // 检查 Electron 是否可用
  function checkElectron() {
    if (electron.isAvailable()) {
      isElectronReady.value = true
      platform.value = electron.platform
    }
  }

  // 生命周期
  onMounted(() => {
    checkElectron()
  })

  onUnmounted(() => {
    electron.removePdfProgressListener()
    electron.removeMenuListeners()
  })

  return {
    isElectronReady,
    platform
  }
}
