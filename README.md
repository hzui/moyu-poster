# 摸鱼日历海报生成器

每天自动生成一张「摸鱼办」风格的日历倒数海报（1080px 宽长图），版式对标原图：
顶栏（少女头像/日期/农历/问候语）→ 9 宫格节日倒计时 → 工作日进度环 + 发工资倒计时 →
二维码页脚（向日葵）。

跑在 Vercel Serverless 上：访问根地址直接返回当日海报 PNG（无任何页面外壳），
`?date=YYYY-MM-DD` 可指定日期；`GET /api/poster` 是同一接口。

## 线上用法

- `https://<项目名>.vercel.app` —— 今日海报图（直接显示图片）
- `https://<项目名>.vercel.app/?date=2026-11-05` —— 指定日期的海报图
- `https://<项目名>.vercel.app/api/poster` —— 同上，接口直链

首次打开需等待数秒（Lambda 冷启动 + Chromium 渲染），之后有 1 小时边缘缓存。

## 文件结构

| 文件 | 说明 |
|---|---|
| `api/poster.js` | Serverless 函数：算数据 → 拼 HTML → 无头浏览器截图 → 返回 PNG |
| `lib/data.js` | 数据计算：日期/ISO周数/农历/节日倒数/进度/工资 |
| `lib/load-config.js` | 读取 `config.yaml`（单一度数据源） |
| `lib/fragments.js` | 海报 HTML 片段：节日卡 / 进度环 / 工资条 |
| `lib/template.js` | 用 `template.html` + `style.css` + 素材拼出可截图的完整 HTML |
| `template.html` | 海报模板，占位符为双百分号形式（如 `%%date_str%%`） |
| `style.css` | 全部样式 |
| `config.yaml` | 配置：品牌名、发薪日、二维码内容 |
| `assets/` | `anime_girl.png` 动漫少女（顶栏头像）、`qr.png` 二维码、`mascot.png` 蓝色小怪兽（备用）、`fish.png` 大肥鱼（备用） |
| `assets/fonts/` | 内嵌子集字体：Noto Sans SC（224 汉字，字重 100–900）＋ Noto Color Emoji（17 个 emoji），data URI 内嵌、不依赖网络 |
| `vercel.json` | 函数配置（1024MB 内存） |

## 配置（config.yaml）

- `brand` / `brand_en`：品牌名（标题、页脚引用）
- `salary_days`：发薪日列表，默认 `[1, 5, 7, 10, 12, 15, 20, 25, 30]`
- `qr_text`：二维码编码文本；换成自己的公众号二维码直接覆盖 `assets/qr.png` 即可
- 头像：替换 `assets/anime_girl.png` 即可（透明底 PNG 效果最好）

## 部署到 Vercel（经 GitHub）

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

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. Add New → Project → Import 刚推的 `moyu-poster` 仓库
3. Framework Preset 保持 Other，直接 Deploy

说明：

- Vercel Hobby（免费版）即可：函数内存配了 1024MB，超时上限 300 秒，渲染一次约 3～5 秒
- Lambda 里没有中文字体，模板已自动走 Google Fonts 的 Noto Sans SC + Noto Color Emoji
- 以后改 `config.yaml` 后 `git push`，Vercel 会自动重新部署

## 本地开发测试

```bash
npm install
```

渲染链路（不含浏览器启动）可用 node 直接验证；完整截图测试需要一个本地 Chromium，
通过环境变量传入：

```bash
CHROME_PATH=/path/to/chrome node -e "
const handler = require('./api/poster');
const req = { query: { date: '2026-11-05' } };
const res = { setHeader(){}, status(c){ this.code=c; return this; },
  send(b){ require('fs').writeFileSync('test.png', Buffer.from(b)); console.log('status', this.code, b.length); } };
handler(req, res);
"
```

## 数据口径

- 节日倒计时只算「节日当天」，不含调休（和原图一致）
- 农历节日（春节/小年/端午/中秋）与清明节气由 lunar-javascript 逐年换算，不写死
- 进度环口径与原图一致：周一 含今天/7、月初（今天-1）/当月天数、年初（今天-1）/365或366
