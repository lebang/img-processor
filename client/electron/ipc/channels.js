/**
 * IPC 通道名称常量
 * 统一管理所有 IPC 通道，避免硬编码字符串
 */

// ==================== 系统相关 ====================

/** 连接测试 */
export const PING = 'ping'

/** 获取试用状态 */
export const GET_TRIAL_STATUS = 'get-trial-status'

// ==================== 文件夹选择 ====================

/** 选择文件夹 */
export const SELECT_FOLDER = 'select-folder'

// ==================== 图片加载 ====================

/** 加载图片 */
export const LOAD_IMAGES = 'load-images'

/** 图片扫描完成（主进程 -> 渲染进程） */
export const IMAGES_SCANNED = 'images-scanned'

/** 缩略图批次完成（主进程 -> 渲染进程） */
export const THUMBNAILS_BATCH = 'thumbnails-batch'

/** 缩略图全部完成（主进程 -> 渲染进程） */
export const THUMBNAILS_COMPLETE = 'thumbnails-complete'

// ==================== PDF 生成 ====================

/** 显示保存 PDF 对话框 */
export const SHOW_SAVE_PDF_DIALOG = 'show-save-pdf-dialog'

/** 直接生成 PDF */
export const GENERATE_PDF_DIRECT = 'generate-pdf-direct'

/** PDF 生成进度（主进程 -> 渲染进程） */
export const PDF_PROGRESS = 'pdf-progress'

// ==================== 菜单事件（主进程 -> 渲染进程） ====================

/** 菜单：打开文件夹 */
export const MENU_OPEN_FOLDER = 'menu-open-folder'

/** 菜单：导出 PDF */
export const MENU_EXPORT_PDF = 'menu-export-pdf'

// ==================== 导出所有通道（便于遍历） ====================

export const ALL_CHANNELS = {
  // invoke 通道（双向）
  invoke: [
    PING,
    GET_TRIAL_STATUS,
    SELECT_FOLDER,
    LOAD_IMAGES,
    SHOW_SAVE_PDF_DIALOG,
    GENERATE_PDF_DIRECT
  ],
  // send 通道（主进程 -> 渲染进程，单向）
  send: [
    IMAGES_SCANNED,
    THUMBNAILS_BATCH,
    THUMBNAILS_COMPLETE,
    PDF_PROGRESS,
    MENU_OPEN_FOLDER,
    MENU_EXPORT_PDF
  ]
}
