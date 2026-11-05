// 读取项目根目录 config.yaml（单一度数据源，CLI 与 Vercel 共用）
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let cached = null;
function loadConfig() {
  if (cached) return cached;
  const p = path.join(__dirname, '..', 'config.yaml');
  cached = yaml.load(fs.readFileSync(p, 'utf8'));
  return cached;
}
module.exports = { loadConfig };
