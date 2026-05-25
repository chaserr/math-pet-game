# 🧮 数字积木大冒险

H5 多学科闯关 + 宠物养成游戏。三大学科（数学 / 语文 / 英语）做题赚积分、爆口粮、养宠物。

> 完整文档见 [`docs/`](docs/index.html)（本地知识库，多页静态网站，主页是 [`docs/index.html`](docs/index.html)）。

## 技术栈

- 前端：Vue 3 + Vite + Pinia + Vue Router + GSAP，全手写 SVG 美术
- 后端：Supabase（Auth + Postgres + RPC），客户端直连，无独立 server
- 进度：localStorage `mpg_progress_v3`（按分类记录已通关关号集合）

## 运行

需要 Node 18+；先在 Supabase 建项目，把 URL / anon key 填到 `client/.env`（参考 [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)）。

```bash
npm run install:all   # 安装前端依赖
npm run dev           # 启动 Vite dev server
npm run build         # 生产构建
```

浏览器打开 http://localhost:5173 ，注册账号即可开始。

## 教材资源（PDF）

游戏内"📚 跟课本学 → 📖 查看课本"功能依赖原版 PDF 教材。**70 MB+ 不进 git**，需要本地手动放置：

```
client/public/textbooks/math/grade1/grade1-up.pdf      ← 一年级上册（人教版 2022 课标修订）
client/public/textbooks/math/grade1/grade1-down.pdf    ← 一年级下册（同上）
```

PDF 已在 `.gitignore` 排除（避免 70 MB 进 git / 跨设备同步）。原始来源为人教版官方教材；切换设备 / Codex 容器时需重新放置。未放置时教材轴仍可用，"查看课本"按钮显示"PDF 未放置"提示。

## 学科与模块

| 学科 | 模块 | 关卡结构 |
|---|---|---|
| **数学** | 加 / 减 / 乘 / 除 / 数位认知 | 分类层（10以内 9×9 / 100以内 / 两-三-四数 / 数位 d3~d10） |
| 语文 | 看图识字 ✅ + 拼音/组词/成语（占位） | 每模块 1000 关 |
| 英语 | 字母认知 ✅ + 词汇/拼写/句子（占位） | 每模块 1000 关 |

详见 [`docs/curriculum.html`](docs/curriculum.html) 与 [`docs/difficulty.html`](docs/difficulty.html)。

## 核心交互

- 首页 → 学科 Tab → 模块卡 →（数学）选关页 → 答题
- 题型：tile-fill（拖积木）/ multi-step（拆分引导）/ choice（四选一）/ place（拖到数位）
- 每关多题；通关后该关按钮变粉灰，**仍可点击重玩**
- 答对 ≥60% 通关；满分掉 3 口粮，高分 2 个，及格 1 个

## 文档同步约定

代码变更必须同步 `docs/` 对应页面 + `docs/changelog.html` 顶部追加一条；详见 [`docs/change-protocol.html`](docs/change-protocol.html)。

