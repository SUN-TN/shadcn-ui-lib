# AGENTS.md — shadcn-ui-lib

面向未来 agents 的项目工作须知。先读本文件再动手改代码。

---

## 项目定位

**shadcn-ui-lib** 是一个**对外发布的 shadcn registry 源**——以 GitHub 为分发通道，把组件作为源码 JSON 通过 `shadcn@latest add @shadcn-ui-lib/<name>` 安装到下游项目。不是普通前端项目，是组件库+registry的分发端。

| 维度     | 选型                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 远程     | `git@github.com:SUN-TN/shadcn-ui-lib.git`（默认分支 `main`，公开）                                                                                                                    |
| Runtime  | Node ≥ 22 + pnpm 11.10                                                                                                                                                                |
| 构建     | Vite 8 + `@vitejs/plugin-react@^6`（底层 OXC，**非 SWC、非 Babel**）                                                                                                                  |
| 语言     | **TypeScript `^6.0.3`**（`strict + verbatimModuleSyntax + noUncheckedIndexedAccess`）——见下方"为什么用 v6 不升 v7"                                                                    |
| 样式     | Tailwind v4（CSS-first，通过 `@tailwindcss/vite`，**没有 `tailwind.config`**）                                                                                                        |
| 演示     | Storybook 10 + `@storybook/react-vite`（addons：`@storybook/addon-a11y`、`@storybook/addon-themes`、`@storybook/addon-vitest`，**未装 `addon-essentials`**，因 SB10 无对应 v10 发布） |
| 测试     | Vitest **4.1.11**（钉版不升 5.x）+ jsdom + `@storybook/addon-vitest`（Vitest browser mode + Playwright Chromium）                                                                     |
| 主题     | `next-themes` + CSS 变量（light/dark/system）                                                                                                                                         |
| Radix    | **统一包 `radix-ui`**，不再按 `@radix-ui/react-*` 拆分（shadcn CLI v4.7+ 默认）                                                                                                       |
| 版本管理 | `@changesets/cli`                                                                                                                                                                     |

---

## 目录布局

