require('dotenv').config()
const { countTokens } = require('./tokenHelper')
const chalk = require('chalk');
const path = require('path');
const { parseFileContent } = require('./fsInput');
const { getDB, insertOrUpdateFile } = require('./db');

const summaryStringDelimiter = "\n---\n";
const maxTokenSingleFile = process.env.MAX_TOKEN_COUNT_SINGLE_FILE;
const maxSummaryTokenCount = process.env.MAX_TOKEN_COUNT_SUMMARIES_CHUNK;

const types = {
  FileObject: {
    path: "string",
    code: "string",
  },
};

/**
 * 将一个摘要字符串数组分成最大长度为maxChunkLength的块。
 * @param {string} summaries - 要分块的摘要字符串数组。
 * @param {number} maxChunkLength - 每个块的最大长度。
 * @returns {string[]} 一个数组，其中每个子数组包含最多maxChunkLength个字符的摘要字符串。
 * @throws {Error} 如果单个摘要字符串的长度超过maxChunkLength。
 */
function chunkSummaries(summaries, maxChunkLength) {
  maxChunkLength = parseInt(maxChunkLength);
  const summaryChunks = [];
  let currentChunk = "";
  summariesArray = summaries.split(summaryStringDelimiter);

  for (const summary of summariesArray) {
    const delimitedSummary = summary + summaryStringDelimiter;
    const currentSummaryTokens = countTokens(summary);

    if (currentSummaryTokens > maxChunkLength) {
      throw new Error('单个摘要太大');
    }

    const currentChunkTokens = countTokens(currentChunk);
    if (currentChunkTokens + currentSummaryTokens > maxChunkLength) {
      // remove last delimiter summaryStringDelimiter from currentChunk
      currentChunk = currentChunk.slice(0, -summaryStringDelimiter.length);
      summaryChunks.push(currentChunk);
      // new summary chunk
      currentChunk = delimitedSummary;
    } else {
      currentChunk += delimitedSummary;
    }
  }

  currentChunk = currentChunk.slice(0, -summaryStringDelimiter.length);
  summaryChunks.push(currentChunk); // Push last chunk
  return summaryChunks;
}

/**
 * 获取所有的.ai.txt文件（摘要）
 * @param {boolean} test - 如果为true，则仅读取“benchmarks”目录中的文件。
 * @returns {Promise<string>} 包含所有摘要串联在一起的字符串。
 */
async function readAllSummaries(codeBaseDirectory) {
  const db = getDB(codeBaseDirectory);
  const sql = `
  SELECT path, summary
  FROM files`;
  const summaries = await new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

  if (typeof summaries === 'undefined' || summaries.length === 0) {
    console.log("数据库中找不到匹配的文件。需要进行索引。");
    throw new Error("没有摘要无法运行。需要进行索引。");
  }

  let summariesString = "";
  for (const summary of summaries) {
    try {
      summariesString += `File Path: ${summary.path}\nSummary:\n${summary.summary}${summaryStringDelimiter}`;
    } catch (error) {
      console.error("从数据库读取摘要时出错：", error);
    }
  }
  return summariesString;
}

/**
 * 获取摘要并进行验证。
 * @param {boolean} test - 用于内部测试的设置。
 * @param {string} codeBaseDirectory - 要搜索摘要的目录。
 * @returns {Promise<Array<Summary>>} 一个解析为摘要对象数组的 Promise。
 */
async function getSummaries(codeBaseDirectory){
  const summaries = await readAllSummaries(codeBaseDirectory);
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  console.log(`摘要中的令牌数：${chalk.yellow(summariesTokenCount)}`)

  return summaries
}


/**
 * 处理文件，生成摘要并将摘要写入新文件。
 * @param {string} codeBaseDirectory - 正在处理的文件所在的目录。
 * @param {string} filePathRelative - 正在处理的文件的相对路径。
 * @param {string} fileContent - 正在处理的文件的内容。
 */
async function generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent) {
  const { fileSummary } = require('../agents/indexer');

  const filePathFull = path.join(codeBaseDirectory, filePathRelative);
  const parsedFile = parseFileContent(codeBaseDirectory, filePathFull, fileContent);
  const fileTokensCount = parsedFile.fileTokensCount;

  console.log(`处理文件：${chalk.yellow(filePathRelative)}`);
  if (fileTokensCount > maxTokenSingleFile) {
    console.log(chalk.red('文件太大'));
    return;
  }
  if (fileTokensCount == 0) {
    console.log(chalk.yellow('文件为空'));
    return;
  }

  try {
    const output = await fileSummary(filePathRelative, fileContent);

    if (output) {
      // 关键词
      let keywordsString = "";
      keywords = output.keywords;
      for (const keyword of keywords){
        keywordsString += `${keyword.term} - ${keyword.definition}\n`;
      }
      // 函数
      let functionsString = `functions: ${output.functions}`;
      const summary = output.summary + "\n" + functionsString + "\n" + keywordsString;
      // dependenciesLibs
      let dependenciesLibsString = "";
      for (const dependenciesLib of output.dependenciesLibs){
        dependenciesLibsString += `${dependenciesLib}, `;
      }
      // 保存到数据库
      insertOrUpdateFile(codeBaseDirectory, parsedFile, summary, dependenciesLibsString);

      console.log(`${chalk.green(`更新了 `)}${chalk.yellow(filePathRelative)}${chalk.green(` 的摘要`)}`);
    }
  } catch (error) {
    console.error(`处理文件时出错：${filePathRelative}`, error);
  }
}

module.exports = {
    readAllSummaries,
    types,
    getSummaries,
    chunkSummaries,
    maxSummaryTokenCount,
    generateAndWriteFileSummary
}
