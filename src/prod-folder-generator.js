import fs from 'fs';
import path from 'path';

export const createProductionFolder = (sourceFolder) => {
    const parentDir = path.dirname(sourceFolder);
    const sourceFolderName = path.basename(sourceFolder);
    const prodFolderName = `${sourceFolderName}-prod`;
    const prodFolderPath = path.join(parentDir, prodFolderName);

    if (fs.existsSync(prodFolderPath)) {
        return { success: false, message: `目标文件夹 ${prodFolderPath} 已存在，请先删除或重命名。` };
    }

    fs.mkdirSync(prodFolderPath, { recursive: true });

    const copyFiles = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                copyFiles(srcPath, destPath);
            } else if (entry.isFile() && entry.name.toLowerCase().startsWith('1') && entry.name.toLowerCase().endsWith('.jpg')) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    };

    copyFiles(sourceFolder, prodFolderPath);
    return { success: true, message: `生产文件夹已成功创建在: ${prodFolderPath}` };
};