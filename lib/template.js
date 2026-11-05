// 用 template.html + style.css + 素材拼出可直接截图的完整 HTML（Vercel 用）
const fs = require('fs');
const path = require('path');
const { festivalCards, progressCols, salaryItems } = require('./fragments');

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&family=Noto+Color+Emoji&display=swap" rel="stylesheet">`;

// 内嵌子集字体（data URI，不依赖网络；Lambda 无系统 CJK 字体时仍能渲染）。
// Moyu Sans：Noto Sans SC 可变字体，按海报实际用字子集化（224 汉字 + 数字符号），字重 100-900。
// Moyu Emoji：Noto Color Emoji 按海报实际用到的 17 个 emoji 分片子集化。
const FONT_FILES = [
  { family: 'Moyu Sans', file: 'NotoSansSC-subset.woff2', weight: '100 900' },
  { family: 'Moyu Emoji', file: 'emoji_0.woff2', range: 'U+1F1E6-1F1FF' },
  { family: 'Moyu Emoji', file: 'emoji_3.woff2', range: 'U+26D1, U+1F3EE, U+1F4B0, U+1F4C5, U+1F5D3, U+FE0F' },
  { family: 'Moyu Emoji', file: 'emoji_4.woff2', range: 'U+1F386, U+1F9E7, U+FE0F' },
  { family: 'Moyu Emoji', file: 'emoji_6.woff2', range: 'U+1F96E, U+FE0F' },
  { family: 'Moyu Emoji', file: 'emoji_7.woff2', range: 'U+2600, U+1F33B, U+1F33F, U+1F3D6, U+1F432, U+FE0F' },
  { family: 'Moyu Emoji', file: 'emoji_9.woff2', range: 'U+1F642, U+FE0F' },
];
function bundledFontCss() {
  return FONT_FILES.map(f => {
    const b64 = fs.readFileSync(path.join(__dirname, '..', 'assets', 'fonts', f.file)).toString('base64');
    const weight = f.weight ? `font-weight: ${f.weight};` : 'font-weight: 400;';
    const range = f.range ? `unicode-range: ${f.range};` : '';
    return `@font-face{font-family:'${f.family}';font-style:normal;${weight}font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2');${range}}`;
  }).join('\n');
}

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
  // 字体栈：内嵌子集字体优先（不依赖网络），Google Fonts 作后备（覆盖子集外的生僻字）
  const cssV = css.split('"Noto Sans CJK SC"').join('"Moyu Sans", "Noto Sans SC", "Noto Sans CJK SC"')
                  .split('"Noto Color Emoji"').join('"Moyu Emoji", "Noto Color Emoji"');
  html = html.split('<link rel="stylesheet" href="style.css">')
             .join(FONT_LINKS + '\n<style>\n' + bundledFontCss() + '\n' + cssV + '\n</style>');
  // 素材转 data URI（函数包内直读，无需静态 URL）
  for (const name of Object.keys(images)) {
    html = html.split(`src="assets/${name}"`).join(`src="${images[name]}"`);
  }
  return html;
}
module.exports = { buildHtml };
