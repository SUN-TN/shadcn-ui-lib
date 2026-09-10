# shadcn-ui-lib 组件库实现计划

> 计划锁定日期：2026-09-09
> 本文件由 ZCode 生成，仅包含规划内容；不执行任何安装/构建/初始化操作。

---

## 一、目标与技术决策

| 维度 | 选型 |
|---|---|
| 构建框架 | Vite 8 + React 19 + `@vitejs/plugin-react` v6+（底层已切到 OXC） |
| 语言 | TypeScript v7（pre-release，启用 `erasableSyntaxOnly`） |
| 样式 | Tailwind CSS v4（CSS-first，通过 `@tailwindcss/vite` 插件，无 `tailwind.config.ts`） |
| UI 基础 | shadcn/ui（CLI 一次性脚本，按需 `pnpm dlx shadcn@latest add ...`） |
| 主题 | `next-themes`（`attribute="class"`，light/dark/system）+ CSS 变量 |
| 图标 | `lucide-react` |
| 通知 | `sonner` |
| 演示方案 | **Storybook v9+（`@storybook/react-vite`）**—— 行业事实标准 |
| 工程化 | ESLint 9 flat config + Prettier 3 + `prettier-plugin-tailwindcss` + Husky + lint-staged |
| 包管理 | pnpm 11.x，`engines.node >= 22` |
| 版本管理 | `@changesets/cli` |
| 路径别名 | `@/*` → `src/*`（vite / tsconfig / storybook 三端对齐） |
| 首期组件 | Button、Input、Card、Dialog、Sheet、Dropdown-menu、Tabs、Toast(Sonner)、Select、Avatar |
| 目标形态 | 组件库 + Storybook 演示站 + Changesets 工作流（可演进到 npm 发包） |

> 与早期版本的差异：移除 `react-router`、移除自建演示站多页路由、移除 `@vitejs/plugin-react-swc` 与不存在的内置 `react-oxc`；统一以 `@vitejs/plugin-react` v6+（OXC 底层）作为唯一 React 插件。

---

## 二、关键事实校对

- `import react from '@vitejs/plugin-react'`（v6+ 底层 OXC，无需 babel 配置）
- 不存在 `import { react } from 'vite'` 这种 Vite 内置 API
- 不存在 `vite:react-oxc` / `@vitejs/plugin-react-oxc` / `@vitejs/plugin-react-swc` 这些变体（除同名 SWC 版可选外）
- `shadcn` CLI 不是运行时依赖，开发期按需 `pnpm dlx shadcn@latest ...` 调用
- `next-themes` 通过 `attribute="class"` 与 Tailwind v4 的 `@custom-variant dark (&:is(.dark *))` 配套

---

## 三、`shadcn` CLI 在本项目里的作用

本质上是「开发期一次性脚本工具」，不会进入运行时，不写入 devDeps：

1. **初始化项目配置**：`pnpm dlx shadcn@latest init` 生成 `components.json`，并把 Tailwind 主题变量写入 `src/index.css`、生成 `src/lib/utils.ts` 的 `cn()` 函数
2. **复制组件源码**：`pnpm dlx shadcn@latest add <name>` 把 `button.tsx` 等源码直接写到 `src/components/ui/` 下，并自动安装该组件依赖的 Radix 子包等
3. **后续增量添加**：随时 `add` 新组件（Tooltip、Popover、Calendar 等）

> 这与传统 UI 库最大的区别：组件源码在你仓库里，可自由改；不需要等发版升级。

---

## 四、目录结构

```
shadcn-ui-lib/
├── .changeset/
│   └── config.json
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── .storybook/
│   ├── main.ts                       # stories 匹配规则、addons、framework: @storybook/react-vite
│   └── preview.tsx                   # 全局装饰器：ThemeProvider、Sonner、addon-themes
├── .vscode/
├── public/
├── src/
│   ├── index.css                     # Tailwind v4 入口 + 主题 CSS 变量
│   ├── vite-env.d.ts
│   ├── lib/
│   │   └── utils.ts                  # cn() 等
│   ├── components/
│   │   ├── ui/                       # shadcn 组件目录（10 件套）
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── sonner.tsx
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx    # 包装 next-themes
│   │   │   └── theme-decorator.tsx   # Storybook DecoratorFn
│   │   └── stories/                  # 每个组件一份 stories 文件
│   │       ├── button.stories.tsx
│   │       ├── input.stories.tsx
│   │       ├── card.stories.tsx
│   │       ├── dialog.stories.tsx
│   │       ├── sheet.stories.tsx
│   │       ├── dropdown-menu.stories.tsx
│   │       ├── tabs.stories.tsx
│   │       ├── toast.stories.tsx
│   │       ├── select.stories.tsx
│   │       └── avatar.stories.tsx
│   ├── App.tsx                       # 仅 ThemeProvider + Sonner（备用）
│   └── main.tsx                      # 最小入口
├── .gitignore
├── .npmrc
├── .prettierrc.js
├── .prettierignore
├── .lintstagedrc.json
├── eslint.config.js
├── components.json                   # shadcn 配置（由 init 生成）
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js                 # 兜底（v4 主要走 vite 插件）
├── README.md
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts                    # Storybook 走自己的 vite 配置；本文件用于未来独立打包
```

