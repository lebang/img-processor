/**
 * 试用期管理模块
 * 实现 7 天试用功能，包含：
 * - 硬件指纹绑定
 * - 加密存储
 * - 防篡改校验
 * - 时间回拨检测
 */

import { app, dialog, shell } from 'electron'
import { createHash, createHmac } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { getMachineId } from './machineId.js'

// ==================== 配置 ====================

/** 试用天数 */
const TRIAL_DAYS = 7

/** 加密密钥（生产环境建议使用更复杂的密钥） */
const SECRET_KEY = 'img-processor-license-secret-key-2024'

/** 存储文件名 */
const LICENSE_FILE = '.license'

// ==================== 工具函数 ====================

/**
 * 获取许可证文件路径
 * @returns {string} 许可证文件完整路径
 */
function getLicenseFilePath() {
  // 使用 userData 目录存储许可证（跨平台兼容）
  //  macOS: ~/Library/Application Support/IMG Processor/.license
  // Windows: %APPDATA%/IMG Processor/.license
  // Linux: ~/.config/IMG Processor/.license
  const userDataPath = app.getPath('userData')
  return join(userDataPath, LICENSE_FILE)
}

/**
 * 生成 HMAC 哈希（用于防篡改校验）
 * @param {string} machineId - 机器 ID
 * @param {number} startTime - 开始时间戳
 * @returns {string} 哈希值
 */
function generateHash(machineId, startTime) {
  return createHmac('sha256', SECRET_KEY)
    .update(`${machineId}-${startTime}`)
    .digest('hex')
}

/**
 * 简单加密（XOR + Base64）
 * @param {string} data - 要加密的数据
 * @returns {string} 加密后的字符串
 */
function encrypt(data) {
  const keyHash = createHash('sha256').update(SECRET_KEY).digest()
  const buffer = Buffer.from(data, 'utf8')
  const encrypted = Buffer.alloc(buffer.length)
  
  for (let i = 0; i < buffer.length; i++) {
    encrypted[i] = buffer[i] ^ keyHash[i % keyHash.length]
  }
  
  return encrypted.toString('base64')
}

/**
 * 简单解密（XOR + Base64）
 * @param {string} encryptedData - 加密的数据
 * @returns {string} 解密后的字符串
 */
function decrypt(encryptedData) {
  const keyHash = createHash('sha256').update(SECRET_KEY).digest()
  const buffer = Buffer.from(encryptedData, 'base64')
  const decrypted = Buffer.alloc(buffer.length)
  
  for (let i = 0; i < buffer.length; i++) {
    decrypted[i] = buffer[i] ^ keyHash[i % keyHash.length]
  }
  
  return decrypted.toString('utf8')
}

/**
 * 读取许可证数据
 * @returns {object|null} 许可证数据或 null
 */
function readLicenseData() {
  try {
    const filePath = getLicenseFilePath()
    if (!existsSync(filePath)) {
      return null
    }
    
    const encryptedData = readFileSync(filePath, 'utf8')
    const decryptedData = decrypt(encryptedData)
    return JSON.parse(decryptedData)
  } catch (error) {
    console.error('读取许可证数据失败:', error.message)
    return null
  }
}

/**
 * 写入许可证数据
 * @param {object} data - 要保存的数据
 */
function saveLicenseData(data) {
  try {
    const filePath = getLicenseFilePath()
    const dirPath = dirname(filePath)
    
    // 确保目录存在
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
    
    const jsonData = JSON.stringify(data)
    const encryptedData = encrypt(jsonData)
    writeFileSync(filePath, encryptedData, 'utf8')
  } catch (error) {
    console.error('保存许可证数据失败:', error.message)
    throw error
  }
}

// ==================== 主要功能 ====================

/**
 * @typedef {object} TrialStatus
 * @property {boolean} valid - 试用是否有效
 * @property {number} daysLeft - 剩余天数
 * @property {number} daysUsed - 已使用天数
 * @property {boolean} expired - 是否已过期
 * @property {boolean} [tampered] - 是否检测到篡改
 * @property {boolean} [timeRollback] - 是否检测到时间回拨
 * @property {string} [message] - 状态消息
 */

/**
 * 检查试用状态
 * @returns {TrialStatus} 试用状态信息
 */
