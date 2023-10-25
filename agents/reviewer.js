const { callGPT } = require('../modules/gpt');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

// TODO: 转换为通用代理
/**
 * 根据给定的任务和补丁差异执行代码审查，根据指定的评估标准进行评估。
 * @param {string} task - 要由补丁差异解决的用户输入任务。
 * @param {string} diff - 要审查的建议补丁差异。
 * @param {string[]} criteria - 在审查过程中要考虑的评估标准。
 * @returns {Object} - 包含审阅者对补丁差异的思考和评估的响应对象，以有效的 JSON 格式返回。
 */
async function review(task, diff, criteria) {
    const prompt =
`
USER INPUT: ${task}
YOUR TASK: You are a senior software developer reviewing a patch. Your task is to evaluate if the PATCH DIFF solves the USER INPUT. Take into account the points in the "Evaluation Criteria"
Evaluation Criteria:
${criteria.map(c => "- " + c + '\n').join('')}

PATCH DIFF - This is the suggested patch to do the USER INPUT. Lines with a "-" were removed and lines with a "+" were added:
*** PATCH START ***
${diff}
*** PATCH END ***

RESPONSE FORMAT - This is the format of your reply. Ensure the response can be parsed by JSON.parse in nodejs. Response must be valid JSON:
{
    "thoughts":
    {
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "what could be improved in the patch",
    },
    "output": {
        "evaluation": {
            "summary": "summary of changes found",
            "changes": ["list of changes found"],
            "rating": evaluation from 1 to 10 (number),
            "reason": "reason for the evaluation"
        }
    }
}
`

    const reply = await callGPT(prompt, process.env.REVIEWER_MODEL);
    return jsonParseWithValidate(reply);
}

module.exports = { review }