```
src/
├── shadcn-ui-lib/
│   └── ui/                  # 组件源码（registry 内容来源）
│       └── stories/         # Storybook stories 与组件同级
├── components/theme/        # next-themes 包装
├── lib/utils.ts             # re-exports `cn` from the `cn` package (registry:lib source)
├── App.tsx, main.tsx
└── global.css              # Tailwind v4 主题变量
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

| 命令                                 | 用途                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| `pnpm dev`                           | 启动 Storybook（http://localhost:6006）                            |
| `pnpm typecheck`                     | `tsc -b --noEmit`                                                  |
| `pnpm lint`                          | ESLint（0 errors，2 个 Fast Refresh warning 为已知）               |
| `pnpm build`                         | `tsc -b && vite build`（产出 `dist/`）                             |
| `pnpm build-storybook`               | 产出 `storybook-static/`                                           |
| `pnpm test`                          | Vitest 跑 node + jsdom 两个 project（脚本显式排除 storybook）      |
| `pnpm test:watch`                    | 同上，watch 模式                                                   |
| `pnpm coverage`                      | 同上 + V8 coverage                                                 |
| `pnpm test-storybook`                | 跑 Storybook story（Vitest browser mode + Chromium，需先装浏览器） |
| `node scripts/generate-registry.cjs` | 从 `src/shadcn-ui-lib/ui/` 重新生成 `registry/*.json`              |
| `pnpm changeset`                     | 新建 changeset                                                     |

---

## 测试栈

### 三层测试架构

| 层         | 工具                                                                    | 用途                                                                 | 入口                  |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------- |
| 契约       | `scripts/__tests__/registry-contract.test.ts`（Vitest node project）    | 验证 `generate-registry.cjs` 产出符合分发契约（A1–A11 共 11 条断言） | `pnpm test`           |
| 组件行为   | `src/**/*.test.{ts,tsx}`（Vitest jsdom project + RTL）                  | 验证组件 props/状态/事件透传                                         | `pnpm test`           |
| Story 交互 | `src/**/*.stories.tsx` 的 `play` 函数（Vitest browser mode + Chromium） | 端到端模拟用户操作并断言                                             | `pnpm test-storybook` |

### 版本钉（硬约束）

- **Vitest 钉 `4.1.11`**——不能升 5.x。原因：`@storybook/addon-vitest@10.6.0` 的 peer 只到 `vitest ^3 || ^4`；升 5.x 会直接 install 失败。
- `@vitest/coverage-v8` 必须与 `vitest` **精确同版本**（peer 限定）
- `@vitest/browser-playwright` 必须与 `vitest` **精确同版本**
- `@playwright/test` 与 `chromium` 浏览器二进制：`pnpm install` 只装包，不下载浏览器，需手动 `pnpm exec playwright install chromium`（macOS 不加 `--with-deps`，仅 Linux CI 用）

### Vitest 配置结构（`vitest.config.ts`）

`projects` 数组下三个 project，每个都 `extends: true`（Vitest 4 inline project 默认 `extends: false`，必须显式打开才能继承 `@` 别名与 react/tailwind 插件）：

- `node`：`environment: 'node'`，只匹配 `scripts/__tests__/**/*.test.ts`
- `jsdom`：`setupFiles: ['./src/test/setup.ts']`，匹配 `src/**/*.test.{ts,tsx}`
- `storybook`：`browser.enabled: true` + `provider: playwright({})` + `headless: true` + `instances: [{ browser: 'chromium' }]` + `plugins: [storybookTest({ configDir, storybookScript: 'storybook dev --no-open' })]` + `setupFiles: ['./.storybook/vitest.setup.ts']`

`coverage` / reporters 只能写在根级 `test` 配置里，放进 project 无效。

### 关键约束（踩过的坑）

1. **`tsconfig.node.json` 必须包含 `vitest.config.ts` 与 `scripts/**/*.ts`**，并开 `allowImportingTsExtensions: true`——Vite 8 native config loader 要求 import 带 `.ts` 扩展名，否则会刷告警
2. **jsdom 缺 `matchMedia` / `ResizeObserver` / `DOMRect` / `hasPointerCapture` / `scrollIntoView` / `PointerEvent`**——`src/test/setup.ts` 必须 polyfill 这些（next-themes 与 Radix Select/Dialog/DropdownMenu 依赖）。browser mode 不需要这套 polyfill
3. **测试文件绝不能放 `src/shadcn-ui-lib/ui/` 顶层**——`generate-registry.cjs` 会用 `readdirSync(srcDir).filter(f => f.endsWith('.tsx'))` 扫顶层文件，把 `button.test.tsx` 当成组件生成 `button.test.json` 并污染 `index.json`。一律放子目录：`scripts/__tests__/` 或 `src/**/__tests__/`
4. **`@testing-library/dom` 必须显式装**——RTL 的必需 peer，`shamefully-hoist=false` 下根目录不可解析 storybook 内部已装的 10.4.x，不装则 `import { ... } from '@testing-library/react'` 直接 `Cannot find module`
5. **RTL 自动 cleanup 不生效**——本项目 `globals: false`（避免往 `tsconfig.app.json` 塞 `types: ["vitest/globals"]` 污染 app 配置），已在 `src/test/setup.ts` 手动 `afterEach(cleanup)`
6. **`@testing-library/jest-dom@7` 用 `/vitest` 入口**：`import '@testing-library/jest-dom/vitest'`

### Storybook story 的 play 函数（`src/**/*.stories.tsx`）

import 源必须是 **`storybook/test`**（无 `@` 作用域，由 `storybook@10.6.0` 通过 `storybook/test` 子路径提供），不要装 `@storybook/test@8`：

```ts
import { expect, screen, userEvent, within } from 'storybook/test';
```

它导出 `expect / screen / userEvent / within / fn / waitFor` 等全部所需标识符，且**不带 `pretty-format@27`**（这是与 `@storybook/test@8` 的关键差异——见下方浏览器兼容项）。

play 函数注意点：Radix Dialog/Tooltip 等会把内容 portal 到 `document.body`，需用 `screen`（全局查询）而非 `canvas` / `within(canvasElement)`。

### browser mode 兼容项（`pretty-format@27` 修复）

`@testing-library/dom@10.4.2`（direct devDep）transitively 依赖 `pretty-format@27.0.2`，其 `AsymmetricMatcher.js:10` 在模块顶层引用裸 `global`：

```js
var Symbol = global['jest-symbol-do-not-touch'] || global.Symbol;
```

浏览器环境无 `global`，导致 `ReferenceError: global is not defined`。**解法**：`vitest.config.ts` 根级加 Vite `define`：

```ts
define: {
  global: 'globalThis',
},
```

Vite transform 阶段把裸 `global` 替换为跨环境标准的 `globalThis`（Node.js 中 `globalThis === global`，无副作用；浏览器中 `globalThis` 是 ECMAScript 标准全局对象）。

这条**不能去掉**——`pretty-format@27` 是 RTL 的传递依赖，必须让它在浏览器里能跑。治标，不除根（根是旧包本身无法替换）。

---

## 组件开发流程

1. 通过 shadcn CLI 添加：`pnpm dlx shadcn@latest add <name>`——CLI 会写入 `src/shadcn-ui-lib/ui/<name>.tsx`，**不要**用 `src/components/ui/`（与本项目无关）
2. shadcn CLI 默认会加 `import { cn } from "cn"`——保留即可（**不要再 sed 替换**为本地 `@/lib/utils`）。`cn` 包取代了 `clsx` + `tailwind-merge`，是当前 cn 生态默认选项
3. 在 `src/shadcn-ui-lib/ui/stories/<name>.stories.tsx` 写 Storybook story
4. `node scripts/generate-registry.cjs` 同步 registry JSON
5. 写 changeset：`pnpm changeset`

---

## 色彩 token 的分发（registry:theme）

设计规范不能只停在 `src/global.css`，必须变成可安装的 registry 项，业务项目才会自动用上。

脚本 `generate-registry.cjs` 会解析 `src/global.css` 生成三个项（`src/global.css` 是唯一真源，**不要**手编这几个 JSON）：

- `theme`（`registry:theme`，自动随每个组件安装）
  - `:root` → `cssVars.light` → CLI 写入业务项目的 `:root`
  - `@theme inline` → `css["@theme inline"]` → CLI 逐字写入
  - 附 `@custom-variant dark (&:is(.dark *))` 与 `devDependencies: ["tw-animate-css"]`
- `theme-dark`（`registry:theme`，按需显式安装）：`.dark` → `cssVars.dark`。**不挂**到组件的 `registryDependencies`——避免业务装个 button 就把自定义暗色冲掉
- `theme-provider`（`registry:lib`）：`src/components/theme/theme-provider.tsx` → `@components/theme/theme-provider.tsx`

`theme` 被写进每个 UI 组件的 `registryDependencies`，所以 `add @shadcn-ui-lib/<name>` 会自动 upsert token（CLI 对 `registry:theme` 置 `overwriteCssVars: true`，会覆盖业务 `:root` 里的同名变量——这是"自动生效"的开关，也是要在 README 里写明的副作用）。

**改了 `src/global.css` 必须**立刻 `node scripts/generate-registry.cjs` 并 commit `registry/`；CI 已把 `src/global.css`、`src/components/theme/**` 加入 drift check 触发路径。

用 `--color-*` 映射走 `css["@theme inline"]` 而不是 `cssVars.theme`：后者依赖 CLI 对颜色值自动补 `--color-` 前缀的行为（不同版本不一致，可能生成 `--color-color-success`），`css` 段是逐字写入、行为确定。

## 业务项目接入（消费方）

1. 前置：Tailwind v4 + 已 `npx shadcn@latest init` 生成 `components.json`（v3 项目不会写 `@theme`，装了也不生效）
2. `components.json` 里注册本 registry：
   `"registries": { "@shadcn-ui-lib": "https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json" }`
3. `npx shadcn@latest add @shadcn-ui-lib/button` → 自动带装 `utils` 与 `theme`
4. 暗色切换：`npx shadcn@latest add @shadcn-ui-lib/theme-provider`，用 `<ThemeProvider attribute="class">` 包根组件；需要中性暗色基线再 `add @shadcn-ui-lib/theme-dark`
5. 验收：构建产物里能搜到 `.bg-primary`，且 `--primary` 解析为 `oklch(0.639 0.149 247.984)`（#3091E1）

## Registry 维护红线（重要）

shadcn CLI 的路径解析机制：

1. **`aliases.ui` 是工作区级单值**——所有 `registry:ui` 默认写到同一目录
2. **`shadcn registry add` 不会传染源端 `aliases`** 到用户项目
3. **真正决定目录的是每个 `files[].target`**——本项目每个 UI 组件都设了 `target: "@ui/shadcn-ui-lib/<name>.tsx"`
4. **`<name>.tsx` 引用内部组件时**只能用 `@/shadcn-ui-lib/ui/...`（保持与源端一致），`registryDependencies` 由脚本扫描 `@/` 别名自动生成
5. **utils 必须存在于 `registry/`**——所有 UI 组件的 `registryDependencies` 都包含 utils 的绝对 URL，缺失会导致用户项目 `Cannot find module '@/lib/utils'`
6. **同仓库依赖只能写绝对 URL**（脚本里的 `ITEM_URL()`）——裸名会被 CLI 解析成**官方 `@shadcn` 的同名组件**。写 `"button"` 拉到的是官方 button，落点是 `<aliases.ui>/button.tsx`，而组件里 import 的是 `@/shadcn-ui-lib/ui/button`，直接解析失败
7. **用到 `animate-in` / `animate-out` 的组件**必须带 `devDependencies: ["tw-animate-css"]`（脚本按正则自动加），否则业务项目动画失效

修改 `scripts/generate-registry.cjs` 时务必同步看 `registry/*.json` 的 diff，确保每个组件都生成了正确的 `target`、`dependencies`、`registryDependencies`。

---

## cn 库（取代 clsx + tailwind-merge）

- 本项目使用 [`cn`](https://www.npmjs.com/package/cn) 作为唯一类合并库
- 取代 `clsx` + `tailwind-merge`，API 完全兼容，性能 30×
- `src/lib/utils.ts` 仅 `export { cn } from "cn";`
- `registry/utils.json` 的 `dependencies: ["cn"]`，用户安装 registry 组件时 CLI 自动 `pnpm add cn`
- 已通过 `pnpm dlx shadcn@latest migrate cn` 完成迁移；**不要**额外安装 `clsx` 或 `tailwind-merge`
- shadcn CLI 生成新组件时默认导入的 `from "cn"` 是预期行为，**不要 sed 替换**

## 色彩 token（语义化，勿造新 token）

UI/UX 颜色设计规范已全部落在 `src/global.css` 的 shadcn 现有语义 token 上（OKLCH 格式）：

- **改颜色只改 `:root` 里现有 token 的值**，不要新增 `--brand-*` / `--font-*` / `--neutral-*` / `--aux-*` 之类的非语义 token
- 仅有 4 个补充 token：`--success`（#3AD75C）、`--warning`（#FE660A）、`--info`（#999999）、`--ink`（#212C3C，遮罩/强调）
- `--info` 于 2026-09-22 由 #00B2F8 改为 **#999999**，与 `--subtle-foreground` 同值；飞书《CSS Token 映射表 V1》已同步。**旧值 #00B2F8 作废**，任何文档中出现一律按 #999999 纠正（`--chart-2` 仍为 #00B2F8，不受影响）
- 辅助色的 60% / 20% 透明档**不建 token**——用 Tailwind v4 透明度修饰符：`bg-primary/60`、`bg-success/20`、`bg-ink/60`
- `.dark` 段是中性 oklch 基线（规范只定义亮色），**不要**顺手改暗色
- 明度阶梯约定：交互面 `#F0F0F0`(0.955) < 页面 `#F2F4F8`(0.967) < 模块/卡片 `#F5F5F5`(0.970)
- 换算新色值时用脚本算 OKLCH（sRGB→OKLab 数学），**不要**手抄近似值

## CI 约束

### `regen-registry.yml`（registry drift check）

任何 push 到 `main` 或 PR 修改 `src/shadcn-ui-lib/ui/**`、`src/lib/**`、`scripts/generate-registry.cjs` 都会触发：

1. 跑 `node scripts/generate-registry.cjs`
2. 检查 `registry/` 是否有未提交改动
3. 有改动 → CI fail，提示"registry/ is out of sync"

**开发流程铁律**：改完组件源码立刻跑一次 `node scripts/generate-registry.cjs` 并 commit `registry/`——否则 PR 会失败。

### `test.yml`（测试闸门）

5 个 job 并行（`lint` / `typecheck` / `test` / `build` / `storybook-test`），node 24，`pnpm/action-setup@v4` + `cache: pnpm`，`paths-ignore: ['**/*.md']`。

