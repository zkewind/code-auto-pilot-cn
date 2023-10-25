const chalk = require('chalk');

/**
 * 搜索代码库中的空缺并通过删除不必要的文件和索引新文件或修改的文件来填充它们。
 * @param {string} codeBaseDirectory - 要填充空缺的代码库的目录路径。
 * @param {boolean} interactive - 一个标志，指示函数在执行空缺填充之前是否应提示用户进行批准。
 * @returns {Promise<void>} - 当空缺填充完成时解析的 Promise。
 */
async function indexGapFill(codeBaseDirectory, interactive) {
  const { codeBaseGapFill } = require('./codeBase');
  const ret = await codeBaseGapFill(codeBaseDirectory);
  const filesToDelete = ret.filesToDelete;
  const filesToIndex = ret.filesToIndex.concat(ret.filesToReindex);
  const numberOfGaps = filesToDelete.length + filesToIndex.length;
  if (numberOfGaps > 0) {
    if (!interactive) {
      console.log(chalk.green(`Gap fill: ${chalk.yellow(numberOfGaps)} gaps found, fixing...`));
      await gapFill(filesToDelete, codeBaseDirectory, filesToIndex);
    } else {
      tokenCount = countTokensOfFilesToIndex(filesToIndex);
      const { calculateTokensCost } = require('./gpt');
      cost = calculateTokensCost(process.env.INDEXER_MODEL, tokenCount, null, tokenCount);

      console.log(chalk.yellow(`Gap fill: ${chalk.yellow(numberOfGaps)} gaps found, estimated cost: $${chalk.yellow(cost.toFixed(4))}`));
      if (await approveGapFill()) {
        await gapFill(filesToDelete, codeBaseDirectory, filesToIndex);
      }
    }
  }
}

/**
 * 计算给定文件数组中的令牌数。
 * @param {Array} filesToIndex - 代表要索引的文件的对象数组。
 * @param {string} filesToIndex[].fileName - 文件的名称。
 * @param {string} filesToIndex[].fileContent - 文件的内容。
 * @returns {number} - 所有文件中的令牌总数。
 */
function countTokensOfFilesToIndex(filesToIndex) {
  const { countTokens } = require('./tokenHelper');

  let reindex_content;
  for (const file of filesToIndex) {
    // TODO: 为了更准确，需要添加代理函数的提示
    reindex_content += file.fileContent;
  }
  const tokenCount = countTokens(reindex_content);
  return tokenCount;
}

/**
 * @returns {Promise<boolean>} - 一个解析为布尔值的 Promise，指示是否继续修复摘要中的空缺。
 * @description 询问用户是否确认继续修复摘要中的空缺。返回一个布尔值，表示用户的回答。
 */
async function approveGapFill(){
  const prompts = require('prompts');

  const proceed = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Proceed with fixing the gap in summarizing?',
  });
  return proceed.value;
}

/**
 * @param {Array<Object>} filesToDelete - An array of objects representing files to be deleted.
 * @param {string} filesToDelete[].path - The relative path to the file to be deleted.
 * @param {string} codeBaseDirectory - The root directory of the codebase.
 * @param {Array<Object>} filesToIndex - An array of objects representing files to be indexed.
 * @param {string} filesToIndex[].filePath - The relative path to the file to be indexed.
 * @returns {Promise<void>} - A promise that resolves when all files have been processed.
 * @description Deletes files specified in the filesToDelete array, and generates file summaries for files specified in the filesToIndex array. File summaries are written to the database. If a file is both in the filesToDelete and filesToIndex arrays, it will be deleted and then indexed.
 */
async function gapFill(filesToDelete, codeBaseDirectory, filesToIndex) {
  const fs = require('fs');
  const path = require('path');

  const { deleteFile } = require('./db');
  const { generateAndWriteFileSummary } = require('./summaries');

  for (const file of filesToDelete) {
    const filePathRelative = file.path;
    await deleteFile(codeBaseDirectory, filePathRelative);
  }
  const promises = filesToIndex.map(async (file) => {
    const filePathRelative = file.filePath;
    const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative);
    const fileContent = await fs.promises.readFile(filePathFull, 'utf-8');
    await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
  });
  
  await Promise.all(promises);
}

module.exports = { indexGapFill };