import inquirer from 'inquirer';
import { fileSelector } from 'inquirer-file-selector';

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
        // type: 'directory',
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
        
        let folderAnswer;
        do {
            folderAnswer = await askForFolder();
            if (!folderAnswer.isDirectory) {
                console.log('\n您选择的不是一个目录，请重新选择。\n');
            }
        } while (!folderAnswer.isDirectory);

        console.log(`选择的操作是： ${optionAnswer.option}，选择的目录是： ${folderAnswer.path}`);
    } catch (error) {
      handleErrors(error);
    }
}

main();
