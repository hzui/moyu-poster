// 用 template.html + style.css + 素材拼出可直接截图的完整 HTML（Vercel 用）
const fs = require('fs');
const path = require('path');
const { festivalCards, progressCols, salaryItems } = require('./fragments');

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&family=Noto+Color+Emoji&display=swap" rel="stylesheet">`;

function buildHtml(data, { css, images }) {
  let html = fs.readFileSync(path.join(__dirname, '..', 'template.html'), 'utf8');
  const rep = {
    brand: data.brand, brand_en: data.brand_en,
    greeting: data.greeting, rest_tip: data.rest_tip, rest_sub: data.rest_sub,
    date_str: data.date_str, week_num: data.week_num, weekday: data.weekday,
    lunar_str: data.lunar_str,
    festival_cards: festivalCards(data.festivals),
    progress_cols: progressCols(data.progress),
    salary_items: salaryItems(data.salary),
    qr_caption: data.qr_caption,
  };
  for (const k of Object.keys(rep)) {
    html = html.split('%%' + k + '%%').join(String(rep[k]));
  }
  // 字体栈最前加 Noto Sans SC（Vercel Lambda 无中文字体，走 Google Fonts）
  const cssV = css.split('"Noto Sans CJK SC"').join('"Noto Sans SC", "Noto Sans CJK SC"');
  html = html.split('<link rel="stylesheet" href="style.css">')
             .join(FONT_LINKS + '\n<style>\n' + cssV + '\n</style>');
  // 素材转 data URI（函数包内直读，无需静态 URL）
  for (const name of Object.keys(images)) {
    html = html.split(`src="assets/${name}"`).join(`src="${images[name]}"`);
  }
  return html;
}
module.exports = { buildHtml };
