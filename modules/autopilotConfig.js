const path = require('path');
const autopilotDirectoryName = '.autopilot';

/**
 * 返回代码库目录中包含自动驾驶文件的目录路径。
 * @param {string} codeBaseDirectory - 代码库目录的路径。
 * @returns {string} - 自动驾驶配置子目录的路径。
 */
function getCodeBaseAutopilotDirectory(codeBaseDirectory) {
  return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
}

module.exports = { getCodeBaseAutopilotDirectory };