- `test` job：跑 `pnpm test`（node + jsdom project）
- `storybook-test` job：先 `pnpm exec playwright install --with-deps chromium`（CI 是 Ubuntu 必须装系统依赖），再 `pnpm test-storybook`
- coverage 作为 artifact 上传，**无 threshold**（组件覆盖率从 0 起步，不卡门）

### 本地分支运行注意事项

- 本沙箱跑 `pnpm add` / `pnpm install`（非 frozen）会被文件代理层拦，依赖装完后**必须**在自己终端跑一次 `pnpm install` 恢复正常链接
- 本沙箱跑 `eslint` / `tsc -p tsconfig.app.json` 会被 SIGTERM（exit 137），无法本地验证 lint 与 app typecheck，验证优先用 `pnpm test`

---

## TypeScript / lint 已知约束

### 为什么用 TypeScript v6 不升 v7

`package.json` 锁定 `typescript: ^6.0.3`，**不要**自作主张升 v7。原因：

- `typescript-eslint@8.70`（项目当前用的版本）**暂不支持** TypeScript 7.0
- 升 v7 会导致 `pnpm lint` 直接抛 `typescript-eslint does not support TS 7.0`（参见 [typescript-eslint/typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)）
- TS 7 的新特性（如 `erasableSyntaxOnly`）在本项目也用不上——v6 已提供 `strict + verbatimModuleSyntax + noUncheckedIndexedAccess` 等现代严格选项
- 等待 typescript-eslint 官方跟进后，再单独评估升级；当前**禁止**改 `typescript` 字段版本号

