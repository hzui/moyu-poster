// Vercel Serverless Function: GET /api/poster[?date=YYYY-MM-DD] -> PNG 海报
const fs = require('fs');
const path = require('path');
const { computeData } = require('../lib/data');
const { buildHtml } = require('../lib/template');
const { chromium: pw } = require('playwright-core');

// @sparticuz/chromium v153 是纯 ESM 包（"type": "module"）：CJS 里 require() 它
// 需要 Node 22.12+ 的 require(esm)，旧版 Node 会抛 ERR_REQUIRE_ESM。
// 改走动态 import()，任何支持 ESM 的 Node 都能加载；结果缓存到模块级，
// 热调用不再重复加载。
let Chromium = null;
let chromiumTried = false;
async function loadChromium() {
  if (chromiumTried) return Chromium;
  chromiumTried = true;
  try {
    const mod = await import('@sparticuz/chromium');
    Chromium = mod.default || mod;
  } catch (e) { /* 未安装则走 CHROME_PATH / 默认路径 */ }
  return Chromium;
}

function assetUri(absPath) {
  const buf = fs.readFileSync(absPath);
  return 'data:image/png;base64,' + buf.toString('base64');
}

module.exports = async (req, res) => {
  let browser = null;
  try {
    const data = computeData(req.query && req.query.date);
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const html = buildHtml(data, {
      css,
      images: {
        'mascot.png': assetUri(path.join(__dirname, '..', 'assets', 'mascot.png')),
        'anime_girl.png': assetUri(path.join(__dirname, '..', 'assets', 'anime_girl.png')),
        'qr.png': assetUri(path.join(__dirname, '..', 'assets', 'qr.png')),
      },
    });

    const launchOpts = { headless: true };
    const chromium = await loadChromium();
    if (process.env.CHROME_PATH) {
      launchOpts.executablePath = process.env.CHROME_PATH;
      launchOpts.args = ['--no-sandbox'];
    } else if (chromium) {
      launchOpts.args = chromium.args;
      launchOpts.executablePath = await chromium.executablePath();
    } else {
      launchOpts.args = ['--no-sandbox'];
    }

    browser = await pw.launch(launchOpts);
    const page = await browser.newPage({
      viewport: { width: 1080, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 字体等待：document.fonts.ready 在字体 CSS 尚未到达时会立即 resolve（空集），
    // 所以先等字体注册，再强制加载关键字重，最多等 12 秒。
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const t0 = Date.now();
      while (document.fonts.size === 0 && Date.now() - t0 < 8000) await sleep(100);
      await Promise.race([
        (async () => {
          try { await document.fonts.load('900 48px "Moyu Sans"', '摸'); } catch (e) {}
          try { await document.fonts.load('700 32px "Moyu Sans"', '鱼'); } catch (e) {}
          try { await document.fonts.load('400 20px "Moyu Sans"', '办'); } catch (e) {}
          try { await document.fonts.load('400 20px "Moyu Emoji"', '🌻'); } catch (e) {}
          await document.fonts.ready;
        })(),
        sleep(12000),
      ]);
    }).catch(() => {});
    const png = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(png);
  } catch (err) {
    if (browser) { try { await browser.close(); } catch (e) {} }
    res.status(500).send('render failed: ' + (err && err.message));
  }
};
