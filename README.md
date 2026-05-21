# 🧮 数字积木大冒险

H5 数学闯关 + 宠物养成游戏。0-100 加减法做题赚积分，积分购买与喂养宠物。

> 完整需求与设计见 [`docs/DESIGN.md`](docs/DESIGN.md)。

## 技术栈

- 前端：Vue 3 + Vite + Pinia + GSAP，全手写 SVG 美术（Q版 Numberblocks 风格，可替换）
- 后端：Node.js + Fastify + better-sqlite3（本地单文件数据库）
- 鉴权：邮箱 + 密码（JWT，免邮箱验证）

## 运行

需要 Node 18+。

```bash
# 1. 第一次：一次性装好所有依赖（根目录 + 前端 + 后端）
cd math-pet-game
npm run install:all

# 2. 启动：一条命令同时拉起前后端
npm run dev
```

浏览器打开 http://localhost:5173 ，注册一个账号即可开始。终端里 `[后端]`(3001) / `[前端]`(5173) 分色显示日志，按 `Ctrl+C` 一起停止。

> 也可分别启动：`npm --prefix server run dev` 与 `npm --prefix client run dev`。

## 数据库

使用 **SQLite**（本地单文件数据库），文件自动生成在 `server/data/game.db`。
账号、积分、宠物、口粮、答题历史都存在这里。删除该文件即可重置全部存档。

## 已实现（V1）

- 0-100 加减法出题，数字积木拖拽答题（答案几位数就有几个空槽）
- 3 颗心 / 一轮 5 题，固定基础分 + 连对加成 + 满轮奖励
- 答错积木跳回、鼓励文案、可重试 / 可跳过
- 8 只宠物（明购 / 解锁 / 抽卡三种获取方式），每只专属口粮
- 宠物等级 + 亲密度成长，喂食升级，饥饿表情
- 账号注册登录，积分 / 宠物 / 口粮 / 答题历史持久化

## 规划（V1.1+）

- 装扮系统、成就、错题本 UI、音效

## 美术资源替换

所有美术是参数化 SVG 组件（`client/src/components/` 下 `NumberBlock.vue` / `PetSprite.vue` / `FoodIcon.vue`）。
后续如需替换为插画师/AI 出图，可改为 `<img>` 引用 `client/src/assets/svg/{blocks,pets,foods,ui}/` 下的资源，无需改动业务逻辑。
