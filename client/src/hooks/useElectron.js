/**
 * Electron 状态管理 Hook
 * 管理 Electron 连接状态、平台信息和试用状态
 */
import { ref, onMounted, onUnmounted } from 'vue'
import electron from '@/bridge/electronBridge'

export function useElectron() {
  // 立即检查 Electron 是否可用（不等待 onMounted）
  const electronAvailable = electron.isAvailable()
  
  const isElectronReady = ref(electronAvailable)
  const platform = ref(electronAvailable ? electron.platform : '')
  const process = ref(electronAvailable ? electron.process : '')
  
  // 试用状态
  const trialStatus = ref({
    valid: true,
    daysLeft: 0,
    totalDays: 7,
    message: ''
  })

  // 获取试用状态
  const fetchTrialStatus = async () => {
    if (!electronAvailable) return
    try {
      const status = await electron.getTrialStatus()
      if (status) {
        trialStatus.value = status
      }
    } catch (error) {
      console.error('获取试用状态失败:', error)
    }
  }

  onMounted(() => {
    fetchTrialStatus()
  })

  onUnmounted(() => {
    electron.removePdfProgressListener()
    electron.removeMenuListeners()
  })

  return {
    isElectronReady,
    platform,
    process,
    trialStatus
  }
}
