const prompts = require('prompts');
const chalk = require('chalk');

/**
 * @description 异步函数，使用给定的变量运行代理函数。
 * @param {function} agentFunction - 要异步执行的代理函数。
 * @param {any} var1 - 作为参数传递给代理函数的第一个变量。
 * @param {any} var2 - 作为参数传递给代理函数的第二个变量。
 * @param {boolean} interactive=false - 一个布尔值，指示是否在运行代理函数后提示用户进行批准。
 * @returns {Promise<any>} 如果不是交互模式，则返回代理函数的返回值的 Promise；否则根据用户输入返回或拒绝 Promise。
*/
async function runAgent(agentFunction, var1, var2, interactive=false){
  console.log(`代理 ${chalk.yellow(agentFunction.name)} 正在运行。`);
  if (!interactive){
    return await agentFunction(var1, var2);
  }

  // 交互模式
  res = await agentFunction(var1, var2);
  console.dir(res, { depth: null })
  const proceed = await prompts({
    type: 'select',
    name: 'value',
    message: 'Approve agent\'s reply ?',
    choices: [
      { title: 'Approve - continue', value: 'continue' },
      { title: 'Retry - Rerun agent', value: 'retry'},
      { title: 'Abort', value: 'abort'}
    ]
  });
  if (proceed.value === 'continue') return res
  if (proceed.value === 'retry') await runAgent(agentFunction, var1, var2, interactive)
  if (proceed.value === 'abort') process.exit(1)
}

module.exports = { runAgent }