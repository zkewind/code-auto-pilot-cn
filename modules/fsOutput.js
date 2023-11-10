const fs = require('fs');
const path = require('path');
const outputFolder = 'suggestions';
const logsDirectory = 'logs';
const logsExtension = '.md';
let logsFilename;

function newLog(){
    logsFilename = new Date().toISOString().replace(/:/g, '-');
}

/**
 * Returns the path of the log file.
 * @returns {string} The log file path.
 */
function logPath() {
    const logsDir = path.join(__dirname, '..' ,logsDirectory);
    const fileName = `${logsFilename}${logsExtension}`;
    return path.join(logsDir, fileName)
}

/**
 * 将指定的文本追加到日志文件的末尾，将日志保存到日志文件夹中。
 * @param {string} text - 要添加到日志文件的文本。
 */
function saveLog(text) {
    fs.appendFileSync(logPath(), `${text} \n\n*******\n\n`);
}

/**
 * 将给定的解决方案保存到“suggestions”文件夹中的文件，并返回创建的文件的路径。
 * @param {string} solution - 要保存到文件中的解决方案。
 * @returns {string} - 创建的文件的路径。
 */
function saveOutput(solutions) {
    // 将解决方案保存到“suggestions”文件夹中的文件
    const suggestionsDir = path.join(__dirname, '..', outputFolder);
    const fileName = `${Date.now()}.patch`;

    const filePath = path.join(suggestionsDir, fileName)
    // 从数组中获取解决方案并格式化以保存
    let content = ''
    solutions.map(file => {
        content += "File: " + file.file
        content += "\n"
        content += file.code
    })

    fs.writeFileSync(filePath, content);
    return filePath
}

/**
 *
 * @param {string} filePath - 要更新的文件的路径。
 * @param {string} content - 文件的新内容。
 * @description 使用content的内容更新filePath处的文件。
 */
function updateFile(filePath, content) {
    fs.writeFileSync(filePath, content, { flag: 'w' }, (err) => {
        if (err) {
        console.error(err);
        throw new Error("写入文件时出错" + err);
        }
        console.log(`文件${filePath}已更新。`);
    });
}

module.exports= {
    saveOutput,
    saveLog,
    logPath,
    updateFile,
    newLog
}
