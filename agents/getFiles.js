const { z } = require('zod');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { getModel } = require('../modules/model');
const { saveLog } = require('../modules/fsOutput');

const promptTemplate = 
`
# User Input
## This is what the user requested
{task}

# Your Role
## This is your role
Identify the files needed for the user input. Don't include new files. Also explain why the file was selected.
Take into consideration that "user inputs" can be questions, code changes, reports of bugs or others. Reply accordingly.

{format_instructions}

# CONTEXT
## This is the context of the project
{summaries}
`;

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    thoughts: z.object({
      text: z.string().describe('your thoughts'),
      reasoning: z.string().describe('your reasoning'),
      criticism: z.string().describe('constructive self-criticism'),
      speak: z.string().describe('summary of your thoughts to say to user'),
    }),
    output: z.object({
      relevantFiles: z.array(
        z.object({
          path: z.string().describe('path to file'),
          reason: z.string().describe('reason why the file was selected'),
          task: z.string().describe('what will be implemented in this file'),
          exists: z.boolean().describe('true if the file already exists or false if the file needs to be created'),
        })
      ).describe('relevant files to implement the user input'),
    }),
  })
);

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ['task', 'summaries'],
  partialVariables: { format_instructions: formatInstructions },
});


/**
 * 给定一个任务和一些摘要，返回一个包含相关文件及其选择原因的列表。
 *
 * @param task - 要执行的任务
 * @param summaries - 相关上下文的摘要
 * @returns {Promise<Array<{
 *   path: string,      // 相关文件的路径。
 *   reason: string,    // 选择该文件的原因。
 *   task: string,      // 在该文件中将要实现的任务。
 * }>>>}                // 给定任务的相关文件数组。
 */
async function getRelevantFiles(task, summaries) {
	const model = getModel(process.env.GET_FILES_MODEL);

	const input = await prompt.format({ task, summaries });
  saveLog(`getFiles agent INPUT:\n${input}`)

	const response = await model.call(input);
  saveLog(`getFiles agent OUTPUT:\n${response}`)

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
	return parsedResponse.output.relevantFiles;
}

module.exports = { getRelevantFiles };