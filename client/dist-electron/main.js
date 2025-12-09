"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const fs = require("fs");
const url = require("url");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const woff2Encoder = require("woff2-encoder");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __filename$1 = url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
electron.app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication");
const isDev = !!process.env.VITE_DEV_SERVER_URL;
const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
async function generateThumbnail(imagePath, maxWidth = 400, maxHeight = 400) {
  try {
    const buffer = await sharp(imagePath).resize(maxWidth, maxHeight, {
      fit: "inside",
      // 保持比例，不裁剪
      withoutEnlargement: true
      // 如果图片比目标小，不放大
    }).jpeg({ quality: 70 }).toBuffer();
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error(`生成缩略图失败: ${imagePath}`, err.message);
    return null;
  }
}
async function getAllImages(dir, baseDir = dir) {
  const images = [];
  try {
    const entries = await promises.readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      try {
        const fileStat = await promises.stat(fullPath);
        if (fileStat.isDirectory()) {
          const subImages = await getAllImages(fullPath, baseDir);
          images.push(...subImages);
        } else if (fileStat.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
            images.push({
              name: entry,
              path: fullPath,
              relativePath: path.relative(baseDir, fullPath)
              // 相对路径，用于显示
            });
          }
        }
      } catch (err) {
        console.error(`无法访问文件: ${fullPath}`, err);
      }
    }
  } catch (err) {
    console.error(`无法读取目录: ${dir}`, err);
  }
  return images;
}
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname$1, "preload.js"),
      // 允许加载本地文件（用于图片预览）
      webSecurity: false
    },
    titleBarStyle: "default",
    show: false
  });
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("ping", async () => {
  return "pong";
});
electron.ipcMain.handle("select-image-folder", async () => {
  const result = await electron.dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "选择图片目录"
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, images: [] };
  }
  const folderPath = result.filePaths[0];
  try {
    const images = await getAllImages(folderPath);
    images.sort((a, b) => a.relativePath.localeCompare(b.relativePath, void 0, { numeric: true }));
    console.log(`开始生成 ${images.length} 张缩略图...`);
    const thumbnailPromises = images.map(async (image) => {
      const thumbnail = await generateThumbnail(image.path);
      return { ...image, thumbnail };
    });
    const imagesWithThumbnails = await Promise.all(thumbnailPromises);
    console.log("缩略图生成完成");
    return {
      canceled: false,
      folderPath,
      images: imagesWithThumbnails
    };
  } catch (error) {
    console.error("读取目录失败:", error);
    return { canceled: false, error: error.message, images: [] };
  }
});
electron.ipcMain.handle("generate-pdf", async (event, { images, options = {} }) => {
  try {
    const saveResult = await electron.dialog.showSaveDialog(mainWindow, {
      title: "保存 PDF 文件",
      defaultPath: "output.pdf",
      filters: [{ name: "PDF 文件", extensions: ["pdf"] }]
    });
    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, canceled: true };
    }
    const outputPath = saveResult.filePath;
    const totalImages = images.length;
    return new Promise(async (resolve) => {
      try {
        const doc = new PDFDocument({ autoFirstPage: false });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        const fontPath = path.join(__dirname$1, "fonts", "SourceHanSans.woff2");
        if (fs.existsSync(fontPath)) {
          try {
            const fontBuffer = fs.readFileSync(fontPath);
            const decompressedFont = await woff2Encoder.decompress(fontBuffer);
            doc.font(decompressedFont);
          } catch (fontErr) {
            console.error("字体加载失败，使用默认字体:", fontErr.message);
          }
        } else {
          console.warn("字体文件未找到，使用默认字体");
        }
        const margin = 40;
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          mainWindow.webContents.send("pdf-progress", {
            current: i + 1,
            total: totalImages,
            percent: Math.round((i + 1) / totalImages * 100)
          });
          try {
            console.log(`正在压缩图片: ${path.basename(image.path)}`);
            const compressedBuffer = await sharp(image.path).jpeg({ quality: 75, progressive: true }).toBuffer();
            const pdfImage = doc.openImage(compressedBuffer);
            const dirName = path.basename(path.dirname(image.path));
            const FONT_SIZE_RATIO = 10;
            const fontSize = Math.max(16, Math.min(120, Math.floor(pdfImage.width / FONT_SIZE_RATIO)));
            const textHeight = fontSize * 1.5;
            doc.addPage({
              size: [pdfImage.width + margin * 2, pdfImage.height + margin * 2 + textHeight]
            });
            doc.fontSize(fontSize).text(dirName, margin, margin, {
              align: "center",
              width: pdfImage.width
            });
            doc.image(pdfImage, margin, margin + textHeight, {
              width: pdfImage.width,
              height: pdfImage.height
            });
          } catch (imgError) {
            console.error(`处理图片失败: ${image.path}`, imgError.message);
          }
        }
        doc.end();
        stream.on("finish", () => {
          console.log(`PDF 已成功生成: ${outputPath}`);
          electron.shell.showItemInFolder(outputPath);
          resolve({
            success: true,
            outputPath,
            totalPages: images.length
          });
        });
        stream.on("error", (err) => {
          console.error("保存 PDF 时出错:", err.message);
          resolve({
            success: false,
            error: String(err.message || "保存文件时出错")
          });
        });
      } catch (error) {
        console.error("生成 PDF 失败:", error);
        resolve({
          success: false,
          error: String(error.message || error || "生成 PDF 时发生未知错误")
        });
      }
    });
  } catch (outerError) {
    console.error("generate-pdf 外层错误:", outerError);
    return {
      success: false,
      error: String(outerError.message || outerError || "处理 PDF 请求时发生错误")
    };
  }
});
