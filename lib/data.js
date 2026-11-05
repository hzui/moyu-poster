// 摸鱼日历海报 - 数据计算：日期/农历/节日倒数/进度/工资 → 对象
// computeData(dateStr?)  dateStr 为 YYYY-MM-DD，不传或非法则用今天（北京时间）
const { Solar, Lunar } = require('lunar-javascript');
const { loadConfig } = require('./load-config');

const DAY = 86400000;
const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function shanghaiMidnight(dateStr) {
  const now = new Date();
  const realHour = +new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', hour: 'numeric', hour12: false,
  }).format(now).replace(/\D/g, '') % 24;
  let target = dateStr ? new Date(dateStr + 'T12:00:00+08:00') : now;
  if (isNaN(target.getTime())) target = now; // 非法日期回退到今天
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(target).reduce((o, p) => (o[p.type] = +p.value, o), {});
  return {
    date: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)),
    y: parts.year, m: parts.month, d: parts.day, hour: realHour,
  };
}
const diffDays = (a, b) => Math.round((a.getTime() - b.getTime()) / DAY);

function computeData(dateStr) {
  const cfg = loadConfig();
  const t = shanghaiMidnight(dateStr);
  const today = t.date;
  const solar = Solar.fromYmd(t.y, t.m, t.d);
  const lunar = solar.getLunar();
  const lunarYear = lunar.getYear();

  // ---- 日期区 ----
  const thursday = new Date(today.getTime() + ((4 - ((today.getUTCDay() + 6) % 7 + 1) + 7) % 7 - 3) * DAY);
  const d4 = new Date(Date.UTC(thursday.getUTCFullYear(), thursday.getUTCMonth(), thursday.getUTCDate()));
  d4.setUTCDate(d4.getUTCDate() + 4 - ((d4.getUTCDay() + 6) % 7));
  const weekNum = Math.ceil((((d4 - new Date(Date.UTC(d4.getUTCFullYear(), 0, 1))) / DAY) + 1) / 7);
  const weekday = WEEK_CN[today.getUTCDay()];
  const dateStrOut = `${t.y}年${t.m}月${t.d}日`;

  const lunarStr = `${lunar.getYearInGanZhi()}[${lunar.getYearShengXiao()}]年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

  const h = t.hour;
  const greetWord = h < 6 ? '凌晨好' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';

  // ---- 节日倒数 ----
  const afterToday = (y, m, d) => {
    let dt = new Date(Date.UTC(y, m - 1, d));
    if (dt < today) dt = new Date(Date.UTC(y + 1, m - 1, d));
    return dt;
  };
  const lunarAfterToday = (ly, lm, ld) => {
    let s = Lunar.fromYmd(ly, lm, ld).getSolar();
    let dt = new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay()));
    if (dt < today) {
      s = Lunar.fromYmd(ly + 1, lm, ld).getSolar();
      dt = new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay()));
    }
    return dt;
  };
  const qingming = (y) => {
    for (let dd = 1; dd <= 30; dd++)
      if (Solar.fromYmd(y, 4, dd).getLunar().getJieQi() === '清明') return new Date(Date.UTC(y, 3, dd));
    return new Date(Date.UTC(y, 3, 5));
  };
  const qingmingAfter = (() => { let q = qingming(t.y); return q < today ? qingming(t.y + 1) : q; })();

  const dow = today.getUTCDay();
  const festivals = [
    { name: '周末', icon: '\u{1F3D6}\uFE0F', days: (6 - dow + 7) % 7 },
    { name: '元旦', icon: '\u{1F386}', days: diffDays(afterToday(t.y, 1, 1), today) },
    { name: '小年', icon: '\u{1F9E7}', days: diffDays(lunarAfterToday(lunarYear, 12, 23), today) },
    { name: '春节', icon: '\u{1F3EE}', days: diffDays(lunarAfterToday(lunarYear, 1, 1), today) },
    { name: '清明', icon: '\u{1F33F}', days: diffDays(qingmingAfter, today) },
    { name: '五一', icon: '\u26D1\uFE0F', days: diffDays(afterToday(t.y, 5, 1), today) },
    { name: '端午', icon: '\u{1F432}', days: diffDays(lunarAfterToday(lunarYear, 5, 5), today) },
    { name: '中秋', icon: '\u{1F96E}', days: diffDays(lunarAfterToday(lunarYear, 8, 15), today) },
    { name: '国庆', icon: '\u{1F1E8}\u{1F1F3}', days: diffDays(afterToday(t.y, 10, 1), today) },
  ];

  // ---- 工作日/进度 ----
  const daysSinceMon = (dow + 6) % 7;
  const weekPast = daysSinceMon + 1;
  const dim = new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
  const monthPast = t.d - 1;
  const startOfYear = new Date(Date.UTC(t.y, 0, 1));
  const yearPast = diffDays(today, startOfYear);
  const diy = ((t.y % 4 === 0 && t.y % 100 !== 0) || t.y % 400 === 0) ? 366 : 365;
  const progress = [
    { label: '周一', past: `过去${weekPast}天`, pct: Math.round(weekPast / 7 * 100) },
    { label: '月初', past: `过去${monthPast}天`, pct: Math.round(monthPast / dim * 100) },
    { label: '年初', past: `过去${yearPast}天`, pct: Math.round(yearPast / diy * 100) },
  ];

  // ---- 发工资倒计时 ----
  const salary = (cfg.salary_days || []).map(p => {
    let dt = new Date(Date.UTC(t.y, t.m - 1, Math.min(p, dim)));
    if (dt < today) {
      const nm = new Date(Date.UTC(t.y, t.m, 1));
      const ndim = new Date(Date.UTC(nm.getUTCFullYear(), nm.getUTCMonth() + 1, 0)).getUTCDate();
      dt = new Date(Date.UTC(nm.getUTCFullYear(), nm.getUTCMonth(), Math.min(p, ndim)));
    }
    return { label: `(${p}号)`, days: diffDays(dt, today) };
  });

  return {
    brand: cfg.brand, brand_en: cfg.brand_en,
    greeting: `${cfg.greeting_suffix || '大家'}${greetWord}！`,
    rest_tip: cfg.rest_tip, rest_sub: cfg.rest_sub,
    date_str: dateStrOut, week_num: weekNum, weekday,
    lunar_str: lunarStr,
    festivals, progress, salary,
    qr_text: cfg.qr_text, qr_caption: cfg.qr_caption,
    generated_for: `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`,
  };
}
module.exports = { computeData };
