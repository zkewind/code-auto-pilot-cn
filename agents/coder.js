const { z } = require('zod');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { getModel } = require('../modules/model');
const { saveLog } = require('../modules/fsOutput');

const promptTemplate = 
` 
# USER INPUT
{task}

# YOUR TASK
As a senior software developer, make the requested changes from the USER INPUT.
Write out new code before deleting old code.

{format_instructions}

# SOURCE CODE
{code}
` 

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    thoughts: z.object({
      text: z.string().describe('your thoughts'),
      reasoning: z.string().describe('your reasoning'),
      criticism: z.string().describe('constructive self-criticism'),
    }),
    output: z.array(
      z.object({
        fileToUpdate: z.string().describe('File to write. (can be the current file or a new file)'),
        content: z.string().describe('Full content for that file'),
      }),
    ),
  })
);

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ['task', 'code'],
  partialVariables: { format_instructions: formatInstructions },
});

/**
 * 使用高级模型异步建议更改任务的源代码。
 * @param {string} task - 要建议更改的任务。
 * @param {Object} file - 包含要格式化的代码的文件对象。
 * @param {string} file.path - 文件的路径。
 * @param {string} file.code - 要格式化的代码。
 * @returns {Promise<Array<{
 * fileToUpdate: string,
 * content: string,
 * updateDependentFiles: boolean
 * }>>} - 一个Promise，解析为表示建议更改的对象数组。
 */
async function suggestChanges(task, file) {
  const code = formatCode(file)

  const model = getModel(process.env.INDEXER_MODEL);

  const input = await prompt.format({ task, code });
  const response = await model.call(input);

  let parsedResponse
  try {
    parsedResponse = await parser.parse(response);
  } catch (e){
    const fixParser = OutputFixingParser.fromLLM(
      model,
      parser
    );
    parsedResponse = await fixParser.parse(response);
  }

  saveLog(`coder agent INPUT:\n${input}`)
  saveLog(`coder agent OUTPUT:\n${response}`)
  return parsedResponse.output;
}


/**
 * Formats the code from the given file object into a Markdown code block.
 * 
 * @param {Object} file - The file object containing the code to format.
 * @param {string} file.path - The path to the file.
 * @param {string} file.code - The code to format.
 * @returns {string} The formatted code as a Markdown code block.
 */
function formatCode(file) {
  // format code for prompt
  let code = '';
  code += `### ${file.path}`;
  code += `\n`;
  code += '```';
  code += `\n`;
  code += `${file.code}`;
  code += `\n`;
  code += '```';
  code += `\n`;
  return code
}


module.exports = { suggestChanges }