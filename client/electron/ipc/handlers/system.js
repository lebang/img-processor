import { ipcMain } from 'electron'
import { checkTrial, getTrialDays } from '../../license/index.js'
import * as channels from '../channels.js'

/**
 * 注册系统相关的 IPC 处理程序
 */
export function registerSystemHandlers() {
  // 测试通信
  ipcMain.handle(channels.PING, async () => {
    return 'pong'
  })

  // 获取试用状态
  ipcMain.handle(channels.GET_TRIAL_STATUS, async () => {
    const status = checkTrial()
    return {
      ...status,
      totalDays: getTrialDays()
    }
  })
}