---

## 五、关键文件设计要点

### 5.1 `vite.config.ts`

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5173, strictPort: false },
});
```

### 5.2 `tsconfig.app.json`（TS 7 + erasableSyntaxOnly）

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

### 5.3 `tsconfig.node.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", ".storybook/**/*"]
}
```

### 5.4 `tsconfig.json`（仅做引用）

```jsonc
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### 5.5 `src/index.css`（Tailwind v4 CSS-first）

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    border-color: var(--border);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
```

### 5.6 `.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  typescript: { check: false },
  docs: { autodocs: 'tag' },
};

export default config;
```

### 5.7 `.storybook/preview.tsx`

```tsx
import type { Preview } from '@storybook/react';
import '../src/index.css';
import { ThemeProvider } from '../src/components/theme/theme-provider';
import { Toaster } from '../src/components/ui/sonner';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background text-foreground p-6">
          <Story />
          <Toaster richColors position="top-right" />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: { disable: true },
    themes: { themeOverride: 'system' },
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
  },
};

export default preview;
```

### 5.8 Story 文件示例 `src/components/stories/button.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../ui/button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    asChild: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { children: 'Primary Button' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };
export const Loading: Story = { args: { disabled: true, children: 'Loading…' } };
```

### 5.9 `src/components/theme/theme-provider.tsx`

```tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

### 5.10 `src/components/ui/sonner.tsx`

```tsx
import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = (props: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  return <Sonner theme={theme as 'light' | 'dark' | 'system'} richColors {...props} />;
};
```

### 5.11 `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 5.12 `eslint.config.js`

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  prettier,
);
```

### 5.13 `.prettierrc.js`

```js
export default {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/index.css',
};
```

### 5.14 `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.css": ["prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### 5.15 Changesets

- `.changeset/config.json`：
  ```json
  {
    "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
    "changelog": "@changesets/cli/changelog",
    "commit": false,
    "baseBranch": "main",
    "updateInternalDependencies": "patch"
  }
  ```
- 首个 changeset：`.changeset/initial.md`
  ```md
  ---
  "@shadcn-ui-lib/core": minor
  ---

  feat: initial component library with 10 base components and Storybook demo
  ```

---

## 六、`package.json`

```jsonc
{
  "name": "shadcn-ui-lib",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.0.0" },
  "packageManager": "pnpm@11.10.0",
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "tsc -b && vite build",
    "build-storybook": "storybook build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc -b --noEmit",
    "prepare": "husky || true",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "changeset publish"
  }
}
```

**dependencies**

- `react@^19`、`react-dom@^19`
- `tailwindcss@^4`、`@tailwindcss/vite@^4`、`tw-animate-css`
- `class-variance-authority`、`clsx`、`tailwind-merge`
- `lucide-react`、`sonner`、`next-themes`
- Radix 各组件所需包（由 `pnpm dlx shadcn@latest add` 自动安装）
- `@fontsource-variable/geist`（可选）

**devDependencies**

- `typescript@~7.0.x`、`@types/react@^19`、`@types/react-dom@^19`、`@types/node@^22`
- `vite@^8`、`@vitejs/plugin-react@^6`
- `storybook@^9`、`@storybook/react-vite@^9`、`@storybook/addon-essentials`、`@storybook/addon-a11y`、`@storybook/addon-themes`
- `eslint@^9`、`typescript-eslint@^8.18`、`eslint-plugin-react-hooks`、`eslint-plugin-react-refresh`、`eslint-config-prettier`
- `prettier@^3`、`prettier-plugin-tailwindcss`
- `husky`、`lint-staged`
- `@changesets/cli`

> 不安装 `react-router`、`@vitejs/plugin-react-swc`、`@vitejs/plugin-react-oxc` 等。
> 不在 devDeps 中写 `shadcn`（仅通过 `pnpm dlx shadcn@latest ...` 临时调用）。

---

