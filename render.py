#!/usr/bin/env python3
# 摸鱼日历海报 - 渲染：data.json + template.html -- playwright 截图 --> out/moyu-YYYYMMDD.png
import json
import yaml
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
CHROME_BIN = ROOT / '.browser' / 'chrome-headless-shell-linux64' / 'chrome-headless-shell'

cfg = yaml.safe_load(open(ROOT / 'config.yaml'))
data = json.load(open(ROOT / 'data.json'))

# 二维码：assets/qr.png 不存在则按 qr_text 生成占位
qr_path = ROOT / 'assets' / 'qr.png'
if not qr_path.exists():
    import qrcode
    qrcode.make(cfg.get('qr_text', 'moyu')).save(qr_path)
    print('generated placeholder', qr_path)


def ring(pct):
    C = 2 * 3.14159 * 54
    dash = C * pct / 100
    return (f'<svg class="ring" viewBox="0 0 120 120">'
            f'<circle cx="60" cy="60" r="54" class="ring-bg"/>'
            f'<circle cx="60" cy="60" r="54" class="ring-fg" '
            f'stroke-dasharray="{dash:.1f} {C:.1f}" transform="rotate(-90 60 60)"/>'
            f'<text x="60" y="70" class="ring-text">{pct}%</text></svg>')


fest = ''.join(
    f'<div class="fest-card"><div class="fest-ico">{f["icon"]}</div>'
    f'<div class="fest-name">距离【{f["name"]}】</div>'
    f'<div class="fest-days">{f["days"]}<span class="tian">天</span></div></div>'
    for f in data['festivals'])

prog = ''.join(
    f'<div class="prog-col"><div class="prog-label">{p["label"]}</div>'
    f'<div class="prog-past">{p["past"]}</div>{ring(p["pct"])}</div>'
    for p in data['progress'])

sal = ''.join(
    f'<div class="sal-item"><span>{s["label"]}</span>还有<b>{s["days"]}</b>天</div>'
    for s in data['salary'])


html = open(ROOT / 'template.html').read()
# 临时文件在 out/ 下，资源路径改用绝对 file:// URI
html = html.replace('href="style.css"', f'href="{(ROOT / "style.css").as_uri()}"')
html = html.replace('src="assets/', f'src="{(ROOT / "assets").as_uri()}/')
rep = {
    'brand': data['brand'], 'brand_en': data['brand_en'],
    'greeting': data['greeting'], 'rest_tip': data['rest_tip'],
    'rest_sub': data['rest_sub'], 'date_str': data['date_str'],
    'week_num': data['week_num'], 'weekday': data['weekday'],
    'lunar_str': data['lunar_str'], 'festival_cards': fest,
    'progress_cols': prog, 'salary_items': sal,
    'qr_caption': data['qr_caption'],
}
for k, v in rep.items():
    html = html.replace('%%' + k + '%%', str(v))

tmp = ROOT / 'out' / '_poster.html'
tmp.parent.mkdir(exist_ok=True)
tmp.write_text(html)

width = cfg.get('width', 1080)
with sync_playwright() as p:
    if CHROME_BIN.exists():
        b = p.chromium.launch(executable_path=str(CHROME_BIN), args=['--no-sandbox'])
    else:
        b = p.chromium.launch()  # Windows/macOS：用 playwright install chromium 装的自带浏览器
    pg = b.new_page(viewport={'width': width, 'height': 900}, device_scale_factor=2)
    pg.goto(tmp.as_uri())
    pg.wait_for_timeout(900)
    out = ROOT / cfg.get('out_dir', 'out') / f"moyu-{data['generated_for']}.png"
    pg.screenshot(path=str(out), full_page=True)
    b.close()
print('saved', out)
