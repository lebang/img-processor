const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 禁用 GPU 加速（可选，某些系统上可能需要）
// app.disableHardwareAcceleration();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // 窗口样式
    titleBarStyle: 'default',
    show: false // 先隐藏，等内容加载完毕后再显示
  });

  // 加载页面
  // 开发模式下可以加载本地服务器
  // mainWindow.loadURL('http://localhost:3000');
  
  // 生产模式加载本地 HTML 文件
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 打开开发者工具（开发时使用）
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS 上点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 通信示例
ipcMain.handle('ping', async () => {
  return 'pong';
});
