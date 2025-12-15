/**
 * 硬件指纹生成模块
 * 使用 native-machine-id 获取机器唯一标识
 */

import { getMachineIdSync } from 'native-machine-id'

/**
 * 获取机器唯一标识（同步方式）
 * native-machine-id 会根据不同平台获取：
 * - Windows: 注册表中的 MachineGuid
 * - macOS: IOPlatformUUID
 * - Linux: /var/lib/dbus/machine-id 或 /etc/machine-id
 * @returns {string} 机器唯一 ID
 */
export function getMachineId() {
  try {
    const id = getMachineIdSync()
    if (id) {
      return id
    }
    throw new Error('获取到空的机器 ID')
  } catch (error) {
    console.error('获取机器 ID 失败:', error)
    // 降级方案：返回一个基于时间的随机 ID（不推荐，仅作为兜底）
    return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
