# 摸鱼日历海报生成器

每天自动生成一张「摸鱼办」风格的日历倒数海报（1080px 宽长图），版式对标原图：
顶栏（LOGO/日期/农历/问候语/吉祥物）→ 9 宫格节日倒计时 → 工作日进度环 + 发工资倒计时 →
二维码页脚（动漫少女）。

## 快速开始

```bash
./run.sh             # 生成今天（北京时间）的海报 → out/moyu-YYYY-MM-DD.png
./run.sh 2027-02-06  # 生成指定日期的海报（测试/补图用）
```

## 文件结构

| 文件 | 说明 |
|---|---|
| `config.yaml` | 配置：品牌名、发薪日、退休倒数、二维码内容 |
| `data.js` | 数据计算：日期/ISO周数/农历/节日倒数/进度/工资 → `data.json` |
| `template.html` | 海报模板，占位符为双百分号形式（如 `%%date_str%%`） |
| `style.css` | 全部样式 |
| `render.py` | 填充模板 + 无头浏览器截图 |
| `run.sh` | 一键：算数据 → 渲染 |
| `assets/` | `mascot.png` 蓝色小怪兽（备用）、`fish.png` 大肥鱼（备用）、`anime_girl.png` 动漫少女（LOGO 头像）、`qr.png` 二维码 |
| `out/` | 成品图 |

## 配置（config.yaml）

- `brand` / `brand_en`：品牌名（徽章、标题、页脚三处引用）
- `salary_days`：发薪日列表，默认 `[1, 5, 7, 10, 12, 15, 20, 25, 30]`
- `qr_text`：二维码编码文本；若 `assets/qr.png` 已存在则优先用它（换成自己的公众号二维码直接覆盖即可）
- 吉祥物：替换 `assets/` 下的 `mascot.png` / `fish.png` / `anime_girl.png` 即可


## Windows 本地运行

1. 安装 [Node.js LTS](https://nodejs.org/) 和 [Python 3.10+](https://www.python.org/)（安装 Python 时勾选 Add python.exe to PATH）
2. 解压 `moyu-poster-code.zip`，在项目目录打开终端（cmd 或 PowerShell）
3. 安装依赖（只需一次）：
   ```bat
   npm install
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install playwright qrcode pyyaml pillow
   playwright install chromium
   ```
4. 生成海报：双击 `run.bat`（生成今天的），或终端执行 `run.bat 2026-11-05` 生成指定日期；成品在 `out\` 目录

说明：`render.py` 会优先用项目内自带的无头浏览器（Linux），Windows 上没有则自动用 `playwright install chromium` 下载的自带浏览器。


## 部署到 Vercel（经 GitHub）

Vercel 上跑的是一个 Serverless API：`GET /api/poster` 按需渲染当日海报 PNG（`?date=YYYY-MM-DD` 可指定日期），首页 `public/index.html` 是个简单预览页。本地 CLI（`run.sh`）不受影响，照常用。

### 1. 推到 GitHub

```bash
cd moyu-poster
git init
git add .
git commit -m "moyu poster: vercel-ready"
git branch -M main
# 先在 github.com 新建一个空仓库（不要勾选 README），然后：
git remote add origin https://github.com/<你的用户名>/moyu-poster.git
git push -u origin main
```

### 2. Vercel 导入

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. Add New → Project → Import 刚推的 `moyu-poster` 仓库
3. Framework Preset 保持 Other，直接 Deploy
4. 部署完成后访问：
   - `https://<项目名>.vercel.app` —— 预览页
   - `https://<项目名>.vercel.app/api/poster` —— 今日海报 PNG 直链
   - `https://<项目名>.vercel.app/api/poster?date=2026-11-05` —— 指定日期

### 说明

- 首次打开需等待数秒（Lambda 冷启动 + Chromium 渲染），之后有 1 小时边缘缓存
- Vercel Hobby（免费版）即可：函数内存配了 1024MB，超时上限 300 秒，渲染一次约 3～5 秒
- Lambda 里没有中文字体，模板已自动走 Google Fonts 的 Noto Sans SC + Noto Color Emoji
- 以后改 `config.yaml`（品牌名、发薪日等）后 `git push`，Vercel 会自动重新部署

## 定时任务（按需启用）

```cron
# 每天 6:15 生成当天海报
15 6 * * * cd /home/hatch/workspace/moyu-poster && ./run.sh >> cron.log 2>&1
```

## 依赖（已就地安装，开箱即用，重建 VM 也不丢）

- `.venv/`：Python playwright / qrcode / pyyaml / pillow
- `node_modules/`：lunar-javascript（农历+节气，节假日换算全靠它）、js-yaml
- `.browser/`：Chrome Headless Shell（截图用，curl 断点续传下载）

## 数据口径

- 节日倒计时只算「节日当天」，不含调休（和原图一致）
- 农历节日（春节/小年/端午/中秋）与清明节气由 lunar-javascript 逐年换算，不写死
- 进度环口径与原图一致：周一 含今天/7、月初（今天-1）/当月天数、年初（今天-1）/365或366