export function checkTrial() {
  const machineId = getMachineId()
  const currentTime = Date.now()
  const trialData = readLicenseData()

  console.log('检查试用状态...:', trialData)
  
  // 首次启动，初始化试用
  if (!trialData) {
    const startTime = currentTime
    const hash = generateHash(machineId, startTime)
    
    saveLicenseData({
      machineId,
      startTime,
      lastCheckTime: currentTime,
      hash
    })
    
    return {
      valid: true,
      daysLeft: TRIAL_DAYS,
      daysUsed: 0,
      expired: false,
      message: `试用期开始，共 ${TRIAL_DAYS} 天`
    }
  }
  
  // 验证数据完整性（防篡改）
  const expectedHash = generateHash(trialData.machineId, trialData.startTime)
  if (trialData.hash !== expectedHash) {
    return {
      valid: false,
      daysLeft: 0,
      daysUsed: TRIAL_DAYS,
      expired: true,
      tampered: true,
      message: '许可证数据已被篡改'
    }
  }
  
  // 验证硬件指纹（防复制到其他机器）
  if (trialData.machineId !== machineId) {
    return {
      valid: false,
      daysLeft: 0,
      daysUsed: TRIAL_DAYS,
      expired: true,
      tampered: true,
      message: '许可证与当前设备不匹配'
    }
  }
  
  // 检测时间回拨
  if (currentTime < trialData.lastCheckTime) {
    // 时间回拨超过 1 小时视为异常
    const rollbackHours = (trialData.lastCheckTime - currentTime) / (1000 * 60 * 60)
    if (rollbackHours > 1) {
      return {
        valid: false,
        daysLeft: 0,
        daysUsed: TRIAL_DAYS,
        expired: true,
        timeRollback: true,
        message: '检测到系统时间异常'
      }
    }
  }
  
  // 更新最后检查时间
  trialData.lastCheckTime = currentTime
  saveLicenseData(trialData)
  
  // 计算剩余天数
  const elapsedMs = currentTime - trialData.startTime
  const daysUsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed)
  const expired = daysLeft === 0
  
  return {
    valid: !expired,
    daysLeft,
    daysUsed,
    expired,
    message: expired 
      ? '试用期已结束' 
      : `试用期剩余 ${daysLeft} 天`
  }
}

/**
 * 获取试用期总天数
 * @returns {number} 试用天数
 */
export function getTrialDays() {
  return TRIAL_DAYS
}

/**
 * 重置试用（仅用于开发调试）
 * @returns {boolean} 是否成功
 */
export function resetTrial() {
  try {
    const filePath = getLicenseFilePath()
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
    return true
  } catch (error) {
    console.error('重置试用失败:', error.message)
    return false
  }
}

// ==================== 弹窗处理 ====================

/**
 * 处理试用期检查（包含弹窗逻辑）
 * @param {object} options - 配置选项
 * @param {string} [options.purchaseUrl='https://your-purchase-url.com'] - 购买链接
 * @param {number} [options.remindDays=3] - 剩余多少天时提醒
 * @returns {TrialStatus|null} 试用状态，如果需要退出应用则返回 null
 */
export function handleTrialCheck(options = {}) {
  const {
    purchaseUrl = 'https://your-purchase-url.com',
    remindDays = 3
  } = options

  const trialStatus = checkTrial()
  console.log('试用状态:', trialStatus.message)

  // 试用期已过期或检测到异常
  if (!trialStatus.valid) {
    const buttons = ['购买正式版', '退出应用']
    let message = '您的 7 天试用期已结束，请购买正式版继续使用。'

    if (trialStatus.tampered) {
      message = '检测到许可证异常，请联系客服处理。'
    } else if (trialStatus.timeRollback) {
      message = '检测到系统时间异常，请校正系统时间后重试。'
    }

    const result = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'IMG Processor - 试用期已结束',
      message,
      detail: trialStatus.message,
      buttons,
      defaultId: 0,
      cancelId: 1
    })

    if (result === 0) {
      shell.openExternal(purchaseUrl)
    }

    app.quit()
    return null
  }

  // 剩余天数较少时提醒
  if (trialStatus.daysLeft <= remindDays && trialStatus.daysLeft > 0) {
    dialog.showMessageBox({
      type: 'info',
      title: 'IMG Processor - 试用期提醒',
      message: `您的试用期还剩 ${trialStatus.daysLeft} 天`,
      detail: '试用期结束后将无法继续使用，请及时购买正式版。',
      buttons: ['知道了']
    })
  }

  return trialStatus
}
