# 📡 Skill Radar — Skills 集中营 / AI 情报 Dashboard

一个**本地优先、开源**的 AI 情报中枢：把过去 7 天的明星 **skills**、**高星 AI 开源项目**、
**Dev AI 新闻** 收进一份 markdown 档案，配一个**无需 login** 的 dashboard 查看、搜索、跟进。

- **共同数据**（名字 / 路径 / 星数 / 描述 / 更新时间 / 最新版本 / 各角色重要度）→ 存在 `data/*.md`，
  随 repo 走，谁 clone 都能用。
- **个人数据**（本机装了哪些、ignore / keep-track 标记、选的角色、搜索偏好）→ 存在**浏览器 localStorage**，
  不进 markdown。
- **数据采集** 不在本地做，也不调任何 LLM API：由**云端 Claude routine**（`/schedule`）定时或手动触发，
  采集 + 评级 + 写档 + push。本地只负责**读** + **扫本机已装情况**。

## 角色
进站先选 **Developer** 或 **UIUX**——同一份数据会按你选的视角显示「重要度」。顶栏随时切换。

## 页面
- `/` —— 选角色。
- `/dashboard` —— 总览（各状态计数、按角色的重点 skills、最近新闻）。
- `/skills` —— skills 主列表：**search & filter**、排序、**Check local skills**、**加 GitHub link**、每行 sync / ignore / keep-track。
- `/repos` —— 高星 AI 开源项目。
- `/news` —— Dev AI 新闻。

## Skill 状态
| 状态 | 含义 |
|---|---|
| `active` | 本机已装（来自 Check local skills，存浏览器） |
| `open` | 在架（更新 < 1 年）、未装、未忽略 |
| `pending` | 你手动加的 link，等下次 routine 补全详情 |
| `expired` | 上次更新 > 1 年 |
| `cancelled` | 你标了 ignore |

## 本地运行
```bash
npm install
npm run dev      # http://localhost:3000
# 或生产：
npm run build && npm run start
```
- 不需要 `GITHUB_TOKEN`、不需要 login（本地不抓 GitHub）。
- 点 **Check local skills** 会扫本机 `~/.claude`（skills 目录、`installed_plugins.json`、
  `known_marketplaces.json`）判断已装与版本——**仅本地运行时有效**。

## 更新数据（云端 routine）
本地没有「crawl now」。要拿新数据：
1. 把 repo push 到 GitHub。
2. 按 [`scripts/routine.md`](scripts/routine.md) 用 `/schedule` 建一个每天 08:00 的 routine（或手动触发一次）。
3. routine pull → 采集三类来源 → 补全 pending → 按 Developer/UIUX 评级 → 写 `data/*.md` → commit & push。
4. 本地刷新页面即可看到新数据。

## 部署到 Vercel（可选，未来）
可以部署成只读看板，但注意：
- **Check local skills** 在服务器上读不到访客的 `~/.claude` → 自动降级提示「仅本地可用」。
- **加 GitHub link** 需要写 `data/skills.md`，serverless 文件系统只读 → 自动降级提示。
- 若 `data/*.md` 缺失，各页显示空态而非报错。

## 数据格式
`data/*.md` 是普通 markdown 表（人读 + `lib/db.ts` 可解析）。列规范见各文件首行与
[`scripts/routine.md`](scripts/routine.md)。

## 技术栈
Next.js 14（App Router, TS）· markdown 当 DB · 无后端数据库 · 无 login。

> 注：`npm audit` 可能提示需升级到 Next 16 才能清掉的告警；Next 16 要求 Node 20+。本工具为本地看板、
> 无不可信输入，暂留在 Next 14.2.x（兼容 Node 18.17）。要清告警就升 Node 20 + `npm i next@latest`。
