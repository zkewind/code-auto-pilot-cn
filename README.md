# 加入 Discord

加入我们的对话 <https://discord.gg/r72ykfvyx7>

# 工作原理

1.  首先指向一个现有的代码库。

2.  自动扫描代码文件，并更新数据库中的代码文件描述元数据。（在代码库目录中）&#x20;

3.  通过使用描述元数据来决定新编码任务需要哪些现有文件。&#x20;

4.  尝试在每个相关文件上执行新的编码任务。

## 作为 GitHub 应用程序的自动驾驶

你可以通过安装 GitHub 应用程序来使用此项目，该应用程序位于 [https://github.com/marketplace/code-autopilot-ai-coder.](https://github.com/marketplace/code-autopilot-ai-coder.该应用程序使用autopilot自动解决您在GitHub上打开的问题，并具有Pull)

该应用程序使用本项目自动解决你在 GitHub 上打开的问题，并具有 Pull Request 功能。它提供了一个易于使用的界面，并直接与 Github 集成。

## 功能

-📚 - 预处理代码库文件。
-🤖 - 为您实现代码更改。
-🚀 - 尽可能并行调用代理。
-📝 - 显示更新内容。（还生成了每个 AI 交互的完整过程日志）
-🕹️ - 交互模式-查看具有重试、继续、中止选项的过程。

### 开发路线图（根据当前代码）：

-✅ 按项目相对路径引用特定文件。
-✅ 仅按文件名引用特定文件，忽略子目录路径。
-✅ 在没有文件名的文件中引用特定函数。
-✅ 引用专门用于一个文件中的主要业务概念。
-✅ 引用所有项目文件。
-🤔 一般逻辑请求。您的相似性会因模型、代码库和任务而异。有些工作。（应引入任务评分）-执行的更改：
-✅ 基于现有文件创建新文件。
-❌ 从头开始创建一个新文件。
-✅ 更新现有文件。
-✅ 更新多个现有文件。
-❌ 删除现有文件。（它可能会清空它们，但当前不会删除它们）
-❌ 开始使用新的第三方库。（需要执行任意代码才能安装库）
-❌ 级联更新测试等相关文件。（即将推出）
-❌ 测试它编写的代码并自行修复。

## 先决条件

nodejs v18 或更高版本。

## 🛠️ 安装

1.克隆存储库：`git Clonehttps://github.com/fjrdomingues/autopilot.git`&#x20;

2.执行"cd autopilot"以安装依赖项：`npm -ci`&#x20;

3.创建".env"文件并设置环境变量：&#x20;

&#x20; a.将.env.template 文件复制到.env:`cp .env.tmplate .env`&#x20;

&#x20; b.设置 OpenAI API 密钥：`OpenAI_API_key=<your-API-key>`。[创建 openAI API 密钥](https://platform.openai.com/account/api-keys) 3.设置代码的路径`code_DIR=<代码的路径>`（或稍后使用`-d代码的路径`） 4.更新`IGNORE_LIST=节点模块，覆盖范围，公共，__tests__` 5.更新`FILE_EXTENSIONS_TO_PROCESS=.js、.tsx、.ts、.jsx`

## 正在运行

- `node ui -t"YOUR_TASK"`-是最简单的启动方式。

  - 解决方案将自动应用于您的代码，并在可能的情况下显示 git diff。

  - 或者，您可以指定"--auto-apply\=false"。

- "node ui -h"-将显示所有选项。

## 交互模式

使用"node ui -i"作为交互模式，在这里您可以在继续操作之前查看每个步骤的输出。

## 🤝 贡献

**我们正在连接到的服务器上运行自动驾驶仪**<https://github.com/fjrdomingues/autopilot 存储库。创建的新问题将触发自动驾驶，并创建一个带有提案的新Pull> Request。使用 gpt-4 运行

我们欢迎捐款！请向存储库提交拉取请求，并确保您的更改符合项目的目标和指导方针。我们可以一起让它成为开发人员更强大、更高效的工具！

### 正在运行测试-全部

`npm run test` - 运行所有测试

### 运行测试-单元测试

`npm run unit-test` - 运行单元测试

### 运行测试-基准

`npm run e2e-test` - 运行端到端测试

### 代码结构

- agent - 代理，与语言模型的交互。

- modules - 模块,大多数其他内部库。

- ui.js - 主程序。

- logs - 日志，记录任务运行。
