const { get_encoding } = require('@dqbd/tiktoken');

/**
* 计算输入字符串中的令牌数量。
* @param {string} input - 要进行令牌化的输入字符串。
* @returns {number} - 输入字符串中的令牌数量。
*/
function countTokens(input) {
	const encoder = get_encoding("cl100k_base")
	const tokens = encoder.encode(input);
	const tokenCount = tokens.length;
	encoder.free();
	return tokenCount;
}

module.exports = {countTokens};