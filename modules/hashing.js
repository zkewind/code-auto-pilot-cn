const crypto = require('crypto');

/**
 * 计算指定文件内容的哈希值。
 * @param {string} fileContent - 要计算哈希值的文件内容。
 * @returns {string} - 指定文件内容的哈希值。
*/
function hashFile(fileContentInput){
    const fileContent = fileContentInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    return hash;
}

module.exports = hashFile;