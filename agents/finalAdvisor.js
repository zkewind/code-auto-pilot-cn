const { callAgent } = require('./genericAgent');

function formatSolutions(solutions) {
  let result = ''
  for (const file of solutions) {
    result += "File: " + file.file + '\n'
    result += file.code + '\n\n'
  }
  return result
}

const promptTemplate = 
` 
# YOUR ROLE
Explain how to solve the task using the proposals on the "Changes to files" section
Include:
- Your reasoning to the solution
- File paths and functions/variable names (optional)
- All necessary code snippets (optional)
You are allowed to edit the information coming from the file-level summaries to make the final answer coherent. 

# Task
## User input/request
{task}

# Changes to files
## This are the proposed changes for each file
{analysis}
` 

/**
 * 使用高级模型异步建议对任务的源代码进行更改。
 * @param {string} task - 要建议更改的任务。
 * @param {} file - 要应用代码的文件。
 * @returns {Promise<string>} - 一个解析为建议更改的 Promise。
 */
async function finalAdvisor(task, payload) {
  const analysis = formatSolutions(payload.solutions)
  const values = {task, analysis}
  const reply = await callAgent(promptTemplate, values, process.env.FINALADVISOR_MODEL);
  return reply;
}

module.exports = { finalAdvisor }