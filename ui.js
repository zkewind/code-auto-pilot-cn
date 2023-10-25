// 这个文件是用户界面。它接受用户的任务并使用AI完成任务。任务与代码相关。
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const { getSummaries, chunkSummaries, maxSummaryTokenCount } = require('./modules/summaries');
const { saveOutput, logPath, updateFile, newLog } = require('./modules/fsOutput');
const { printGitDiff } = require('./modules/gitHelper');
const { getFiles } = require('./modules/fsInput');
const { generateAndWriteFileSummary } = require('./modules/summaries');
const { getOptions } = require('./modules/cliOptions');
const { runAgent } = require('./modules/interactiveAgent');
const { getTask } = require('./modules/interactiveTask');
const { indexGapFill } = require('./modules/interactiveGapFill');
const { reindexCodeBase } = require('./modules/interactiveReindexCodeBase');
const { suggestChanges } = require('./agents/coder');
const { ChangesAdvice } = require('./agents/advisor');
const { finalAdvisor } = require('./agents/finalAdvisor');
const { getRelevantFiles } = require('./agents/getFiles');
const { tokensUsage,resetTokens } = require('./modules/gpt')

/**
 *
 * @param {string} task - 要完成的任务。
 * @param {boolean} test - 内部测试的设置。
 * @returns {Array} - 包含文件和代码的数组
 */
async function main(task, test=false, suggestionMode) {
  newLog();
  const options = getOptions(task, test);
  let codeBaseDirectory = options.dir;
  // TODO: 摆脱测试参数，应使用正常功能
  if (test){
    const testingDirectory = '/benchmarks';
    codeBaseDirectory = codeBaseDirectory + testingDirectory
  }
  const interactive = options.interactive;
  const reindex = options.reindex;
  const indexGapFillOption = options.indexGapFill;
  let autoApply;
  if (interactive){
    autoApply = false;
  } else {
    autoApply = options.autoApply;
  }

  // 初始化、重新索引或填充间隙
  const { initCodeBase } = require('./modules/init');
  await initCodeBase(codeBaseDirectory, interactive);
  if (reindex){
    await reindexCodeBase(codeBaseDirectory, process.env.INDEXER_MODEL, interactive);
  }
  if (indexGapFillOption && !reindex) {
    console.log(chalk.yellow(`检查数据库和代码库之间的间隙并进行调和。`));
    await indexGapFill(codeBaseDirectory, interactive);
  }

  // 确保我们有一个任务，如果需要的话，询问用户
  task = await getTask(task, options);

  // 重置此新任务的令牌计数器
  resetTokens()

  // 获取目录中文件的摘要
  const summaries = await getSummaries(codeBaseDirectory);
  const chunkedSummaries = chunkSummaries(summaries, maxSummaryTokenCount);
  console.log(`将摘要分成 ${chalk.yellow(chunkedSummaries.length)} 个块，每个块最多 ${chalk.yellow(maxSummaryTokenCount)} 个令牌。 (每个代理都会运行)`)

  let relevantFiles=[]
  const promises = chunkedSummaries.map(async (summaries) => {
    // 决定哪些文件与任务相关
    const relevantFilesChunk = await runAgent(getRelevantFiles, task, summaries, interactive);
    return relevantFilesChunk;
  });
  relevantFiles = await Promise.all(promises).then((results) => {
    // 将所有结果合并为一个数组
    return results.flat();
  });

  const uniqueRelevantFiles = relevantFiles.reduce((acc, current) => {
    const isDuplicate = acc.find(file => file.path === current.path);
    if (!isDuplicate) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  console.log(`${chalk.yellow(uniqueRelevantFiles.length)} 个相关文件由代理标识出：`);
  const existingUniqueRelevantFiles = uniqueRelevantFiles.filter(file => {
    filePathFull = path.posix.join(codeBaseDirectory, file.path);
    fileFound = fs.existsSync(filePathFull);
    if (!fileFound) {
      console.log(`${chalk.red(file.path)}: ${file.reason}`);
    }
    return fileFound;
  });
  
  const fileReasons = existingUniqueRelevantFiles.map(file => `${chalk.yellow(file.path)}: ${file.reason}`).join('\n');
  console.log(fileReasons+'\n');

  // 获取代理认为相关的代码文件
  let files;
  try {
    files = getFiles(codeBaseDirectory, existingUniqueRelevantFiles);
  } catch (err) {
    console.log(chalk.red(`代理已经识别出要获取的文件，但我们找不到，请尝试使用其他任务再次尝试。`));
    // TODO: 找出哪些文件是损坏的，并仅打印它们。
    const fileReasons = existingUniqueRelevantFiles.map(file => `${chalk.yellow(file.path)}: ${file.reason}`).join('\n');
    console.log(fileReasons);
    console.log(`代码库目录: ${codeBaseDirectory}`)
    process.exit(1);
  }
  if (files.length == 0) {
    console.log(chalk.red(`代理未识别出与任务相关的任何文件：${task}。\n请尝试使用其他任务再次尝试。`));
    process.exit(1);
  }

  let solutions = [];
  await Promise.all(files.map(async (file) => {
    // 对于每个文件，向编码器代理请求解决方案
    if (!suggestionMode) {
      const coderRes = await runAgent(suggestChanges, task, file, interactive);
      for (const file of coderRes){
        const filePathRelative = file.fileToUpdate;
        const fileContent = file.content;
        solutions.push({file:filePathRelative, code:fileContent})
  
        if (autoApply){
          // 这实际上将解决方案应用于文件
          const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative);
          updateFile(filePathFull, fileContent);
          await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
        }
        // TODO: 获取当前差异并将其反馈给下一个代理
      }
    } else {
      // 向建议代理请求建议
      const advice = await runAgent(ChangesAdvice, task, {relevantFiles, file}, interactive);
      solutions.push({file:file.path, code:advice})
    }
  }));

  // 调用最终顾问代理根据解决方案生成最终答案
  if (suggestionMode) {
    const finalAdvice = await runAgent(finalAdvisor, task, {solutions}, interactive);
    return { solution: finalAdvice, tokensUsage: tokensUsage() }
  }
  
  
  if (autoApply && !suggestionMode){
    // 将保存的输出发送到GPT，并要求进行完成任务所需的必要更改
    console.log(chalk.green("自动应用的解决方案："));
    printGitDiff(codeBaseDirectory);
  } else {
    const solutionsPath = saveOutput(solutions);
    console.log(chalk.green("解决方案已保存到：", solutionsPath));
  }

  console.log(chalk.green("进程日志：", logPath()));

  return solutions
}

if (require.main === module) main();

module.exports = { main }