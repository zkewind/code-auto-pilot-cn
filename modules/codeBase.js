const { loadFiles } = require('./fsInput');
const { generateAndWriteFileSummary } = require('./summaries');
const { calculateTokensCost } = require('./gpt');
const chalk = require('chalk');

/**
 * @description 这个函数将给定代码库目录中的文件与数据库中的文件进行比较。
 * 它识别出存在于数据库中但不存在于文件系统中的文件，存在于文件系统中但不存在于数据库中的文件，以及在文件系统和数据库中都被修改的文件。
 * @param {string} codeBaseDirectory - 要索引的代码库的目录路径。
 * @returns {Promise<{
* filesToDelete: Array<{
  * path: string, // 要从数据库中删除的文件的路径。
  * timestamp: string, // 文件在数据库中上次修改的时间戳。
  * hash: string // 数据库中文件内容的哈希值。
  * }>,
  * filesToIndex: Array<{
  * filePath: string, // 文件在文件系统中的路径。
  * fileTimestamp: string, // 文件在文件系统上次修改的时间戳。
  * fileContent: string // 文件在文件系统中的内容。
  * }>,
  * filesToReindex: Array<{
  * filePath: string, // 文件在文件系统中的路径。
  * fileTimestamp: string, // 文件在文件系统上次修改的时间戳。
  * fileContent: string, // 文件在文件系统中的内容。
  * dbTimestamp: string, // 文件在数据库中上次修改的时间戳。
  * dbHash: string // 数据库中文件内容的哈希值。
  * }>
  * }>} - 一个 Promise，解析为包含以下数组的对象：
 * filesToDelete: 一个包含表示存在于数据库中但不存在于文件系统中的文件的对象的数组。
 * filesToIndex: 一个包含表示存在于文件系统中但不存在于数据库中的文件的对象的数组。
 * filesToReindex: 一个包含表示在文件系统和数据库中都被修改的文件的对象的数组。
*/
async function codeBaseGapFill(codeBaseDirectory){
  const { getDBFiles } = require('./db');
  const dbFiles = await getDBFiles(codeBaseDirectory);
  const fsFiles = loadFiles(codeBaseDirectory);

  // Find files that exist in the DB but not on the filesystem
  const filesToDelete = dbFiles.filter(dbFile =>
    !fsFiles.find(fsFile => fsFile.filePath === dbFile.path)
  );

  // Find files that exist on the filesystem but not in the DB
  const filesToIndex = fsFiles.filter(fsFile =>
    !dbFiles.find(dbFile => dbFile.path === fsFile.filePath)
  );

  // Find files that have been modified on both the filesystem and in the DB
  const filesToReindex = fsFiles.filter(fsFile => {
    const dbFile = dbFiles.find(dbFile => dbFile.path === fsFile.filePath);
    return dbFile && dbFile.hash !== fsFile.fileHash;
  });

  return {
    filesToDelete,
    filesToIndex,
    filesToReindex,
  };
}

/**
 * Calculates the cost of a project by summing the cost of all files in the specified directory.
 * @param {string} codeBaseDirectory - The directory to calculate the project cost for.
 * @returns {number} - The cost of the project in tokens.
 */
async function codeBaseFullIndex(codeBaseDirectory){
    const files = loadFiles(codeBaseDirectory);
  
    for (const file of files) {
      const fileContent = file.fileContent;
      const filePathRelative = file.filePath;
  
      await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
    }
};


/**
 * 
 * Calculates and displays the estimated size and cost of a project based on the number of tokens in a given directory path.
 * @param {string} directoryPath - The path to the directory containing the project files.
 * @param {object} model - The cost model to use for calculating the cost.
 */
function printCostEstimation(directoryPath, model){
  const getDirectoryTokensCount = require('./directoryHelper');
  tokenCount = getDirectoryTokensCount(directoryPath)
  cost = calculateTokensCost(model, tokenCount, null, tokenCount)
  
  console.log(`Project size: ~${tokenCount} tokens, estimated cost: $${chalk.yellow(cost.toFixed(4))}`);
}

/**
 * Asks the user for approval to proceed with summarizing the project.
 * @returns {boolean} - Whether the user has approved the indexing.
 */
async function approveIndexing(){
  const prompts = require('prompts');

  const proceed = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Proceed with summarizing the project?',
  });
  return proceed.value;
}

/**
 * Indexes the full codebase interactively.
 * @param {string} codeBaseDirectory - The directory of the codebase to be indexed.
 * @param {object} model - The model used for indexing.
 * @returns {Promise<void>}
 */
async function codeBaseFullIndexInteractive(codeBaseDirectory, model){
    printCostEstimation(codeBaseDirectory, model);

    if (await approveIndexing()) {
        await codeBaseFullIndex(codeBaseDirectory);
    } else {
        console.log('Aborted summarizing the project.');
    }
}


module.exports = { codeBaseFullIndex, codeBaseFullIndexInteractive, codeBaseGapFill }