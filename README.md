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
│   └── ui/                   # shadcn-ui-lib 组件（10 件套）
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── components/
│   ├── theme/                # next-themes 包装
│   └── stories/             # 每个组件的 Storybook story
├── lib/
│   └── utils.ts             # cn() 等
├── App.tsx
├── main.tsx
└── index.css               # Tailwind v4 入口 + 主题变量
registry/                     # Registry JSON（发布源）
.storybook/                  # Storybook 配置
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

## 添加新组件

```bash
pnpm dlx shadcn@latest add <component-name>
```

shadcn CLI 会把组件源码写到 `src/shadcn-ui-lib/ui/<name>.tsx`，并自动安装依赖。导入路径已统一为 `@/lib/utils`。

随后在 `src/shadcn-ui-lib/stories/` 下新建 `<name>.stories.tsx`。

## 主题

主题由 `next-themes` 管理（`attribute="class"`，`defaultTheme="system"`），与 Tailwind v4 的 `@custom-variant dark (&:is(.dark *))` 配合。

在 Storybook 中可使用顶部 **Themes** 工具栏切换 light / dark。

## Changesets

```bash
pnpm changeset          # 选择 bump 类型并写说明
pnpm version-packages # 更新 package.json 与 CHANGELOG.md
pnpm release          # 发布到 npm（需先去掉 package.json 中的 private）
```

---

## 发布为 Registry（供其他项目使用）

### 目录隔离策略

| Registry 命名空间 | `aliases.ui` | 实际安装目录 |
|---|---|---|
| `@shadcn`（默认） | `@/components/ui` | `src/components/ui/` |
| `@shadcn-ui-lib` | `@/shadcn-ui-lib/ui` | `src/shadcn-ui-lib/ui/` |

两套组件完全共存，互不覆盖。

### Registry JSON

`registry/` 目录下每个组件对应一个 JSON 文件（由 `scripts/generate-registry.js` 从源码自动生成），符合 shadcn/ui registry-item 规范。

### 用户接入方式

在用户项目中添加本 registry：

```bash
shadcn registry add @shadcn-ui-lib=https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json
```

这会在用户项目的 `components.json` 中写入：

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
# 从默认 shadcn 安装 → src/components/ui/button.tsx
shadcn add button

# 从本 registry 安装 → src/shadcn-ui-lib/ui/button.tsx
shadcn add @shadcn-ui-lib/button
```

导入方式：

```tsx
// 默认 shadcn
import { Button } from '@/components/ui/button';

// 本库
import { Button } from '@/shadcn-ui-lib/ui/button';
```

### Registry JSON 生成脚本

当组件源码更新后，需重新生成 `registry/*.json`：

```bash
node scripts/generate-registry.js
```

### 生产环境 Registry 托管

GitHub Raw CDN 访问可能不稳定，推荐使用 Vercel / Cloudflare Pages 托管 `registry/` 目录（零成本、自动 HTTPS）。部署后将 `components.json` 中的 registry URL 替换为你的托管地址即可。

## 已知约束

- shadcn CLI 默认装的 `cn` 包已替换为 `@/lib/utils`，并 `pnpm remove cn`。
- 包当前为 `private: true`，`pnpm release` 会拒绝发包；正式发包前改回 `false` 并配置 `files` 字段。
- Registry JSON 需随组件源码同步维护；使用 `scripts/generate-registry.js` 自动生成。
