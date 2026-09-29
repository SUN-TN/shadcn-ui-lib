---
name: 'figma-ai-bridge'
description: 'Bridges Figma designs into shadcn/ui registry components (React 19 + TS6 + Tailwind v4) with Storybook stories. Invoke when building components from Figma links, frames, nodes, or screenshots.'
---

# Figma AI Bridge — 设计稿到 shadcn registry 组件的标准作业流程

把 Figma 设计稿**像素级还原**为本项目（shadcn registry 分发源）中可安装的组件：组件源码 → 自动生成 registry JSON → Storybook 预览。项目宪法见 `AGENTS.md`，本 skill 是其面向 Figma 工作流的操作手册；冲突时以 `AGENTS.md` 为准。

## 何时触发

- 用户提供 Figma 文件/帧/节点链接（含 `?node-id=` 的 URL）、设计稿导出 JSON、设计稿截图加标注
- 用户说「按 Figma / 设计稿实现组件」「把这个设计稿转成组件」
- 用户要求新增/改造组件并要求同时产出 registry 项与 Storybook story

## 技术栈铁律（不可偏离）

React 19（函数组件）+ Vite 8（OXC，非 Babel/SWC）+ TypeScript 6 `strict`（**禁止升 v7**）+ Tailwind v4（CSS-first，**没有 tailwind.config**）+ **Base UI**（`@base-ui/react`，已替代 radix-ui）+ shadcn/ui（new-york style）+ Storybook 10 + pnpm 11 / Node ≥ 22。

- 无头库一律用 **Base UI**，按子路径导入：`import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`；**禁止** `radix-ui` 与 `@radix-ui/react-*`（项目已从 Radix 迁移）
- 类名合并只用 `cn`：`import { cn } from "@/lib/utils"`；禁止 `clsx` / `tailwind-merge`
- 图标只用 `lucide-react`，命名 `XIcon` 形式
- 变体用 `class-variance-authority`（`cva` + `VariantProps`）
- `verbatimModuleSyntax`：类型导入必须 `import type { ... }`；禁止隐式全局类型（如 `React.CSSProperties`），需 `import type { CSSProperties } from "react"`
- React 19 不需要 `forwardRef`，ref 随 props 透传；Base UI 组件把 `ref` 指向**真实 DOM 元素**，命令式能力（focus / scroll / validate 等）另走 `actionsRef`
- 组合替代 `asChild`：Base UI 已移除 `asChild`，用 `render` prop 组合（如 `useRender({ defaultTagName, render, ref, props })`）

## 标准流程（7 个阶段，按序执行）

### 阶段 1：获取并解析设计稿

先明确输入来源，优先级从高到低：

1. **Figma REST API**：从链接提取 `file key` 与 `node-id`（注意 URL 里的 `:` 要还原，如 `12-345` → `12:345`）。环境中有 `FIGMA_TOKEN` / `FIGMA_ACCESS_TOKEN` 时：
   ```bash
   curl -sS -H "X-Figma-Token: $FIGMA_TOKEN" \
     "https://api.figma.com/v1/files/<FILE_KEY>/nodes?ids=<NODE_ID>&geometry=paths"
   ```
   可再请求 `/images/<FILE_KEY>?ids=<NODE_ID>&format=png&scale=2` 拿渲染图做视觉对照。
2. **用户粘贴的节点 JSON / 标注数据**
3. **截图 + 人工标注**：信息不足（缺色值、字号、间距、状态）时必须向用户追问，**禁止臆测像素值**

从设计数据中提取并形成「组件规格」：

- 组件命名：kebab-case 文件名（`user-card.tsx`），PascalCase 导出名（`UserCard`）
- Auto Layout → flex/grid；`itemSpacing` → `gap-*`；padding → `p-*`；约束 → 对齐/伸缩类
- 尺寸、字号、字重、行高、圆角、阴影、描边、z-index
- fills（纯色为主；渐变/图片单独标注）
- **全部状态**：default / hover / active / focus-visible / disabled / selected / error（aria-invalid）/ open-closed（data-state）
- 交互语义：有无浮层、焦点管理、键盘操作 → 决定对应哪个 Base UI 部件（`@base-ui/react/<part>`）
- 断点与响应式行为；图标清单（逐个映射到 lucide）

