import { app, BrowserWindow, session } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createMenu } from './menu.js'
import { registerIpcHandlers, setMainWindow } from './ipc/index.js'
import { setupCSP } from './utils/csp.js'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 禁用 Autofill 相关警告和其他开发环境噪音
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')
// 禁用 DevTools 的自动填充功能
app.commandLine.appendSwitch('disable-blink-features', 'AutofillAddressProfileEnabled,AutofillCreditCardEnabled')

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
      // 启用 web 安全，通过 CSP 控制资源加载
      webSecurity: true
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
      
      // 禁用 DevTools 中的 Autofill 功能，避免控制台警告
      // mainWindow.webContents.on('devtools-opened', () => {
      //   mainWindow.webContents.devToolsWebContents?.executeJavaScript(`
      //     // 抑制 Autofill 相关的协议错误
      //     const originalError = console.error;
      //     console.error = (...args) => {
      //       const msg = args.join(' ');
      //       if (msg.includes('Autofill.enable') || msg.includes('Autofill.setAddresses')) {
      //         return; // 忽略 Autofill 相关错误
      //       }
      //       originalError.apply(console, args);
      //     };
      //   `)
      // })
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    setMainWindow(null)
  })
}

// 应用初始化
// app.enableSandbox()
app.whenReady().then(() => {
  // 设置 CSP（需要在创建窗口前设置）
  setupCSP(isDev)
  
  // 注册 IPC 处理程序（需要在创建窗口前注册）
  registerIpcHandlers()
  console.log('IPC handlers registered')
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
