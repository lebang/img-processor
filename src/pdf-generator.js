import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import { decompress } from 'woff2-encoder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compressImage = (imagePath) => {
    console.log(`正在压缩图片: ${path.basename(imagePath)}`);
    return sharp(imagePath)
        .jpeg({ quality: 75, progressive: true })
        .toBuffer();
};

const getAllJpgs = (dirPath) => {
    let jpgFiles = [];
    try {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    jpgFiles = jpgFiles.concat(getAllJpgs(fullPath));
                } else {
                    const lowerCaseFile = fullPath.toLowerCase();
                    if (lowerCaseFile.endsWith('.jpg') || lowerCaseFile.endsWith('.jpeg')) {
                        jpgFiles.push(fullPath);
                    }
                }
            } catch (e) {
                console.error(`无法访问 ${fullPath}，已跳过: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(`无法读取目录 ${dirPath}，已跳过: ${e.message}`);
    }
    return jpgFiles;
};

const getTextSize = (image) => {
  const FONT_SIZE_RATIO = 10; // Smaller number -> larger font
  const fontSize = Math.max(16, Math.min(120, Math.floor(image.width / FONT_SIZE_RATIO)));
  const textHeight = fontSize * 1.5; // Approximate height for the text area
  const margin = 40;
  return { fontSize, textHeight, margin };
};

export const createPdfFromImages = (folderPath) => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ autoFirstPage: false });
        const pdfName = `${path.basename(folderPath)}.pdf`;
        const pdfPath = path.join(folderPath, pdfName);
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        const imagePaths = getAllJpgs(folderPath)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        if (imagePaths.length === 0) {
            console.log('在选定目录及其子目录中未找到 JPG 图片。');
            return resolve();
        }
        console.log(`找到了 ${imagePaths.length} 张JPG图片，正在生成PDF...`);

        // Define font path and set it
        const fontPath = path.join(__dirname, 'fonts', 'SourceHanSans.woff2');
        if (!fs.existsSync(fontPath)) {
            const fontError = new Error('字体文件 SourceHanSans.woff2 未找到，请检查 /src/fonts 目录。');
            console.error(fontError.message);
            return reject(fontError);
        }
        const fontBuffer = fs.readFileSync(fontPath);
        const decompressedFont = await decompress(fontBuffer);
        doc.font(decompressedFont);

        for (const imagePath of imagePaths) {
            try {
                const compressedBuffer = await compressImage(imagePath);
                const image = doc.openImage(compressedBuffer);
                // const image = doc.openImage(imagePath);
                const dirName = path.basename(path.dirname(imagePath));

                const { fontSize, textHeight, margin } = getTextSize(image);

                // Add a page with margins and dynamic text height
                doc.addPage({
                    size: [image.width + margin * 2, image.height + margin * 2 + textHeight],
                });

                // Draw directory name with dynamic font size
                doc.fontSize(fontSize).text(dirName, margin, margin, {
                    align: 'center',
                    width: image.width,
                });

                // Draw image below the text
                doc.image(image, margin, margin + textHeight, {
                    width: image.width,
                    height: image.height,
                });
            } catch (e) {
                console.error(`处理图片 ${path.basename(imagePath)} 时出错:`, e.message);
            }
        }

        doc.end();

        stream.on('finish', () => {
            console.log(`PDF 已成功生成在: ${pdfPath}`);
            resolve();
        });

        stream.on('error', (err) => {
            console.error(`保存 PDF 时出错:`, err.message);
            reject(err);
        });
    });
};
