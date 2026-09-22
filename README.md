# shadcn-ui-lib

基于 **React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + shadcn/ui + Storybook 10** 的组件库脚手架。

## 技术栈

- **构建**: Vite 8 + `@vitejs/plugin-react` v6（底层 OXC）
- **语言**: TypeScript `^6.0.3`（`strict + verbatimModuleSyntax + noUncheckedIndexedAccess`）—— 当前用 v6 不升 v7 是因为 `typescript-eslint@8.70` 暂未兼容 TS 7.0（见 [issue 10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)）；待官方跟进后再单独评估升级。详见 [AGENTS.md](./AGENTS.md)。
- **样式**: Tailwind CSS v4（CSS-first，通过 `@tailwindcss/vite`）
- **UI**: shadcn/ui（按需 `pnpm dlx shadcn@latest add <name>` 拉取源码）
- **演示**: Storybook 10 + `@storybook/react-vite`
- **主题**: `next-themes` + CSS 变量（light / dark / system）
- **图标**: `lucide-react`
- **通知**: `sonner`
- **工程化**: ESLint 9 flat config + Prettier 3 + Husky + lint-staged
- **版本管理**: `@changesets/cli`

## 目录结构

```
src/
├── shadcn-ui-lib/
│   └── ui/                  # shadcn-ui-lib 组件源码（10 件套）
│       ├── button.tsx
│       ├── input.tsx
│       ├── stories/         # 每个组件的 Storybook story
│       └── ...
├── components/
│   └── theme/               # next-themes 包装
├── lib/
│   └── utils.ts             # re-exports `cn` from the `cn` package
├── App.tsx
├── main.tsx
└── global.css              # Tailwind v4 入口 + 主题变量
registry/                    # Registry JSON（发布源）
.storybook/                 # Storybook 配置
.github/workflows/          # CI
scripts/                    # registry 生成脚本
```

## 命令

| 命令                                 | 说明                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                           | 启动 Storybook（http://localhost:6006）               |
| `pnpm build-storybook`               | 构建 Storybook 静态站点到 `storybook-static/`         |
| `pnpm build`                         | TypeScript 检查 + Vite 生产构建                       |
| `pnpm typecheck`                     | 仅类型检查                                            |
| `pnpm lint` / `pnpm lint:fix`        | ESLint                                                |
| `pnpm format`                        | Prettier 全量格式化                                   |
| `pnpm changeset`                     | 新建 changeset                                        |
| `node scripts/generate-registry.cjs` | 从 `src/shadcn-ui-lib/ui/` 重新生成 `registry/*.json` |

## 添加新组件

```bash
pnpm dlx shadcn@latest add <component-name>
```

shadcn CLI 会把组件源码写到 `src/shadcn-ui-lib/ui/<name>.tsx`。导入路径已统一为 `@/lib/utils`。

随后在 `src/shadcn-ui-lib/ui/stories/` 下新建 `<name>.stories.tsx`。

最后跑一次 `node scripts/generate-registry.cjs` 同步 registry JSON。

## 主题

主题由 `next-themes` 管理（`attribute="class"`，`defaultTheme="system"`），与 Tailwind v4 的 `@custom-variant dark (&:is(.dark *))` 配合。

在 Storybook 中可使用顶部 **Themes** 工具栏切换 light / dark。

## 色彩 token（语义化）

UI/UX 颜色设计规范已全部落在 shadcn 现有语义 token 上（`src/global.css`，OKLCH 格式），**不新增品牌色工具类**；仅补充 4 个 shadcn 缺失的状态/强调 token：`--success`、`--warning`、`--info`、`--ink`。

### 设计规范 → 语义 token 映射（亮色 `:root`）

| 设计规范           | 语义 token                                                                    | 值（oklch）                     |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------- |
| 主色·蓝 `#3091E1`  | `--primary` / `--ring` / `--sidebar-primary` / `--sidebar-ring` / `--chart-1` | `oklch(0.639 0.149 247.984)`    |
| 主色·青 `#00B2F8`  | `--chart-2`（仅图表；`--info` 已于 2026-09-22 改为 `#999999`）                | `oklch(0.722 0.155 235.785)`    |
| 主色·暗 `#212C3C`  | `--ink`（标题强调 / 遮罩）                                                    | `oklch(0.29 0.033 257.673)`     |
| 字体一号 `#333333` | `--foreground` 及各 `--*-foreground`                                          | `oklch(0.321 0 0)`              |
| 字体二号 `#666666` | `--muted-foreground`                                                          | `oklch(0.51 0 0)`               |
| 字体五号 `#3AD75C` | `--success` / `--chart-3`                                                     | `oklch(0.7735 0.2095 146.6446)` |
| 字体六号 `#FE660A` | `--warning` / `--chart-4`                                                     | `oklch(0.6945 0.2026 43.1038)`  |
| 字体七号 `#FD2237` | `--destructive` / `--chart-5`                                                 | `oklch(0.636 0.244 24.335)`     |
| 中性 BG `#F2F4F8`  | `--background`                                                                | `oklch(0.967 0.006 264.532)`    |
| 中性模块 `#F5F5F5` | `--card` / `--popover` / `--sidebar`                                          | `oklch(0.97 0 0)`               |
| 分割线 `#F0F0F0`   | `--secondary` / `--muted` / `--accent` / `--sidebar-accent`                   | `oklch(0.955 0 0)`              |
| 中性描边 `#D9D9D9` | `--border` / `--input` / `--sidebar-border`                                   | `oklch(0.885 0 0)`              |

