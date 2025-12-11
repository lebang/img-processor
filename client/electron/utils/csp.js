import { session } from 'electron'

/**
 * CSP 策略配置对象
 * @typedef {Object} CSPDirectives
 * @property {string} defaultSrc - 默认资源加载策略
 * @property {string} scriptSrc - 脚本加载策略
 * @property {string} styleSrc - 样式加载策略
 * @property {string} imgSrc - 图片加载策略
 * @property {string} fontSrc - 字体加载策略
 * @property {string} connectSrc - 网络连接策略
 * @property {string} mediaSrc - 媒体资源策略
 * @property {string} objectSrc - 对象嵌入策略
 * @property {string} baseUri - base 标签策略
 * @property {string} formAction - 表单提交策略
 * @property {string} frameAncestors - 框架嵌套策略
 */

/**
 * 开发环境 CSP 配置
 * 宽松策略，支持 Vite HMR 和本地开发服务器
 * @type {CSPDirectives}
 */
const DEV_CSP_DIRECTIVES = {
  defaultSrc: "'self'",
  scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
  styleSrc: "'self' 'unsafe-inline' http://localhost:*",
  imgSrc: "'self' data: blob: file: http://localhost:*",
  fontSrc: "'self' data: http://localhost:*",
  connectSrc: "'self' http://localhost:* ws://localhost:*",
  mediaSrc: "'self' file:",
  objectSrc: "'none'",
  baseUri: "'self'",
  formAction: "'self'",
  frameAncestors: "'none'"
}

/**
 * 生产环境 CSP 配置
 * 严格策略，仅允许必要的资源加载
 * @type {CSPDirectives}
 */
const PROD_CSP_DIRECTIVES = {
  defaultSrc: "'self'",
  scriptSrc: "'self'",
  styleSrc: "'self' 'unsafe-inline'", // Element Plus 需要内联样式
  imgSrc: "'self' data: blob: file:",
  fontSrc: "'self' data:",
  connectSrc: "'self'",
  mediaSrc: "'self' file:",
  objectSrc: "'none'",
  baseUri: "'self'",
  formAction: "'self'",
  frameAncestors: "'none'"
}

/**
 * 将 CSP 指令对象转换为策略字符串
 * @param {CSPDirectives} directives - CSP 指令配置对象
 * @returns {string} CSP 策略字符串
 * @private
 */
function buildCSPString(directives) {
  return [
    `default-src ${directives.defaultSrc}`,
    `script-src ${directives.scriptSrc}`,
    `style-src ${directives.styleSrc}`,
    `img-src ${directives.imgSrc}`,
    `font-src ${directives.fontSrc}`,
    `connect-src ${directives.connectSrc}`,
    `media-src ${directives.mediaSrc}`,
    `object-src ${directives.objectSrc}`,
    `base-uri ${directives.baseUri}`,
    `form-action ${directives.formAction}`,
    `frame-ancestors ${directives.frameAncestors}`
  ].join('; ')
}

/**
 * 设置 HTTP 响应头的 CSP 策略
 * @param {string} cspString - CSP 策略字符串
 * @private
 */
function setCSPHeader(cspString) {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspString]
      }
    })
  })
}

/**
 * 配置 Content Security Policy
 * 根据开发/生产环境设置不同的 CSP 策略
 * 
 * @param {boolean} isDev - 是否为开发环境
 * 
 * @example
 * // 在主进程中使用
 * import { setupCSP } from './utils/csp.js'
 * 
 * const isDev = process.env.NODE_ENV === 'development'
 * setupCSP(isDev)
 */
export function setupCSP(isDev) {
  if (isDev) {
    // 开发环境：禁用 CSP 警告（Vite HMR 需要 unsafe-eval）
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
    setCSPHeader(buildCSPString(DEV_CSP_DIRECTIVES))
  } else {
    // 生产环境：使用严格的 CSP
    setCSPHeader(buildCSPString(PROD_CSP_DIRECTIVES))
  }
}

/**
 * 获取开发环境的 CSP 策略字符串
 * @returns {string} 开发环境 CSP 策略字符串
 */
export function getDevCSP() {
  return buildCSPString(DEV_CSP_DIRECTIVES)
}

/**
 * 获取生产环境的 CSP 策略字符串
 * @returns {string} 生产环境 CSP 策略字符串
 */
export function getProdCSP() {
  return buildCSPString(PROD_CSP_DIRECTIVES)
}
