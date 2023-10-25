const { PromptTemplate } = require("langchain/prompts");
const { callGPT } = require('../modules/gpt');

/**
 * 使用模板和变量生成的提示调用 GPT 模型的异步函数。
 * @param {string} template - 一个包含要替换的变量的模板字符串。
 * @param {object} values - 要传递给提示模板的参数字典。
 * @param {object} model - 用给定的提示生成响应的 GPT 模型。
 * @returns {Promise<string>} - 一个解析为模型生成的响应的 Promise。
 */
async function callAgent(template, values, model) {
    const promptTemplate = PromptTemplate.fromTemplate(template);
    const prompt = await promptTemplate.format(values);
    const reply = await callGPT(prompt, model);

    // console.log(`Prompt: ${prompt}`);
    // console.log(`Reply:\n`);
    // console.dir(reply, { depth: null });
  
    return reply;
}

module.exports = {
    callAgent
}