### 阶段 2：设计值 → 设计 token 映射（最关键的一步）

**设计稿里的颜色不允许硬编码 hex 进组件**，必须映射到 `src/global.css` 既有语义 token：

| 设计稿色值 | 用途                          | token / 工具类                                    |
| ---------- | ----------------------------- | ------------------------------------------------- |
| #3091E1    | 品牌主色、链接、聚焦环        | `primary` / `ring`（`bg-primary` `text-primary`） |
| #F2F4F8    | 页面背景                      | `background`                                      |
| #F5F5F5    | 卡片/弹层/侧栏表面            | `card` / `popover` / `sidebar`                    |
| #F0F0F0    | 交互面、弱底、次级按钮、hover | `secondary` / `muted` / `accent`                  |
| #333333    | 正文/标题                     | `foreground`                                      |
| #666666    | 次要文字                      | `muted-foreground`                                |
| #D9D9D9    | 描边、输入框边                | `border` / `input`                                |
| #FD2237    | 危险/删除                     | `destructive`                                     |
| #3AD75C    | 成功                          | `success`                                         |
| #FE660A    | 警告                          | `warning`                                         |
| #999999    | 信息（与次要弱化文字同值）    | `info`（旧值 #00B2F8 已作废）                     |
| #212C3C    | 遮罩/强调暗色                 | `ink`                                             |

- 半透明档**不建 token**，用 Tailwind v4 透明度修饰符：`bg-primary/60`、`bg-success/20`、`bg-ink/60`
- 设计稿颜色找不到对应 token 时：先选语义最接近的；确属品牌级偏差时**只能修改 `:root` 里现有 token 的值**，禁止新增 `--brand-*` / `--font-*` / `--neutral-*` 等非语义 token
- 改 token 值时 sRGB → OKLCH 必须用脚本换算（线性化 → OKLab → 圆柱坐标），**禁止手抄近似值**；且改完 `src/global.css` 必须立即重跑 registry 脚本（见阶段 5）
- 圆角：**控件**（按钮、输入框等可交互元素）统一 `rounded-sm`（= `--radius-sm`，4px）；容器 / 卡片 / 浮层等表面用 `rounded-md`/`rounded-lg`（走 `--radius: 0.625rem` 阶梯）；间距走 4px 基准的 Tailwind 刻度
- `.dark` 是中性暗色基线，规范只定义亮色——**不要顺手改暗色**；组件只需保证暗色下不破样

### 阶段 3：实现组件源码

**位置（放错即违规）**：

- 组件：`src/shadcn-ui-lib/ui/<name>.tsx`（**禁止** `src/components/ui/`）
- Story：`src/shadcn-ui-lib/ui/stories/<name>.stories.tsx`

若设计稿对应 shadcn 官方组件的定制版，优先用 CLI 拉骨架再按稿改造：`pnpm dlx shadcn@latest add <name>`（CLI 写入的位置即正确位置）。

代码规范（对齐 `src/shadcn-ui-lib/ui/button.tsx`、`dialog.tsx`）：

- import 分组顺序：`react` → 第三方（`@base-ui/react/*` / `lucide-react` / `class-variance-authority`）→ 空行 → `@/` 别名
- 每个语义元素都加 `data-slot="<name>-<part>"`；复合组件做命名导出 + 子部件导出（`Dialog` / `DialogTrigger` / `DialogContent` …）
- props 类型复用 primitive：`React.ComponentProps<typeof XPrimitive.Root>`；自定义 props 用交叉类型
- 函数声明 `function Button(...)`，不要箭头函数常量
- 样式用 `cn(baseOrCva({ variant, size }), className)`，保证 `className` 永远可覆盖
- 交互态类名范式：`focus-visible:ring-[3px] focus-visible:ring-ring/50`、`disabled:pointer-events-none disabled:opacity-50`、`aria-invalid:border-destructive`
- 进出动画用 `data-[state=open]:animate-in data-[state=open]:fade-in-0` / `animate-out`（脚本检测到 `animate-in|out` 会自动声明 `tw-animate-css`）
- 内部组件引用只能写 `@/shadcn-ui-lib/ui/<name>`（registry 脚本据此自动生成依赖）；**禁止裸名**（裸名会被 CLI 解析成官方 @shadcn 同名组件导致安装失败）
- 组件内不写业务文案以外的魔法值；尺寸/间距优先用设计稿的精确数值对照 Tailwind 刻度
- 无特殊需要不要加注释；不引入 `react`/`react-dom` 到 dependencies（脚本有 KNOWN_PEERS 过滤）

