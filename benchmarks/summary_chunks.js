const { main: doTask } = require('../ui')
const fs = require('fs');
const path = require('path');
const LineDiff = require("line-diff")
const { review } = require('../agents/reviewer')

let score = 0
const loops = 1
const task = "在某些情况下，摘要可能包含太多的令牌，无法一次处理完。通过遍历摘要并将其分割为小于3000个令牌的数量来解决这个问题。"
const criteria = [
    "none"
]

async function main(){
    for (let i = 0; i < loops; i++) {
        try {
            console.log(`Loop ${i + 1}`);
            const oldFile = fs.readFileSync(path.posix.join(__dirname, 'files', 'ui.js'), 'utf-8')
            const solution = await doTask(task, test = true)
            const newFile = solution[0].code
            const diff = new LineDiff(oldFile,newFile).toString()
            console.log(diff)
            const reviewRes = await review(task, diff, criteria)
            console.dir(reviewRes, { depth: null })
            score += Number(reviewRes.output.evaluation.rating)
        } catch (error){
            console.log(error)
            score += 0
        }
    }
    console.log('最终得分:', score/loops)
}

main()