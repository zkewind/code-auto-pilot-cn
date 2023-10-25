const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { countTokens } = require('./tokenHelper');

const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');

DB_FILE_NAME = 'autopilot.db'

/**
 * @description 创建文件表
 * @param {sqlite3.Database} db - 要在其中创建表的数据库
 */
function createFilesTable(db){
    const sql =`
CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,
    tokensCount INTEGER,
    summary TEXT,
    summaryTokensCount INTEGER,
    hash TEXT,
    timestamp INTEGER,
    dependenciesLibs TEXT
);
`
    db.run(sql);
}

/**
 * @description 创建文件表
 * @param {string} codeBaseAutopilotDirectory - 代码库的 .autopilot 目录的路径
 */
function createDB(codeBaseDirectory){
    const db = getDB(codeBaseDirectory)
    createFilesTable(db);
}

function getDBFilePath(codeBaseDirectory){
    codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
    dbFilePath = path.posix.join(codeBaseAutopilotDirectory, DB_FILE_NAME);
    return dbFilePath;
}

/**
 * @description 创建文件表
 * @param {string} codeBaseAutopilotDirectory - 代码库的 .autopilot 目录的路径
 * @returns {sqlite3.Database} db - 数据库
 */
function getDB(codeBaseDirectory){
    dbFilePath = getDBFilePath(codeBaseDirectory);
    const db = new sqlite3.Database(dbFilePath);
    return db;
}

/**
 * 从指定的文件路径中删除 "files" 表中的文件
 * 位于由 codeBaseDirectory 参数指定的代码库目录中的 SQLite 数据库。
 * @param {string} codeBaseDirectory - 包含 SQLite 数据库的代码库目录的绝对路径。
 * @param {string} filePath - 要删除的文件的绝对路径。
 */
function deleteFile(codeBaseDirectory, filePath){
    db = getDB(codeBaseDirectory);
    const sql = `
delete from files 
where path = ?`
    db.run(sql, [filePath]);
}


/**
 * @description 向文件表中插入或更新文件
 * @param {sqlite3.Database} db - 要插入文件的数据库
 * @param {object} file - 要插入或更新的文件
 * @param {string} file.filePath - 文件的相对路径
 * @param {string} file.fileContent - 文件的内容
 * @param {number} file.fileTokensCount - 文件中的令牌数
 * @param {string} file.fileHash - 文件内容的哈希值
 * @param {number} file.fileTimestamp - 文件上次修改的时间戳
 * @param {string} summary - 文件的摘要
 * @param {string} dependenciesLibs - 文件的依赖项
 */
function insertOrUpdateFile(codeBaseDirectory, file, summary, dependenciesLibs){
    db = getDB(codeBaseDirectory);
    const summaryTokensCount = countTokens(summary);
    const sql = `
INSERT OR REPLACE INTO files (
    path, 
    tokensCount,
    summary, 
    summaryTokensCount, 
    hash,
    timestamp,
    dependenciesLibs)
VALUES (?, ?, ?, ?, ?, ?, ?)
`
    db.run(sql, [
        file.filePath, 
        file.fileTokensCount, 
        summary,
        summaryTokensCount,
        file.fileHash,
        file.fileTimestamp,
        dependenciesLibs
    ]);
}

/**
 * @description Gets all files from the files table
 * @param {string} codeBaseDirectory - The path to the codebase
 * @returns {Array<{
    * path: string, // The relative path of the file.
    * hash: string, // The hash of the file content.
    * timestamp: string // The timestamp when the file was last modified.
 * }>} - An array of objects containing file details retrieved from the directory.
 * @throws {Error} If an error occurs during the database query.
*/
async function getDBFiles(codeBaseDirectory){
    db = getDB(codeBaseDirectory);
    const sql = `
SELECT path, hash, timestamp 
FROM files
`
    files = await new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
            reject(err);
            } else {
            resolve(rows);
            }
        });
    });
    return files;
}
    


module.exports = { createDB, createFilesTable, insertOrUpdateFile, getDB, getDBFiles, deleteFile, getDBFilePath }