### 阶段 4：编写 Storybook story

- 固定骨架（参照 `stories/button.stories.tsx`、`stories/dialog.stories.tsx`）：
  - `import type { Meta, StoryObj } from '@storybook/react'`
  - `const meta = { title: 'Components/<Name>', component: <Name>, tags: ['autodocs'], ... } satisfies Meta<typeof <Name>>`
  - `type Story = StoryObj<typeof meta>`
  - 从相对路径导入组件：`from '../<name>'`
- **覆盖设计稿中的每个视觉变体与状态**：每个 variant/size 一个 story；disabled、带图标、错误态等单独成 story
- 有 cva variants 时在 `argTypes` 提供 `control: 'select'` 的 options，并设 `args` 默认值
- 浮层/触发类组件用 `render: () => (...)` 组装 Trigger + Content（参考 dialog story），确保可交互、可键盘操作
- Story 仅用于演示，不引入 mock 数据库；文案可用占位但语义要真实
- 无 `addon-essentials`，不要引用 docs/controls 等未安装 addon 的能力

### 阶段 5：生成 shadcn registry（铁律，漏做会被 CI 拦截）

1. 若新组件不在 `scripts/generate-registry.cjs` 顶部的 `meta` 映射中，补一项 `title` / `description`（不补会退化为空描述）
2. 运行：
   ```bash
   node scripts/generate-registry.cjs
   ```
3. **审查 `registry/<name>.json` 与 `registry/index.json` 的 diff**，确认：
   - `files[0].target === "@ui/shadcn-ui-lib/<name>.tsx"`（保证安装到 `<aliases.ui>/shadcn-ui-lib/`，不与官方组件互相覆盖）
   - `dependencies` 只含真实 npm 包（`@base-ui/react`、`class-variance-authority`、`lucide-react`、`sonner` 等），不含 react/react-dom，不含 `cn`（cn 由 utils 项携带）
   - `registryDependencies` 含 utils、theme 及内部依赖的**绝对 GitHub raw URL**（由脚本自动生成）
   - 有动画类时含 `devDependencies: ["tw-animate-css"]`
4. **禁止手编 `registry/*.json`**——脚本是唯一真源，手改会被下次生成覆盖
5. 若阶段 2 改过 `src/global.css` 或 `src/components/theme/**`，确认 `theme*.json` 同步变化

### 阶段 6：验证与视觉回归

```bash
pnpm typecheck   # tsc -b --noEmit，必须零错误
pnpm lint        # 0 errors；2 个既有 Fast Refresh warning 为已知可接受
pnpm dev         # 起 Storybook http://localhost:6006，逐 story 对照 Figma 渲染图
```

- 视觉对照：颜色取色比对 token 渲染值（主色应解析为 `oklch(0.639 0.149 247.984)` / #3091E1）；间距、字号、圆角、阴影逐项过
- a11y（项目装了 `@storybook/addon-a11y`）：键盘可达、焦点可见、弹窗焦点管理、颜色对比度、图标按钮有 aria-label
- 主题：在 Storybook 主题切换器下验证 light/dark 均不破样
- 可选：`pnpm build-storybook` 确认生产构建通过

#### 计算样式核验（Tailwind 类的实际效果——禁止靠读类名推断）

某条类**是否真的生效**必须读真实浏览器计算样式。以下三处极易误判：

