import http from 'http';
import fs from 'fs';
import path from 'path';
import { URLSearchParams } from 'url';
import { createPdfFromImages } from './src/pdf-generator.js';

const server = http.createServer((req, res) => {
    // Serve static CSS file
    if (req.url === '/style.css') {
        const cssPath = path.join(process.cwd(), 'public', 'style.css');
        fs.readFile(cssPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('CSS file not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
            res.end(data);
        });
    } 
    // Serve main HTML page
    else if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>图片处理器</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="container">
                    <h1>PDF 生成器</h1>
                    <p>请在下方输入包含JPG图片的完整文件夹路径，然后点击生成。</p>
                    <form id="pdf-form">
                        <input type="text" name="folderPath" placeholder="例如: /Users/bangle/lebang/img-processor/test/A.幸福  大框1个 （1张横图）100x60" value="/Users/bangle/lebang/img-processor/test" required>
                        <button type="submit">
                            <span class="spinner"></span>
                            生成PDF
                        </button>
                    </form>
                    <div id="response-message" class="message"></div>
                </div>

                <script>
                    const form = document.getElementById('pdf-form');
                    const input = form.querySelector('input');
                    const button = form.querySelector('button');
                    const responseDiv = document.getElementById('response-message');

                    form.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        
                        const formData = new FormData(form);
                        const folderPath = formData.get('folderPath');

                        // Reset state
                        input.disabled = true;
                        button.classList.add('loading');
                        button.disabled = true;
                        responseDiv.style.display = 'none';
                        responseDiv.textContent = '';

                        try {
                            const response = await fetch('/run', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({ folderPath })
                            });

                            const result = await response.json();

                            responseDiv.textContent = result.message;
                            if (result.success) {
                                responseDiv.className = 'message success';
                            } else {
                                responseDiv.className = 'message error';
                            }
                            responseDiv.style.display = 'block';

                        } catch (error) {
                            responseDiv.textContent = '发生意外错误，请检查终端日志。';
                            responseDiv.className = 'message error';
                            responseDiv.style.display = 'block';
                        } finally {
                            input.disabled = false;
                            button.classList.remove('loading');
                            button.disabled = false;
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } 
    // Handle form submission
    else if (req.method === 'POST' && req.url === '/run') {
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
    } 
    // Handle 404
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 未找到');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器正在运行，请打开浏览器访问 http://localhost:${PORT}`);
});