# AGENTS.md — shadcn-ui-lib

面向未来 ZCode agents 的项目工作须知。先读本文件再动手改代码。

---

## 项目定位

**shadcn-ui-lib** 是一个**对外发布的 shadcn registry 源**——以 GitHub 为分发通道，把组件作为源码 JSON 通过 `shadcn@latest add @shadcn-ui-lib/<name>` 安装到下游项目。不是普通前端项目，是组件库+registry的分发端。

| 维度 | 选型 |
|---|---|
| 远程 | `git@github.com:SUN-TN/shadcn-ui-lib.git`（默认分支 `main`，公开） |
| Runtime | Node ≥ 22 + pnpm 11.10 |
| 构建 | Vite 8 + `@vitejs/plugin-react@^6`（底层 OXC，**非 SWC、非 Babel**） |
| 语言 | TypeScript 6（`strict + verbatimModuleSyntax + noUncheckedIndexedAccess`） |
| 样式 | Tailwind v4（CSS-first，通过 `@tailwindcss/vite`，**没有 `tailwind.config`**） |
| 演示 | Storybook 10 + `@storybook/react-vite`（仅 `@storybook/addon-a11y`、`@storybook/addon-themes`，**未装 `addon-essentials`**，因 SB10 无对应 v10 发布） |
| 主题 | `next-themes` + CSS 变量（light/dark/system） |
| Radix | **统一包 `radix-ui`**，不再按 `@radix-ui/react-*` 拆分（shadcn CLI v4.7+ 默认） |
| 版本管理 | `@changesets/cli` |

---

## 目录布局

```
src/
├── shadcn-ui-lib/
│   └── ui/                  # 组件源码（registry 内容来源）
│       └── stories/         # Storybook stories 与组件同级
├── components/theme/        # next-themes 包装
├── lib/utils.ts             # cn() 工具（registry:lib 项的源）
├── App.tsx, main.tsx
└── index.css               # Tailwind v4 主题变量
registry/                    # 发布用的 JSON（脚本生成，**勿手动编辑**）
scripts/generate-registry.cjs
.github/workflows/regen-registry.yml   # CI drift check
.storybook/
```

**关键路径映射**：
- 用户安装 `@shadcn-ui-lib/<name>` 后落到用户项目的 `<aliases.ui>/shadcn-ui-lib/<name>.tsx`（**不是** `<aliases.ui>/<name>.tsx`）
- `lib/utils` 通过 `@lib/utils.ts` target 落到 `<aliases.lib>/utils.ts`
- 与默认 `@shadcn` registry **不会**互相覆盖（因为每个文件都显式 `target`）

---

## 命令

| 命令 | 用途 |
|---|---|
| `pnpm dev` | 启动 Storybook（http://localhost:6006） |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | ESLint（0 errors，2 个 Fast Refresh warning 为已知） |
| `pnpm build` | `tsc -b && vite build`（产出 `dist/`） |
| `pnpm build-storybook` | 产出 `storybook-static/` |
| `node scripts/generate-registry.cjs` | 从 `src/shadcn-ui-lib/ui/` 重新生成 `registry/*.json` |
| `pnpm changeset` | 新建 changeset |

---

## 组件开发流程

1. 通过 shadcn CLI 添加：`pnpm dlx shadcn@latest add <name>`——CLI 会写入 `src/shadcn-ui-lib/ui/<name>.tsx`，**不要**用 `src/components/ui/`（与本项目无关）
2. shadcn CLI 默认会加 `import { cn } from "cn"`——**必须** sed 替换为 `import { cn } from "@/lib/utils"`，并 `pnpm remove cn`
3. 在 `src/shadcn-ui-lib/ui/stories/<name>.stories.tsx` 写 Storybook story
4. `node scripts/generate-registry.cjs` 同步 registry JSON
5. 写 changeset：`pnpm changeset`

---

## Registry 维护红线（重要）

shadcn CLI 的路径解析机制：

1. **`aliases.ui` 是工作区级单值**——所有 `registry:ui` 默认写到同一目录
2. **`shadcn registry add` 不会传染源端 `aliases`** 到用户项目
3. **真正决定目录的是每个 `files[].target`**——本项目每个 UI 组件都设了 `target: "@ui/shadcn-ui-lib/<name>.tsx"`
4. **`<name>.tsx` 引用内部组件时**只能用 `@/shadcn-ui-lib/ui/...`（保持与源端一致），`registryDependencies` 由脚本扫描 `@/` 别名自动生成
5. **utils 必须存在于 `registry/`**——所有 UI 组件的 `registryDependencies` 都包含 `"utils"`，缺失会导致用户项目 `Cannot find module '@/lib/utils'`

修改 `scripts/generate-registry.cjs` 时务必同步看 `registry/*.json` 的 diff，确保每个组件都生成了正确的 `target`、`dependencies`、`registryDependencies`。

---

## CI 约束（`.github/workflows/regen-registry.yml`）

任何 push 到 `main` 或 PR 修改 `src/shadcn-ui-lib/ui/**`、`src/lib/**`、`scripts/generate-registry.cjs` 都会触发：

1. 跑 `node scripts/generate-registry.cjs`
2. 检查 `registry/` 是否有未提交改动
3. 有改动 → CI fail，提示"registry/ is out of sync"

**开发流程铁律**：改完组件源码立刻跑一次 `node scripts/generate-registry.cjs` 并 commit `registry/`——否则 PR 会失败。

---

## TypeScript / lint 已知约束

- `tsconfig.app.json` 启用 `verbatimModuleSyntax`——**禁止**直接用 `React.CSSProperties` 等隐式全局类型，必须 `import type { CSSProperties } from 'react'` 后写 `as CSSProperties`（`sonner.tsx` 已踩过这个坑）
- 不要在 `dependencies` 数组里加 `react` / `react-dom`——脚本有 `KNOWN_PEERS` 过滤
- `package.json` 是 `"type": "module"`——CommonJS 脚本必须 `.cjs` 后缀
- `@vitejs/plugin-react@^6` 底层是 OXC，**不要**加 `@vitejs/plugin-react-swc`、`@vitejs/plugin-react-oxc` 等
- TypeScript 6 + typescript-eslint@8.70；TS7 暂未兼容 typescript-eslint
- Storybook v10 不再提供 `addon-essentials` v10 兼容版——只能单独装 a11y/themes

---

## 不要做的事

- ❌ 手动编辑 `registry/*.json`（脚本会覆盖）
- ❌ 在 `src/components/ui/` 下放组件（与本项目隔离目录无关）
- ❌ 在用户项目 README 里宣称「通过 `aliases.ui` 隔离目录」（CLI 不支持）
- ❌ 直接 commit 不跑 `generate-registry.cjs`（CI 会拦截）
- ❌ 把 `@vitejs/plugin-react` 降级到 v5（依赖 Storybook 10 与 v6 配套）
- ❌ 在 `pnpm release` 前去掉 `"private": true`（当前不需要发布 npm 包）