色值均由 sRGB→OKLab 换算脚本精确生成（保留 3 位小数），**不要手抄近似值**——尤其灰度：粗略的明度公式会把 `#666666` 算成 0.533、`#D9D9D9` 算成 0.926，实际为 0.510 / 0.885。

字体三号 `#999999` 已设两个 token 且**同值**：`--subtle-foreground` 与 `--info`（均为 `oklch(0.682 0 0)`；`--info` 的旧值 `#00B2F8` 已作废）；字体四号 `#DADADA`（`oklch(0.888 0 0)`，与描边 `#D9D9D9` 仅差 1，由 `--border` 覆盖）。

### 辅助色（60% / 20% 透明）用法

规范中每组辅助色的后两档**不建 token**——直接用 Tailwind v4 透明度修饰符（`color-mix` 运行时生效）：

```tsx
// 蓝组：默认 / 60% / 20%
<div className="bg-primary" />
<div className="bg-primary/60" />
<div className="bg-primary/20" />

// 其余各组同理
<span className="text-success" /> <span className="text-success/60" /> <span className="bg-success/20" />
<div className="bg-ink/60" />   {/* 遮罩 */}
<div className="bg-info/20" />
<div className="bg-warning/60" />
```

## Changesets

```bash
pnpm changeset          # 选择 bump 类型并写说明
pnpm version-packages   # 更新 package.json 与 CHANGELOG.md
pnpm release            # 发布到 npm（需先去掉 package.json 中的 private）
```

---

## cn 库迁移

本项目使用 [`cn`](https://www.npmjs.com/package/cn) 作为唯一的 Tailwind 类合并与冲突解析库，**取代** `clsx` + `tailwind-merge`。

- `cn` 提供与 `tailwind-merge` / `clsx` 完全兼容的 API（同一套 `cn()` 调用形态）
- 性能约为后两者的 **30 倍**
- `src/lib/utils.ts` 简化为：`export { cn } from "cn";`
- `registry/utils.json` 的 `dependencies` 仅声明 `"cn"`；用户安装 `@shadcn-ui-lib/<name>` 时 CLI 会自动 `pnpm add cn`
- 已通过官方迁移命令完成：`pnpm dlx shadcn@latest migrate cn`
- 不要再额外安装 `clsx` 或 `tailwind-merge`

---

## 发布为 Registry（供其他项目使用）

本项目以 GitHub 为分发源，其他项目可通过 `shadcn CLI` 直接安装本库的组件。

### 目录隔离机制

shadcn CLI 的 `aliases.ui` 是工作区级**单值**全局配置；所有未指定 `files[].target` 的 `registry:ui` 组件都会落到**同一个**目录。`shadcn registry add` 不会传染本仓库的 `aliases` 到用户项目。

因此，本仓库在每个 `registry/*.json` 的 `files[]` 中**显式声明** `target` 字段，让组件安装到与默认 shadcn 不同的子目录。

| Registry 命名空间 | `files[].target`               | 用户项目实际路径                                                                           |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `@shadcn`（默认） | （省略，由 `aliases.ui` 决定） | `<aliases.ui>/button.tsx`，例如 `src/components/ui/button.tsx`                             |
| `@shadcn-ui-lib`  | `@ui/shadcn-ui-lib/button.tsx` | `<aliases.ui>/shadcn-ui-lib/button.tsx`，例如 `src/components/ui/shadcn-ui-lib/button.tsx` |

两套同名组件始终在不同的子目录，**永不覆盖**。

### 用户接入方式

在用户项目中添加本 registry：

```bash
shadcn registry add @shadcn-ui-lib=https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json
```

这会在用户项目的 `components.json` 中追加（不覆盖用户现有的 `aliases`）：

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/styles/{style}/{name}.json",
    "@shadcn-ui-lib": "https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json"
  }
}
```

然后安装组件：

```bash
# 从默认 shadcn 安装 → <aliases.ui>/button.tsx
shadcn add button

# 从本 registry 安装 → <aliases.ui>/shadcn-ui-lib/button.tsx
shadcn add @shadcn-ui-lib/button

