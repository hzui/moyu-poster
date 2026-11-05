// 海报 HTML 片段：节日卡 / 进度环 / 工资条（与 render.py 的 Python 版同构，类名严格一致）
function ring(pct) {
  const C = 2 * Math.PI * 54;
  const dash = (C * pct / 100).toFixed(1);
  return `<svg class="ring" viewBox="0 0 120 120">` +
    `<circle cx="60" cy="60" r="54" class="ring-bg"/>` +
    `<circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${dash} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>` +
    `<text x="60" y="70" class="ring-text">${pct}%</text></svg>`;
}

function festivalCards(festivals) {
  return festivals.map(f =>
    `<div class="fest-card"><div class="fest-ico">${f.icon}</div>` +
    `<div class="fest-name">距离【${f.name}】</div>` +
    `<div class="fest-days">${f.days}<span class="tian">天</span></div></div>`
  ).join('\n');
}

function progressCols(progress) {
  return progress.map(p =>
    `<div class="prog-col"><div class="prog-label">${p.label}</div>` +
    `<div class="prog-past">${p.past}</div>${ring(p.pct)}</div>`
  ).join('\n');
}

function salaryItems(salary) {
  return salary.map(s =>
    `<div class="sal-item"><span>${s.label}</span>还有<b>${s.days}</b>天</div>`
  ).join('\n');
}

module.exports = { festivalCards, progressCols, salaryItems };
