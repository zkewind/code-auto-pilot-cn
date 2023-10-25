const simpleGit = require('simple-git');

/**
 * 作为字符串返回git diff的输出。
 */
async function getGitDiff(dir) {
  try {
    const git = simpleGit(dir);
    const diff = await git.diff();
    return diff;
  } catch (error) {
    console.error(`执行git diff时出错: ${error}`);
    return '';
  }
}

/**
 * 将git diff的输出打印到控制台。
 */
async function printGitDiff(dir) {
  const diff = await getGitDiff(dir);
  console.log(`Git diff输出:\n${diff}`);
}

module.exports = {
    getGitDiff,
    printGitDiff
}