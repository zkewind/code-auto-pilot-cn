const chalk = require('chalk');

/**
 * 
 * @param {string} task - 要完成的任务。
 * @param {object} options - 一个可选的对象，包含以下属性：
 * @param {string} options.task - 要完成的任务（如果未作为第一个参数提供）。
 * @param {boolean} options.interactive - 一个标志，指示是否提示用户输入，如果没有提供任务。
 * @returns {Promise<string>} - 一个解析为要完成的任务的Promise。
 * @description 返回要完成的任务。如果任务未作为命令行参数或选项对象中提供，则提示用户输入任务。如果未提供任务或提供的任务为空字符串，则在控制台打印错误消息，并以状态码1退出进程。
*/
async function getTask(task, options){
  if (!task) task = options.task
  if (!task && options.interactive) task = await getTaskInput()
  if (!task || task =='') {
    console.log(chalk.red('未提供任务'));
    process.exit(1);
  }
  console.log(`任务：${task}`)
  return task
}

/**
 * 
 * @returns @returns {Promise<string>} - 一个解析为用户输入的任务的Promise。
 * @description 使用prompts库要求用户输入任务。用户输入的任务以字符串形式返回。该函数验证用户是否输入了非空字符串；如果没有，则提示用户再次输入任务。
 */
async function getTaskInput() {
  const prompts = require('prompts');

  const response = await prompts({
     type: 'text',
     name: 'task',
     message: '请输入您的任务（支持多行）：',
     multiline: true,
       validate: value => value.length > 0 ? true : '请输入任务'
   });

  return response.task;
}

module.exports = { getTask }