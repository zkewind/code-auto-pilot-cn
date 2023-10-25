/**
 * 解析 JSON 字符串并验证其语法的函数。
 *
 * @param {string} json - 要解析的 JSON 字符串。
 * @returns {object} - 解析后的 JSON 对象。
 * @throws {Error} - 如果 JSON 字符串无效。
 */
function jsonParseWithValidate(json) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.log('解析 JSON 失败', error, json);
        throw new Error('无效的 JSON');
    }
}

module.exports = { jsonParseWithValidate }