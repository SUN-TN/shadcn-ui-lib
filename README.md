# shadcn-ui-lib

基于 **React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + shadcn/ui + Storybook 10** 的组件库脚手架。

## 技术栈

- **构建**: Vite 8 + `@vitejs/plugin-react` v6（底层 OXC）
- **语言**: TypeScript 6（`strict + verbatimModuleSyntax + noUncheckedIndexedAccess`）
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
│   └── utils.ts             # cn() 工具
├── App.tsx
├── main.tsx
└── index.css               # Tailwind v4 入口 + 主题变量
registry/                    # Registry JSON（发布源）
.storybook/                 # Storybook 配置
.github/workflows/          # CI
scripts/                    # registry 生成脚本
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Storybook（http://localhost:6006） |
| `pnpm build-storybook` | 构建 Storybook 静态站点到 `storybook-static/` |
| `pnpm build` | TypeScript 检查 + Vite 生产构建 |
| `pnpm typecheck` | 仅类型检查 |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm format` | Prettier 全量格式化 |
| `pnpm changeset` | 新建 changeset |
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

## Changesets

```bash
pnpm changeset          # 选择 bump 类型并写说明
pnpm version-packages   # 更新 package.json 与 CHANGELOG.md
pnpm release            # 发布到 npm（需先去掉 package.json 中的 private）
```

---

## 发布为 Registry（供其他项目使用）

本项目以 GitHub 为分发源，其他项目可通过 `shadcn CLI` 直接安装本库的组件。

### 目录隔离机制

shadcn CLI 的 `aliases.ui` 是工作区级**单值**全局配置；所有未指定 `files[].target` 的 `registry:ui` 组件都会落到**同一个**目录。`shadcn registry add` 不会传染本仓库的 `aliases` 到用户项目。

因此，本仓库在每个 `registry/*.json` 的 `files[]` 中**显式声明** `target` 字段，让组件安装到与默认 shadcn 不同的子目录。

| Registry 命名空间 | `files[].target` | 用户项目实际路径 |
|---|---|---|
| `@shadcn`（默认） | （省略，由 `aliases.ui` 决定） | `<aliases.ui>/button.tsx`，例如 `src/components/ui/button.tsx` |
| `@shadcn-ui-lib` | `@ui/shadcn-ui-lib/button.tsx` | `<aliases.ui>/shadcn-ui-lib/button.tsx`，例如 `src/components/ui/shadcn-ui-lib/button.tsx` |

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
#   - 拉 dialog.json + button.json（registryDependencies）
#   - 拉 utils.json（registryDependencies）
#   - 安装 npm 依赖：radix-ui、lucide-react、clsx、tailwind-merge、class-variance-authority
#   - 写入 <aliases.ui>/shadcn-ui-lib/{button,dialog}.tsx + <aliases.lib>/utils.ts
```

导入方式：

```tsx
// 默认 shadcn
import { Button } from '@/components/ui/button';

// 本库
import { Button } from '@/components/ui/shadcn-ui-lib/button';
```

### Registry JSON 结构

`registry/` 目录下每个组件对应一个 JSON 文件，由 `scripts/generate-registry.cjs` 从源码自动生成。每个 item 包含：

- `name` / `type: "registry:ui"` / `files[].content` — 组件源码（CLI 直接写入文件）
- `files[].target` — 用户项目中的目标路径（用 `@ui/` 占位符解析到 `aliases.ui`）
- `dependencies` — 由脚本从源码扫描裸 import 提取的 npm 包（react/react-dom 排除）
- `registryDependencies` — 同 registry 内跨组件依赖（如 `dialog` → `["button", "utils"]`）

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
- shadcn CLI 默认装的 `cn` 包已替换为 `@/lib/utils`，并 `pnpm remove cn`。
- Registry JSON 由脚本从源码自动生成；修改组件后必须跑 `node scripts/generate-registry.cjs`（CI 也会校验）。