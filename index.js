import inquirer from 'inquirer';
import { fileSelector } from 'inquirer-file-selector';
import { createPdfFromImages } from './pdf-generator.js';

const askForOption = () => {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'option',
            message: '选择操作?',
            choices: [
                {
                    name: '生成pdf',
                    value: 'pdf',
                },
                {
                    name: '生成最终客户文件夹',
                    value: 'prod',
                },
            ],
        },
    ]);
};

const askForFolder = () => {
    return fileSelector({
        message: '请选择目录（回车确认）：',
        root: process.cwd(),
        selectionType: 'folder',
    });
};

const handleErrors = (error) => {
    if (error.message.includes('User force closed the prompt')) {
        console.log('Prompt was canceled.');
    } else {
        console.error('An error occurred:', error);
    }
};

async function main() {
    try {
        const optionAnswer = await askForOption();
        
        console.log('请选择包含JPG图片的源目录...');
        let folderAnswer;
        do {
            folderAnswer = await askForFolder();
            if (!folderAnswer.isDirectory) {
                console.log('\n您选择的不是一个目录，请重新选择。\n');
            }
        } while (!folderAnswer.isDirectory);

        if (optionAnswer.option === 'pdf') {
            console.log('正在生成 PDF，请稍候...');
            await createPdfFromImages(folderAnswer.path);
        } else if (optionAnswer.option === 'prod') {
            console.log('生成最终客户文件夹的功能尚未实现。');
        }

    } catch (error) {
      handleErrors(error);
    }
}

main();