## 七、实施步骤（按顺序执行）

1. **初始化包与脚本**
   - `pnpm init` → 改写 `package.json`
   - 创建 `.gitignore`、`.npmrc`
2. **安装运行时依赖**
   - `pnpm add react react-dom next-themes sonner lucide-react class-variance-authority clsx tailwind-merge`
   - 后续由 shadcn CLI 自动追加 Radix 子包
3. **安装开发依赖（含 Storybook）**
   - `pnpm add -D vite @vitejs/plugin-react typescript@~7.0.x @types/react @types/react-dom @types/node tailwindcss @tailwindcss/vite tw-animate-css storybook@^9 @storybook/react-vite@^9 @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-themes eslint typescript-eslint@^8.18 eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-config-prettier prettier prettier-plugin-tailwindcss husky lint-staged @changesets/cli`
4. **配置文件**
   - `vite.config.ts`、`tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`
   - `eslint.config.js`、`.prettierrc.js`、`.prettierignore`、`.lintstagedrc.json`
   - `.storybook/main.ts`、`.storybook/preview.tsx`
   - `index.html`、`src/vite-env.d.ts`、`src/main.tsx`
5. **Tailwind v4 与主题**
   - `src/index.css`（见 5.5）
6. **shadcn 初始化与拉组件**
   - `pnpm dlx shadcn@latest init`（生成 `components.json`、写入 `index.css`、生成 `src/lib/utils.ts`）
   - `pnpm dlx shadcn@latest add button input card dialog sheet dropdown-menu tabs select avatar sonner`
   - 若生成组件含 `enum` / `namespace`，按 TS 7 `erasableSyntaxOnly` 改写
7. **Storybook 集成**
   - `src/components/theme/theme-provider.tsx`
   - `.storybook/preview.tsx` 注入 ThemeProvider + Toaster
   - 10 个 `*.stories.tsx`（每个组件 3~5 个用例）
8. **工程化收尾**
   - `pnpm exec husky init` → 配置 `.husky/pre-commit`
   - Changesets 初始化 + 首个 changeset
   - 跑通 `pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm build-storybook`
9. **README.md**
   - 项目简介、技术栈、运行命令（`pnpm dev` 启动 Storybook 6006）、添加组件命令、暗色模式说明、Changesets 工作流

---

## 八、验收标准

- [ ] `pnpm install` 无错误
- [ ] `pnpm typecheck` 通过（TS 7 + `erasableSyntaxOnly`，0 error）
- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 成功
- [ ] `pnpm dev` 启动 Storybook 6006 端口，左侧导航列出 10 个组件
- [ ] 顶栏主题切换器（addon-themes）可切换 light / dark
- [ ] addon-a11y 对每个组件给出可访问性报告
- [ ] 10 个组件 stories 均可正常交互（Dialog/Sheet/Dropdown/Tabs/Select 打开关闭、Toast 触发）
- [ ] `pnpm build-storybook` 产出 `storybook-static/`
- [ ] `pnpm changeset` 能创建 changeset
- [ ] README.md 含完整使用说明
- [ ] `package.json` 中：仅 `@vitejs/plugin-react@^6`、无 `react-router`、无 `*-swc` / `*-oxc` 同名变体、无 `shadcn` 依赖

---

## 九、风险与约束

1. **TypeScript v7 pre-release**：启用 `erasableSyntaxOnly`，遇到 `enum` / `namespace` 必须改写为对象字面量或 `as const`
2. **typescript-eslint 必须 ≥ 8.18**：旧版无法读取 TS 7 类型信息
3. **`@types/node` 版本对齐 TS 7 推荐版本（^22 系列）**
4. **Storybook v9 + React 19 + Vite 8 兼容性**：均为当前生态最新主线；如未来 addon 出现兼容问题，临时降回 Storybook 8 + `@vitejs/plugin-react` v5 是稳妥的回退路径
5. **shadcn 风格**：统一采用稳定的 `new-york` 风格，避免实验性 `radix-nova`
6. **路径别名落地**：`vite.config.ts`、`.storybook/main.ts`（通过 vite 配置）、`tsconfig.app.json` 三端必须对齐
7. **PostCSS**：Tailwind v4 已不再必需；保留 `postcss.config.js` 仅作为兜底（内容可为 `{}`）
8. **包私有阶段**：`"private": true` 期间 `pnpm release` 会拒绝发包；待成熟后改回 `false` 并配 `"files"`
9. **不写入 devDeps 的 `shadcn` CLI**：仅通过 `pnpm dlx shadcn@latest ...` 临时调用，不污染依赖树
