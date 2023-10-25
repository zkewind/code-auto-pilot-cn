const { getRelevantFiles } = require('./getFiles');

require('dotenv').config();

describe('getRelevantFiles', () => {
  const summaries = `
File Path: modules/gpt.js
Summary:
一个导出两个函数以调用OpenAI的GPT API并验证所使用模型的模块。
函数：callGPT，verifyModel
modelCostMap - 包含使用不同GPT模型的成本的映射。
configuration - 包含OpenAI API密钥的对象。
openai - 包含OpenAI API的对象。

---
File Path: agents/coder.js
Summary:
使用高级模型异步建议更改任务源代码的函数。
函数：suggestChanges，formatCode
PromptTemplate - 从模板和输入变量生成提示的类。
StructuredOutputParser - 从模型解析结构化输出的类。
OutputFixingParser - 修复不符合模式的模型输出的类。
getModel - 返回模型的函数。
saveLog - 将日志保存到文件的函数。
formatCode - 将给定文件对象中的代码格式化为Markdown代码块的函数。

---
`;

  const testCases = [
    {
      task: '创建一个名为："newFILE.js"的新文件',
      expectedOutput: []
    },
    {
      task: '在coder.js中创建一个名为newFunction的新函数',
      expectedOutput: ['agents/coder.js']
    },
    {
      task: '更新verifyModel函数',
      expectedOutput: ['modules/gpt.js']
    },
    {
      task: '将许可信息添加到所有文件的顶部',
      expectedOutput: ['agents/coder.js', 'modules/gpt.js']
    }
  ];

  it.each(testCases)('%s', async ({ task, expectedOutput }) => {
    const relevantFiles = await getRelevantFiles(task, summaries);
    const actualPaths = relevantFiles.map((file) => file.path);
    expect(actualPaths).toEqual(expect.arrayContaining(expectedOutput));
  }, 600000);

});