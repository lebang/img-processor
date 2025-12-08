"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // ping-pong 测试
  ping: () => ipcRenderer.invoke("ping"),
  // 平台信息
  platform: process.platform
  // 后续可扩展更多 API
  // 例如：文件选择、系统对话框等
});
