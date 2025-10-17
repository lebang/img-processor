
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URLSearchParams } from 'url';
import { createPdfFromImages } from './src/pdf-generator.js';

const PORT = 3000;
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // Handle API endpoint for PDF generation
    if (req.method === 'POST' && req.url === '/run') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const folderPath = params.get('folderPath');

            if (folderPath && fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
                console.log(`收到请求，开始为目录 "${folderPath}" 生成PDF...`);
                createPdfFromImages(folderPath)
                    .then(() => {
                        console.log(`PDF生成任务完成: ${folderPath}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: '✅ PDF 生成成功！文件已保存在您指定的目录中。' }));
                    })
                    .catch(err => {
                        console.error(`PDF生成任务失败: ${folderPath}`, err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: '❌ PDF 生成失败！请检查终端窗口中的错误日志。' }));
                    });
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: '❌ 错误！提供的路径无效或不是一个目录，请检查后重试。' }));
            }
        });
        return; // End execution for API requests
    }

    // Handle static file serving for GET requests
    if (req.method === 'GET') {
        let urlPath = req.url === '/' ? '/index.html' : req.url;
        const filePath = path.join(PUBLIC_DIR, urlPath);

        // Security check: Ensure the path is within the public directory
        if (!filePath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                const ext = path.extname(filePath);
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
        return;
    }

    // Default 404 for other methods
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
});

server.listen(PORT, () => {
    console.log(`服务器正在运行，请打开浏览器访问 http://localhost:${PORT}`);
});
