import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

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

export const createPdfFromImages = (folderPath) => {
    return new Promise((resolve, reject) => {
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

        for (const imagePath of imagePaths) {
            try {
                const image = doc.openImage(imagePath);
                doc.addPage({ size: [image.width, image.height] });
                doc.image(image, 0, 0, { width: image.width, height: image.height });
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
