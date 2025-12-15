import { app, Menu, shell } from 'electron'
import * as channels from './ipc/channels.js'

/**
 * 创建应用菜单
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
export function createMenu(mainWindow) {
  const isMac = process.platform === 'darwin'

  const template = [
    // macOS 应用菜单（应用名称）
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: '关于 ' + app.name, role: 'about' },
        { type: 'separator' },
        { label: '设置...', accelerator: 'Cmd+,', enabled: false },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: '隐藏 ' + app.name, role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出 ' + app.name, role: 'quit' }
      ]
    }] : []),

    // 文件菜单
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件夹...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send(channels.MENU_OPEN_FOLDER)
          }
        },
        { type: 'separator' },
        {
          label: '导出 PDF...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send(channels.MENU_EXPORT_PDF)
          }
        },
        { type: 'separator' },
        isMac ? { label: '关闭窗口', role: 'close' } : { label: '退出', role: 'quit' }
      ]
    },

    // 编辑菜单
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        ...(isMac ? [
          { label: '粘贴并匹配样式', role: 'pasteAndMatchStyle' },
          { label: '删除', role: 'delete' },
          { label: '全选', role: 'selectAll' },
        ] : [
          { label: '删除', role: 'delete' },
          { type: 'separator' },
          { label: '全选', role: 'selectAll' }
        ])
      ]
    },

    // 视图菜单
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },

    // 窗口菜单
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '缩放', role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { label: '前置全部窗口', role: 'front' },
        ] : [
          { label: '关闭', role: 'close' }
        ])
      ]
    },

    // 帮助菜单
    {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '了解更多',
          click: async () => {
            await shell.openExternal('https://github.com')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
