
/**
 * 异步重新索引位于指定目录的代码库，使用指定的模型进行索引。
 * @param {string} codeBaseDirectory - 代码库目录的路径。
 * @param {Object} model - 用于索引代码库的模型。
 * @param {boolean} interactive - 一个标志，指示是否使用交互式索引。
 * @returns {Promise} 当索引过程完成时解析的 Promise。
 */
async function reindexCodeBase(codeBaseDirectory, model, interactive) {
  if (interactive) {
    const { codeBaseFullIndexInteractive } = require('./codeBase');
    await codeBaseFullIndexInteractive(codeBaseDirectory, model);
  } else {
    const { codeBaseFullIndex } = require('./codeBase');
    await codeBaseFullIndex(codeBaseDirectory, model);
  }
}

module.exports = { reindexCodeBase }