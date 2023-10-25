const path = require('path');
const { createDB } = require('./db');
const fs = require('fs');
const { codeBaseFullIndex, codeBaseFullIndexInteractive } = require('./codeBase');
const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');

/**
 * 初始化代码库。
 * @param {string} codeBaseDirectory - 代码库目录。
 * @param {boolean} interactive - 是否交互式。
 */
async function initCodeBase(codeBaseDirectory, interactive){
    model = process.env.INDEXER_MODEL;
    // 创建目录 `__CODEBASE__/.autopilot`
    codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);

    if (!fs.existsSync(codeBaseAutopilotDirectory)){
        fs.mkdirSync(codeBaseAutopilotDirectory);
    }

    // 创建配置文件 `__CODEBASE__/.autopilot/config.json`
    // TODO: 将包含/排除列表重构为代码库配置文件

    const { getDBFilePath } = require('./db');
    // 引导DB
    if (!fs.existsSync(getDBFilePath(codeBaseDirectory))){
        createDB(codeBaseDirectory);
        // 触发代码库索引动作
        if (interactive){
            await codeBaseFullIndexInteractive(codeBaseDirectory, model);
        } else {
            await codeBaseFullIndex(codeBaseDirectory);
        }
    }
}

module.exports = { initCodeBase }