1. **`border-color` 单独出现时可能完全无效**：Tailwind v4 preflight 对 `*` 设 `border: 0 solid`（`node_modules/tailwindcss/preflight.css:15`），全局 border-width = 0。故 `focus-visible:border-ring` 这类**只设颜色、不设宽度**的声明，在没有 `border`/`border-*` 宽度类的元素上是**死代码**。注意：环（`ring-*`）走 `box-shadow`，与 border 无关，不受此影响。
2. **`transition-all` 会污染测量**：聚焦/悬停后立即读样式拿到的是过渡中间值。必须等过渡结束（≥ 400–700ms）再读。
3. **程序化 `.focus()` 不保证匹配 `:focus-visible`**：必须用真实键盘 `Tab` 触发。

核验步骤：

```bash
./node_modules/.bin/vite build        # 产出 dist/assets/*.css（dist 已在 .gitignore）
```

在 `/tmp` 写一个独立 HTML，用**从组件源码原样复制的类串**渲染目标元素，`<link>` 指向 `dist/assets/*.css`（用绝对 `file://` 路径），再用 Playwright 读计算样式：

```js
const { chromium } = require('@playwright/test');
// await page.goto('file:///tmp/check.html');
// await page.keyboard.press('Tab'); await page.waitForTimeout(700);
// await page.evaluate((p) => eval(p)(document.activeElement), PROBE);  // PROBE 读 borderTopWidth/Color、boxShadow、outline*
```

运行（本机 pnpm 受限，用绝对路径）：`NODE_PATH=<项目>/node_modules <managed node> /tmp/check.js`

> 实测案例（2026-09-24）：Button `default` 聚焦后 `borderTopWidth` 仍为 **0px**（`focus-visible:border-ring` 是死代码），可见指示只有 `…/0.5) 0 0 0 3px` 的环；而 `outline` 变体与 Input 的 border 变为 1px ring 色。详见《组件通用规范》草稿 §5.5。

### 阶段 7：收尾

- 需要进入发布流程时引导用户：`pnpm changeset`（描述新增组件）
- 交付总结需列出：新增/修改文件、设计稿→token 的映射决策（特别是任何非一对一映射）、story 清单、registry diff 要点、遗留待确认项

## 还原质量检查清单（交付前逐项确认）

- [ ] 组件位于 `src/shadcn-ui-lib/ui/`，story 位于同级 `stories/`
- [ ] 零硬编码 hex/rgb；所有颜色走语义 token；透明度走 `/<n>` 修饰符
- [ ] 字号/行高/字重/间距/圆角/阴影/尺寸与设计稿一致（4px 基准刻度）
- [ ] default/hover/active/focus-visible/disabled/error/open-closed 状态齐全
- [ ] Base UI 部件来自 `@base-ui/react` 子路径导入；图标来自 `lucide-react`；cn 来自 `@/lib/utils`
- [ ] 类型导入用 `import type`；无 `React.CSSProperties` 等隐式全局类型
- [ ] 每个元素有 `data-slot`；`className` 可被外部覆盖；内部依赖走 `@/shadcn-ui-lib/ui/`
- [ ] Story 覆盖设计稿全部变体，浮层 story 可键盘交互
- [ ] 已运行 registry 脚本并人工核对 JSON 的 target / dependencies / registryDependencies
- [ ] `pnpm typecheck`、`pnpm lint` 通过；Storybook 视觉对照通过；dark 模式不破样
- [ ] 未手编 registry JSON、未改 `.dark` 基线、未新增非语义 token、未动 TypeScript 版本

## 红线速查（摘自 AGENTS.md）

❌ 手编 `registry/*.json` ❌ 用 `src/components/ui/` ❌ 内部依赖写裸名 ❌ 硬编码颜色/新增 `--brand-*` ❌ 安装 clsx/tailwind-merge ❌ 使用 `radix-ui`（已迁 Base UI） ❌ 改 `.dark` ❌ 升 TypeScript 7 ❌ 加 `@vitejs/plugin-react-swc` ❌ commit 前不跑 registry 脚本（CI drift check 必挂）
