// 摸鱼日历海报 - 数据计算 CLI：node data.js [YYYY-MM-DD] → data.json
const fs = require('fs');
const { computeData } = require('./lib/data');
const data = computeData(process.argv[2]);
const outPath = __dirname + '/data.json';
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log('wrote', outPath, 'for', data.generated_for);
