const { loadFiles } = require('./fsInput');

/**
 * 计算目录的总大小，通过对目录中所有文件的长度求和。
 * @param {string} dir - 要计算大小的目录路径。
 * @returns {number} - 目录的总大小（以字节为单位）。
 */
function getDirectoryTokensCount(dir) {
  let directoryTokensCount = 0;

  const files = loadFiles(dir);
  for (const file of files) {
    directoryTokensCount += file.fileTokensCount;
  }

  return directoryTokensCount;
};

module.exports = getDirectoryTokensCount;
