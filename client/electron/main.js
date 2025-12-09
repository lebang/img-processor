import { app, BrowserWindow } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createMenu } from './menu.js'
import { registerIpcHandlers, setMainWindow } from './ipc/index.js'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 禁用 Autofill 相关警告
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')

// 设置应用名称（macOS 菜单栏显示）
// 注意：开发模式下 macOS 菜单栏左侧显示的是 Electron 可执行文件名，无法通过代码修改
// 只有打包后才会显示 package.json 中的 productName
if (process.platform === 'darwin') {
  app.setName('IMG Processor')
}

// 判断是否为开发模式
// VITE_DEV_SERVER_URL 由 vite-plugin-electron 自动注入
const isDev = !!process.env.VITE_DEV_SERVER_URL

let mainWindow = null

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      // 允许加载本地文件（用于图片预览）
      webSecurity: false
    },
    titleBarStyle: 'default',
    show: false
  })

  // 设置主窗口引用（供 IPC 模块使用）
  setMainWindow(mainWindow)

  // 根据环境加载不同的页面
  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // 开发模式下打开开发者工具（独立窗口）
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    setMainWindow(null)
  })
}

// 应用初始化
app.whenReady().then(() => {
  // 注册 IPC 处理程序（需要在创建窗口前注册）
  registerIpcHandlers()
  
  createWindow()
  createMenu(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      createMenu(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
