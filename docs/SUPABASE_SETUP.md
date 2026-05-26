# Supabase 配置指南（傻瓜版）

游戏现在是**纯前端 + Supabase**：没有自己的后端，账号和数据都存在 Supabase（免费）。
按下面 5 步做完，游戏就能跑起来。全程约 10 分钟。

---

## 第 1 步：注册并创建项目

1. 打开 https://supabase.com ，用 GitHub 或邮箱注册（免费）。
2. 进控制台点 **New project**。
3. 填：
   - **Name**：随便起，比如 `math-pet-game`
   - **Database Password**：设一个数据库密码（自己记住，**这不是游戏登录密码**）
   - **Region**：选离你近的（如 `Northeast Asia (Tokyo)`）
4. 点 **Create new project**，等 1-2 分钟初始化完成。

---

## 第 2 步：建表（粘贴 SQL 一键执行）

1. 左侧菜单点 **SQL Editor** → **New query**。
2. 打开本仓库的 [`supabase/schema.sql`](../supabase/schema.sql)，**全选复制**里面所有内容。
3. 粘贴到 SQL 编辑器，点右下角 **Run**。
4. 看到 `Success. No rows returned` 就对了（建表 + 权限 + 触发器都装好了）。

> 💡 脚本用 `create table if not exists`，**升级后可安全重跑**：新增了 `user_fragments`（稀有宠物碎片）表时，重跑一次 schema.sql 即可补建。

---

## 第 3 步：关闭邮箱验证（很重要）

我们约定**注册不需要验证邮箱**，所以要关掉它：

1. 左侧 **Authentication** → **Sign In / Providers**（或 **Providers** → **Email**）。
2. 找到 **Confirm email**（确认邮箱）这个开关，**关掉**它。
3. 保存。

> 不关的话，注册后会卡在"等待邮箱验证"，游戏里会提示你来关这个开关。

---

## 第 4 步：拿到两个钥匙填进 .env

1. 左侧 **Project Settings**（齿轮）→ **API**。
2. 复制两样东西：
   - **Project URL**（形如 `https://abcdxxxx.supabase.co`）
   - **anon public** key（一长串，**不是** `service_role`！）
3. 在项目里进入 `client/` 目录，把 `.env.example` 复制成 `.env`：
   ```bash
   cd client
   cp .env.example .env
   ```
4. 编辑 `client/.env`，填进去：
   ```
   VITE_SUPABASE_URL=https://abcdxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=粘贴你的-anon-public-key
   ```

> ⚠️ `anon` key 是设计上可以公开在前端的，安全由数据库的 RLS 策略保证（每个人只能动自己的数据）。
> 千万**不要**把 `service_role` key 放进前端。

---

## 第 5 步：启动！

```bash
cd math-pet-game
npm run install:all   # 第一次装依赖
npm run dev           # 启动（端口 5173）
```

浏览器打开 http://localhost:5173 ，注册一个账号（密码至少 6 位）即可开始玩。

---

## 验证清单

- [ ] 能注册、能登录（不卡在邮箱验证）
- [ ] 闯关答对后积分增加（回首页看右上角金币）
- [ ] 商店能买宠物 / 买口粮 / 扭蛋
- [ ] 宠物屋能喂食、升级
- [ ] 退出再登录，数据还在
- [ ] 在另一台设备 / 浏览器登录同一账号，进度同步（这就是上云的意义）

如果哪一步报错，把错误信息发我，我帮你定位。常见问题：
- **注册提示"开启了邮箱验证"** → 回第 3 步关掉 Confirm email。
- **白屏 + 控制台报"缺少配置"** → `.env` 没填或没重启 `npm run dev`。
- **报 row-level security / permission** → 第 2 步 SQL 没跑成功，重跑一遍。
