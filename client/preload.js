const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：ping-pong 测试
  ping: () => ipcRenderer.invoke('ping'),
  
  // 平台信息
  platform: process.platform,
  
  // 可以添加更多 API...
  // 例如：文件操作、系统对话框等
});
