const fs = require('fs');
const path = require('path');
require('dotenv').config();
const hashFile = require('./hashing');
const { countTokens } = require('./tokenHelper');
const { isBinaryFileSync } = require("isbinaryfile");

const ignoreList = process.env.IGNORE_LIST.split(',');
const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');

/**
 * 递归扫描由'dir'指定的目录，搜索项目文件。
 * 根据文件扩展名（在'fileExtensionsToProcess'中定义）来识别项目文件。
 * 如果遇到子目录，除非它在'ignoreList'中，否则将递归搜索它。
 * @param {string} dir - 要扫描项目文件的目录路径。
 * @param {string[]} ignoreList - 要忽略的目录名称数组。
 * @param {string[]} fileExtensionsToProcess - 要搜索的文件扩展名数组。
 * @returns {string[]} 所有找到的项目文件的绝对文件路径数组。
*/
function getFilePaths(dir) {
	const files = fs.readdirSync(dir);
	const projectFiles = [];

	for (const file of files) {
		const filePath = path.posix.join(dir, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory() && !ignoreList.includes(file)) {
			projectFiles.push(...getFilePaths(filePath));
		} else if (fileExtensionsToProcess.includes(path.extname(filePath))) {
			projectFiles.push(filePath);
		}
	}

	return projectFiles;
};


/**
 * 解析文件内容并返回包含相关文件信息的对象。
 * @param {string} dir - 文件所在的目录路径。
 * @param {string} filePathFull - 文件的路径。
 * @param {string} fileContent - 文件的内容。
 * @returns {object} - 一个包含以下属性的对象：
	* filePath: 文件的相对路径。
	* fileContent: 文件的内容。
	* fileTokensCount: 文件中的令牌数。
	* fileHash: 文件内容的哈希值。
    * fileTimestamp: 文件上次修改的时间戳。
 */
function parseFileContent(dir, filePathFull, fileContent) {
	const fileTokensCount = countTokens(fileContent);
	const fileHash = hashFile(fileContent);
	const relativePath = path.relative(dir, filePathFull).replace(/\\/g, '/');
	const fileTimestamp = fs.statSync(filePathFull).mtimeMs; // Get the file modification timestamp
	// TODO: cleanup file pre-fix from fields (need to match uses in other files)
	const parseFile = {
		filePath: relativePath,
		fileContent: fileContent,
		fileTokensCount: fileTokensCount,
		fileHash: fileHash,
		fileTimestamp: fileTimestamp,
	};
	return parseFile;
}

/**
 * 加载并哈希指定目录中的所有项目文件。
 * @param {string} dir - 要从中加载和哈希项目文件的目录。
 * @returns {Array<{
	* filePath: string, // 文件的相对路径。
	* fileContent: string, // 文件的内容。
	* fileTokensCount: number, // 文件中的令牌数。
	* fileHash: string, // 文件内容的哈希值。
	* fileTimestamp: string // 文件上次修改的时间戳。
 * }>} - 包含从数据库中检索到的文件详细信息的对象数组。
 */
function loadFiles(dir) {

	const filePaths = getFilePaths(dir);
	const files = [];

	for (const filePath of filePaths) {
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			if (!fileContent || fileContent.length == 0 || isBinaryFileSync(filePath)) {
				continue;
			}

			const file = parseFileContent(dir, filePath, fileContent);
			files.push(file);
	}

	return files;
};


/**
 * 将一个具有路径属性的文件对象数组转换为具有路径属性和代码属性（包含文件内容）的文件对象数组。
 * @param {FileObject[]} files - 一个具有路径属性的文件对象数组。
 * @returns {FileObject[]} - 一个具有路径属性和代码属性（包含文件内容）的文件对象数组。
 */
function getFiles(codeBaseDirectory, files){
	let retFiles=[]
	for (const file of files) {
	  const filePathRelative = file.path;
	  const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative); 
		let fileContent
		if (file.exists) {
			fileContent = fs.readFileSync(filePathFull, 'utf8');
		} else {
			fileContent = "// This is a new file"
		}
	  file.code = fileContent
	  retFiles.push(file)
	}
	return retFiles
}

module.exports = {
	loadFiles,
	parseFileContent,
	getFiles,
}

