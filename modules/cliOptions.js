/**
* 返回使用 Yargs 库解析的命令行选项的对象。
* @param {boolean} test - 一个指示是否以测试模式运行的标志。
* @param {string} task - 要完成的任务，如果未提供则为 false。
* @returns {{
  * task: string | false, // 要完成的任务，如果未提供则为 false。
  * interactive: boolean, // 一个指示是否以交互模式运行的标志。
  * dir: string, // 包含代码文件的目录路径。
  * reindex: boolean, // 一个指示是否重新索引整个代码库的标志。
  * autoApply: boolean, // 一个指示是否自动应用更改建议的标志。
  * indexGapFill: boolean // 一个指示是否检查数据库和代码库之间的差距并进行调和的标志。
  * }}
*/
function getOptions(task, test){
  const yargs = require('yargs');

  const options = yargs
  .option('interactive', {
    alias: 'i',
    describe: '是否以交互模式运行',
    default: true,
    type: 'boolean'
  })
  .option('task', {
    alias: 't',
    describe: '要完成的任务',
    demandOption: false, // 设置初始值为 false
    default: task,
    type: 'string'
  })
  .option('dir', {
    alias: 'd',
    describe: '包含代码文件的目录路径',
    default: process.env.CODE_DIR,
    type: 'string'
  })
  .option('auto-apply', {
    alias: 'a',
    describe: '自动应用更改建议',
    default: !test,
    type: 'boolean'
  })
  .option('reindex', {
    alias: 'r',
    describe: '重新索引整个代码库',
    default: false,
    type: 'boolean'
  })
  .option('index-gap-fill', {
    alias: 'g',
    describe: '检查数据库和代码库之间的差距并进行调和',
    default: true,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;

  if (!options.interactive && !options.task) {
    console.log('请使用 -t 标志提供一个任务。');
    console.log('  node ui -t task1');
    yargs.showHelp();
    process.exit(1);
  }

  return options;
}

module.exports = { getOptions };