### 其他约束

- `tsconfig.app.json` 启用 `verbatimModuleSyntax`——**禁止**直接用 `React.CSSProperties` 等隐式全局类型，必须 `import type { CSSProperties } from 'react'` 后写 `as CSSProperties`（`sonner.tsx` 已踩过这个坑）
- 不要在 `dependencies` 数组里加 `react` / `react-dom`——脚本有 `KNOWN_PEERS` 过滤
- `package.json` 是 `"type": "module"`——CommonJS 脚本必须 `.cjs` 后缀
- `@vitejs/plugin-react@^6` 底层是 OXC，**不要**加 `@vitejs/plugin-react-swc`、`@vitejs/plugin-react-oxc` 等
- Storybook v10 不再提供 `addon-essentials` v10 兼容版——只能单独装 `a11y` / `themes` / `vitest`

---

## 不要做的事

- ❌ 手动编辑 `registry/*.json`（脚本会覆盖）
- ❌ 在 `src/components/ui/` 下放组件（与本项目隔离目录无关）
- ❌ 在用户项目 README 里宣称「通过 `aliases.ui` 隔离目录」（CLI 不支持）
- ❌ 直接 commit 不跑 `generate-registry.cjs`（CI 会拦截）
- ❌ 把 `@vitejs/plugin-react` 降级到 v5（依赖 Storybook 10 与 v6 配套）
- ❌ 在 `pnpm release` 前去掉 `"private": true`（当前不需要发布 npm 包）
- ❌ 重新安装 `clsx` 或 `tailwind-merge`——`cn` 已完全替代，registry 也只声明 `cn`
- ❌ 把 Vitest 升到 5.x——`@storybook/addon-vitest@10.6.0` 的 peer 只到 `vitest ^3 || ^4`
- ❌ story 的 play 函数从 `@storybook/test@8` import——它是 SB8 旧包，依赖图里带 `pretty-format@27`，在 browser mode 中因裸 `global` 引用崩；改用 `storybook/test`
- ❌ 把测试文件放 `src/shadcn-ui-lib/ui/` 顶层（`generate-registry.cjs` 会当成组件生成 `button.test.json` 污染 index.json）；放 `scripts/__tests__/` 或 `src/**/__tests__/`
- ❌ 删 `vitest.config.ts` 里的 `define: { global: 'globalThis' }`——它是 `pretty-format@27` 在 browser mode 下不崩的关键