# 安装带依赖的组件（例如 dialog 依赖 button）
shadcn add @shadcn-ui-lib/dialog
# CLI 会自动：
#   - 拉 dialog.json + button.json + utils.json + theme.json（registryDependencies）
#   - 安装 npm 依赖：radix-ui、lucide-react、cn、class-variance-authority、tw-animate-css
#   - 写入 <aliases.ui>/shadcn-ui-lib/{button,dialog}.tsx + <aliases.lib>/utils.ts
#   - 把色彩 token upsert 到用户项目的 CSS（:root + @theme inline）
```

导入方式：

```tsx
// 默认 shadcn
import { Button } from '@/components/ui/button';

// 本库
import { Button } from '@/components/ui/shadcn-ui-lib/button';
```

### 色彩 token 自动下发

组件装下去只是"源码到位"，设计规范要生效还得把 `src/global.css` 里的 token 写进用户项目。本仓库把 token 做成了 `registry:theme` 项，**每个 UI 组件的 `registryDependencies` 都带 `theme.json`，所以装任意组件都会自动 upsert token**。

```bash
# 也可以单独装 / 单独更新 token
shadcn add @shadcn-ui-lib/theme
```

CLI 会按 Tailwind v4 管线写入 `components.json` 里 `tailwind.css` 指向的 CSS 文件：

- `cssVars.light` → 写进 `:root`（37 个变量，来自 `src/global.css` 的 `:root`）
- `css["@theme inline"]` → 逐字写进 `@theme inline`（`--color-*` 映射 + `--radius-*`，40 项）
- `css["@custom-variant dark"]` → `(&:is(.dark *))`

其余两个 theme 相关项：

| item             | 作用                                                                       | 是否随组件自动安装 |
| ---------------- | -------------------------------------------------------------------------- | ------------------ |
| `theme`          | 亮色 token（`:root` + `@theme inline`），`devDependencies: tw-animate-css` | 是                 |
| `theme-dark`     | 中性暗色基线（`.dark`），**会覆盖用户已有的暗色变量**，故需显式安装        | 否                 |
| `theme-provider` | `next-themes` 包装，落到 `<aliases.components>/theme/theme-provider.tsx`   | 否                 |

暗色切换：

```bash
shadcn add @shadcn-ui-lib/theme-provider
# 需要中性暗色基线再执行：shadcn add @shadcn-ui-lib/theme-dark
```

```tsx
import { ThemeProvider } from '@/components/theme/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>;
```

注意事项：

- **要求用户项目是 Tailwind v4**——v3 项目不会写 `@theme`，token 不生效。
- `registry:theme` 的 `overwriteCssVars` 为 `true`，安装会**覆盖用户 `:root` 中同名变量**（这正是"自动生效"的开关）。
- 验收：构建产物里能搜到 `.bg-primary`，且 `--primary` 解析为 `oklch(0.639 0.149 247.984)`（#3091E1）。

### Registry JSON 结构

`registry/` 目录下每个组件对应一个 JSON 文件，由 `scripts/generate-registry.cjs` 从源码自动生成。每个 item 包含：

- `name` / `type: "registry:ui"` / `files[].content` — 组件源码（CLI 直接写入文件）
- `files[].target` — 用户项目中的目标路径（用 `@ui/` 占位符解析到 `aliases.ui`）
- `dependencies` — 由脚本从源码扫描裸 import 提取的 npm 包（react/react-dom 排除）
- `registryDependencies` — 同 registry 内跨组件依赖。**一律写成绝对 URL**（如 `dialog` → `.../button.json`、`.../utils.json`、`.../theme.json`）；裸名 `"button"` 会被 CLI 解析成官方 `@shadcn` 的同名组件
- `devDependencies` — 用到 `animate-in` / `animate-out` 的组件自动带上 `tw-animate-css`

### Registry JSON 生成与同步

组件源码更新后：

```bash
node scripts/generate-registry.cjs
```

GitHub Actions CI（`.github/workflows/regen-registry.yml`）会在 push / PR 时跑同一脚本，若 `registry/` 与源码不一致则 fail。

### 生产环境 Registry 托管

GitHub Raw CDN 访问可能不稳定，推荐使用 Vercel / Cloudflare Pages 托管 `registry/` 目录（零成本、自动 HTTPS）。部署后将 `components.json` 中的 registry URL 替换为你的托管地址即可。

## 已知约束

- 包当前为 `private: true`，`pnpm release` 会拒绝发包；正式发包前改回 `false` 并配置 `files` 字段。
- 通过 `pnpm dlx shadcn@latest migrate cn` 已迁移到 [cn](https://www.npmjs.com/package/cn) 库（取代 `clsx` + `tailwind-merge`；API 兼容、性能 30×）；`src/lib/utils.ts` 现仅 `export { cn } from "cn";`。详见下方「cn 库迁移」。
- Registry JSON 由脚本从源码自动生成；修改组件后必须跑 `node scripts/generate-registry.cjs`（CI 也会校验）。
