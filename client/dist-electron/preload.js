"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // ping-pong 测试
  ping: () => electron.ipcRenderer.invoke("ping"),
  // 平台信息
  platform: process.platform,
  // 选择图片目录
  selectImageFolder: () => electron.ipcRenderer.invoke("select-image-folder"),
  // 生成 PDF
  generatePdf: (images, options) => electron.ipcRenderer.invoke("generate-pdf", { images, options }),
  // 监听 PDF 生成进度
  onPdfProgress: (callback) => {
    electron.ipcRenderer.on("pdf-progress", (event, data) => callback(data));
  },
  // 移除 PDF 进度监听
  removePdfProgressListener: () => {
    electron.ipcRenderer.removeAllListeners("pdf-progress");
  }
});
