const { OpenAI } = require('langchain/llms');

/**
 *
 * 返回指定语言模型的实例。
 * @param {string} modelType - 要返回的语言模型的类型。
   * 目前支持的类型有 ['gpt-3.5-turbo', 'gpt-4']。
 * @returns {Object} - 指定语言模型的实例。
 * @throws {Error} 如果输入的模型类型不受支持。
 */
function getModel(modelType){
    let model
    if (['gpt-3.5-turbo', 'gpt-4'].includes(modelType)) {
        model = new OpenAI({
            modelName: modelType,
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKEN_REPLY),
            temperature: parseFloat(process.env.MODEL_TEMPERATURE),
            presencePenalty: parseFloat(process.env.MODEL_PRESENCE_PENALTY),
            frequencyPenalty: parseFloat(process.env.MODEL_FREQUENCY_PENALTY),
            user: process.env.MODEL_USER,
            openAIApiKey: process.env.OPENAI_API_KEY,
        },{basePath:process.env.OPENAI_BASE_PATH})
    } else {
        throw new Error(`不支持的模型类型：${modelType}`)
    }
    return model
}

module.exports = { getModel }
