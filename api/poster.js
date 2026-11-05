// Vercel Serverless Function: GET /api/poster[?date=YYYY-MM-DD] -> PNG 海报
const fs = require('fs');
const path = require('path');
const { computeData } = require('../lib/data');
const { buildHtml } = require('../lib/template');
const { chromium: pw } = require('playwright-core');

// @sparticuz/chromium v153 起改为 Chromium 类 + 静态 API（旧版为普通对象，兼容两种）
let Chromium = null;
try {
  const mod = require('@sparticuz/chromium');
  Chromium = mod.default || mod;
} catch (e) { /* 本地无则走 CHROME_PATH */ }

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
    if (process.env.CHROME_PATH) {
      launchOpts.executablePath = process.env.CHROME_PATH;
      launchOpts.args = ['--no-sandbox'];
    } else if (Chromium) {
      launchOpts.args = Chromium.args;
      launchOpts.executablePath = await Chromium.executablePath();
    } else {
      launchOpts.args = ['--no-sandbox'];
    }

    browser = await pw.launch(launchOpts);
    const page = await browser.newPage({
      viewport: { width: 1080, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 字体就绪即渲染，最多等 8 秒：避免某个字体请求挂起拖慢整张图
    await Promise.race([
      page.evaluate(() => document.fonts.ready).catch(() => {}),
      page.waitForTimeout(8000),
    ]);
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
