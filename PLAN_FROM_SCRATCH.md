# shadcn-ui-lib — 从 0 开始搭建完整计划

> 基于当前项目实际状态（截至 2026-09-10）整理出一份「在空白目录重建同等结构」的可执行计划。所有版本号、文件路径、配置内容均与现仓库实际一致。

---

## 一、项目定位

**对外发布的 shadcn registry 源**——以 GitHub 为分发通道，其他项目通过 `shadcn@latest add @shadcn-ui-lib/<name>` 把本仓库组件安装到下游项目。**不是普通前端应用，是组件库 + registry 分发端**。

### 核心特征

- 组件源码写在 `src/shadcn-ui-lib/ui/`，**每个组件的 files[].target 显式声明**安装到用户项目的 `<aliases.ui>/shadcn-ui-lib/`，与默认 `@shadcn` 组件**永不覆盖**
- `lib/utils` 作为 `registry:lib` 项发布，随 UI 组件自动安装
- Storybook 作为组件演示与可视化验收工具（**演示站是开发者自己看的，不是给最终用户**）

---

## 二、目标技术栈（与 package.json 锁定的实际版本完全一致）

| 维度     | 选型                                                                              | 锁定版本                                                        |
| -------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 构建框架 | Vite + `@vitejs/plugin-react` v6+（**底层 OXC**，不是 SWC、不是 Babel）           | `vite ^8.2.2`、`@vitejs/plugin-react ^6.1.1`                    |
| 语言     | **TypeScript v6（不升 v7）**                                                      | `typescript ^6.0.3`                                             |
| 样式     | Tailwind v4（CSS-first，通过 `@tailwindcss/vite`，**无 `tailwind.config`**）      | `tailwindcss ^4.3.3`、`@tailwindcss/vite ^4.3.3`                |
| UI 基础  | shadcn/ui CLI v4.7+（统一 `radix-ui` 包，**非** `@radix-ui/react-*`）             | `radix-ui ^1.6.7`                                               |
| 演示     | Storybook 10（**仅** `addon-a11y` + `addon-themes`，**不装** `addon-essentials`） | `storybook ^10.6.0`                                             |
| 主题     | `next-themes` + CSS 变量                                                          | `next-themes ^0.4.6`                                            |
| 图标     | `lucide-react`                                                                    | `lucide-react ^1.43.0`                                          |
| 通知     | `sonner`                                                                          | `sonner ^2.0.8`                                                 |
| 工具     | `cn()` via `clsx` + `tailwind-merge`；动效用 `tw-animate-css`                     | `clsx ^2.1.1`、`tailwind-merge ^3.6.0`、`tw-animate-css ^1.4.0` |
| 工程化   | ESLint 9 flat + Prettier 3 + Husky + lint-staged                                  | 同 package.json                                                 |
| 版本管理 | `@changesets/cli`                                                                 | `^3.0.2`                                                        |
| 包管理   | pnpm                                                                              | `pnpm@11.10.0`、`engines.node >=22`                             |

---

## 三、目录结构（从 0 创建的全部内容）

```
shadcn-ui-lib/
├── .changeset/
│   ├── config.json
│   └── initial.md
├── .github/
│   └── workflows/
│       └── regen-registry.yml
├── .husky/
│   └── pre-commit
├── .storybook/
│   ├── main.ts
│   ├── preview.tsx
│   └── css.d.ts
├── .gitignore
├── .npmrc
├── .prettierignore
├── .lintstagedrc.json
├── AGENTS.md
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── pnpm-lock.yaml                    # pnpm install 自动生成
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── global.css
│   ├── vite-env.d.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── components/
│   │   └── theme/
│   │       └── theme-provider.tsx
│   └── shadcn-ui-lib/
│       └── ui/
│           ├── avatar.tsx
│           ├── button.tsx
│           ├── card.tsx
│           ├── dialog.tsx
│           ├── dropdown-menu.tsx
│           ├── input.tsx
│           ├── select.tsx
│           ├── sheet.tsx
│           ├── sonner.tsx
│           ├── tabs.tsx
│           └── stories/
│               ├── avatar.stories.tsx
│               ├── button.stories.tsx
│               ├── card.stories.tsx
│               ├── dialog.stories.tsx
│               ├── dropdown-menu.stories.tsx
│               ├── input.stories.tsx
│               ├── select.stories.tsx
│               ├── sheet.stories.tsx
│               ├── tabs.stories.tsx
│               └── toast.stories.tsx
├── registry/                          # 由脚本生成，不手写
│   ├── index.json
│   ├── utils.json
│   ├── button.json
│   ├── input.json
│   ├── card.json
│   ├── dialog.json
│   ├── sheet.json
│   ├── dropdown-menu.json
│   ├── tabs.json
│   ├── select.json
│   ├── avatar.json
│   └── sonner.json
└── scripts/
    └── generate-registry.cjs
```

> 注意：`src/components/ui/` 不存在（已废弃）；组件全部在 `src/shadcn-ui-lib/ui/`。

---

## 四、配置文件清单（含关键内容）

### 4.1 `package.json`

完整内容（含全部 scripts 与依赖）。参考第二节版本号表与 PLAN.md 已有内容。

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
    "prepare": "husky",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "changeset publish",
  },
}
```

dependencies 与 devDependencies 完整列表见第二节。

### 4.2 `.gitignore`

```
node_modules
dist
dist-ssr
storybook-static
*.local

.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.zcode
.codebuddy

logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

build
coverage
*.tsbuildinfo
```

### 4.3 `.npmrc`

```
engine-strict=false
shamefully-hoist=false
strict-peer-dependencies=false
```

### 4.4 `tsconfig.json`（仅引用）

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 4.5 `tsconfig.app.json`

关键 compilerOptions：

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
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "useDefineForClassFields": true,
    "noEmit": true,
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "paths": { "@/*": ["./src/*"] },
  },
  "include": ["src", ".storybook/**/*"],
}
```

### 4.6 `tsconfig.node.json`

仅含 `vite.config.ts`，配置：

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
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true,
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "types": ["node"],
  },
  "include": ["vite.config.ts"],
}
```

### 4.7 `vite.config.ts`

```ts
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const r = (p: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), p);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': r('./src') },
  },
  server: { port: 5173, strictPort: false },
});
```

### 4.8 `eslint.config.js`

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'node_modules', '.storybook/**/*'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { window: 'readonly', document: 'readonly' },
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

### 4.9 `.prettierrc.js`

```js
export default {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/global.css',
};
```

### 4.10 `.prettierignore`

```
node_modules
dist
dist-ssr
storybook-static
build
coverage
pnpm-lock.yaml
```

### 4.11 `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.css": ["prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### 4.12 `postcss.config.js`

```js
// Tailwind v4 主要通过 @tailwindcss/vite 插件工作；保留此文件作为兜底。
export default {};
```

### 4.13 `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/global.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/shadcn-ui-lib/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide",
  "registries": {
    "@shadcn-ui-lib": "https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json"
  }
}
```

### 4.14 `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>shadcn-ui-lib</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 4.15 `.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const r = (p: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), p);

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  typescript: { check: false },
  viteFinal: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: { ...config.resolve?.alias, '@': r('../src') },
    };
    return config;
  },
};

export default config;
```

### 4.16 `.storybook/preview.tsx`

```tsx
import type { Preview } from '@storybook/react';
import '../src/global.css';
import { ThemeProvider } from '../src/components/theme/theme-provider';
import { Toaster } from '../src/shadcn-ui-lib/ui/sonner';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background p-6 text-foreground">
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

### 4.17 `.storybook/css.d.ts`

```ts
declare module '*.css';
```

---

## 五、源码文件清单

### 5.1 `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 5.2 `src/App.tsx`

```tsx
import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from './shadcn-ui-lib/ui/sonner';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="text-2xl font-semibold">shadcn-ui-lib</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run <code className="rounded bg-muted px-1 py-0.5">pnpm dev</code> to launch Storybook.
        </p>
      </main>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
```

### 5.3 `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

### 5.4 `src/global.css`（Tailwind v4 CSS-first + 33 个 OKLCH 变量）

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
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
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
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
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

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

### 5.5 `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 5.6 `src/components/theme/theme-provider.tsx`

```tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

### 5.7 10 个 shadcn 组件源码（`src/shadcn-ui-lib/ui/*.tsx`）

**不能手写**——通过 `pnpm dlx shadcn@latest add <name>` 拉取。

拉取后必须做两处修正：

1. `sed 's|from "cn"|from "@/lib/utils"|g' src/shadcn-ui-lib/ui/*.tsx`
2. `pnpm remove cn`

10 个组件：button、input、card、dialog、sheet、dropdown-menu、tabs、select、avatar、sonner。

### 5.8 10 个 Storybook stories（`src/shadcn-ui-lib/ui/stories/*.stories.tsx`）

手写，参考 PLAN.md 第 5.8 节。每个 stories 文件模板：

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '../<name>';

const meta = {
  title: 'Components/<Name>',
  component: ComponentName,
  tags: ['autodocs'],
  // ...argTypes
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {/*...*/} };
// ... 2-8 个 variants
```

文件名约定：

- `sonner.tsx` → `toast.stories.tsx`（title 为 `Components/Toast`）
- 其他 9 个组件 → `<name>.stories.tsx`

### 5.9 `src/shadcn-ui-lib/ui/sonner.tsx`（**特殊修正**）

shadcn CLI 默认生成的 sonner 用 `as React.CSSProperties`——`verbatimModuleSyntax: true` 下报类型错误。**必须**改成：

```tsx
import type { CSSProperties } from 'react';
// ...
style={ { /* ... */ } as CSSProperties }
```

`registry/sonner.json` 也需重新生成（CI 会拦截 drift）。

---

## 六、Registry JSON 生成脚本

### 6.1 `scripts/generate-registry.cjs`

完整内容约 200 行。逻辑概要：

- 读取 `src/shadcn-ui-lib/ui/*.tsx` 与 `src/lib/utils.ts`
- 自动提取 npm 依赖（排除 react/react-dom）
- 自动构建 `registryDependencies`（同 registry 内跨组件 + 强制追加 `"utils"`）
- 写入 11 个 `registry/<name>.json`（type=`registry:ui`，`files[].target = "@ui/shadcn-ui-lib/<name>.tsx"`）
- 写入 `registry/utils.json`（type=`registry:lib`，`files[].target = "@lib/utils.ts"`，deps=`clsx,tailwind-merge`）
- 写入 `registry/index.json`（汇总 11 项）

完整脚本内容见仓库 [scripts/generate-registry.cjs](./scripts/generate-registry.cjs)。

### 6.2 生成的 registry 文件清单（**不要手写**）

| 文件                          | type           | target                                | dependencies                            | registryDependencies |
| ----------------------------- | -------------- | ------------------------------------- | --------------------------------------- | -------------------- |
| `registry/utils.json`         | `registry:lib` | `@lib/utils.ts`                       | `clsx`, `tailwind-merge`                | —                    |
| `registry/button.json`        | `registry:ui`  | `@ui/shadcn-ui-lib/button.tsx`        | `class-variance-authority`, `radix-ui`  | `[utils]`            |
| `registry/input.json`         | `registry:ui`  | `@ui/shadcn-ui-lib/input.tsx`         | —                                       | `[utils]`            |
| `registry/card.json`          | `registry:ui`  | `@ui/shadcn-ui-lib/card.tsx`          | —                                       | `[utils]`            |
| `registry/dialog.json`        | `registry:ui`  | `@ui/shadcn-ui-lib/dialog.tsx`        | `lucide-react`, `radix-ui`              | `[button, utils]`    |
| `registry/sheet.json`         | `registry:ui`  | `@ui/shadcn-ui-lib/sheet.tsx`         | `lucide-react`, `radix-ui`              | `[utils]`            |
| `registry/dropdown-menu.json` | `registry:ui`  | `@ui/shadcn-ui-lib/dropdown-menu.tsx` | `lucide-react`, `radix-ui`              | `[utils]`            |
| `registry/tabs.json`          | `registry:ui`  | `@ui/shadcn-ui-lib/tabs.tsx`          | `class-variance-authority`, `radix-ui`  | `[utils]`            |
| `registry/select.json`        | `registry:ui`  | `@ui/shadcn-ui-lib/select.tsx`        | `lucide-react`, `radix-ui`              | `[utils]`            |
| `registry/avatar.json`        | `registry:ui`  | `@ui/shadcn-ui-lib/avatar.tsx`        | `radix-ui`                              | `[utils]`            |
| `registry/sonner.json`        | `registry:ui`  | `@ui/shadcn-ui-lib/sonner.tsx`        | `lucide-react`, `next-themes`, `sonner` | `[utils]`            |
| `registry/index.json`         | —              | —                                     | —                                       | —（汇总索引）        |

---

## 七、CI / Hooks / Changesets

### 7.1 `.github/workflows/regen-registry.yml`

```yaml
name: Regen Registry

on:
  push:
    branches: [main]
    paths:
      - 'src/shadcn-ui-lib/ui/**'
      - 'src/lib/**'
      - 'scripts/generate-registry.cjs'
  pull_request:
    branches: [main]
    paths:
      - 'src/shadcn-ui-lib/ui/**'
      - 'src/lib/**'
      - 'scripts/generate-registry.cjs'

jobs:
  regen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: '24' }
      - name: Regenerate registry
        run: node scripts/generate-registry.cjs
      - name: Check for drift
        run: |
          if [ -n "$(git status --porcelain registry/)" ]; then
            echo "::error::registry/ is out of sync with src/. Run \`node scripts/generate-registry.cjs\` locally and commit the result."
            git diff --stat registry/
            exit 1
          fi
```

### 7.2 `.husky/pre-commit`

```
pnpm exec lint-staged
```

### 7.3 `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```

### 7.4 `.changeset/initial.md`

```
---
"shadcn-ui-lib": minor
---

feat: initial component library with 10 base components and Storybook demo
```

---

## 八、文档文件

### 8.1 `README.md`

章节结构（按顺序）：

1. `# shadcn-ui-lib`（项目简介：技术栈堆叠）
2. `## 技术栈`（10 项列表）
3. `## 目录结构`（ASCII 树）
4. `## 命令`（表格）
5. `## 添加新组件`（CLI + stories + generate-registry）
6. `## 主题`（next-themes + Themes 工具栏）
7. `## Changesets`（流程）
8. `## 发布为 Registry（供其他项目使用）`
   - `### 目录隔离机制`（target 字段真正起作用，**不是** aliases.ui）
   - `### 用户接入方式`
   - `### Registry JSON 结构`
   - `### Registry JSON 生成与同步`
   - `### 生产环境 Registry 托管`（Vercel/CF 建议）
9. `## 已知约束`

完整内容见仓库 [README.md](./README.md)。

### 8.2 `AGENTS.md`

给未来 ZCode agents 的工作须知。章节结构：

1. `# AGENTS.md — shadcn-ui-lib`
2. `## 项目定位`（**对外发布的 shadcn registry 源**；选型表含 TS `^6.0.3`）
3. `## 目录布局`（ASCII + 关键路径映射）
4. `## 命令`（表格）
5. `## 组件开发流程`（5 步）
6. `## Registry 维护红线（重要）`（5 条 CLI 路径解析机制）
7. `## CI 约束`（drift check）
8. `## TypeScript / lint 已知约束`
   - `### 为什么用 TypeScript v6 不升 v7`（typescript-eslint#10940）
   - `### 其他约束`（verbatimModuleSyntax、`.cjs`、不装 SWC/OXC、addon-essentials 不可用）
9. `## 不要做的事`（6 条 ❌ 列表）

完整内容见仓库 [AGENTS.md](./AGENTS.md)。

### 8.3 `PLAN.md`（**早期版本，可选保留**）

包含 TS 7 / `erasableSyntaxOnly` 等旧决策，**与现状已不一致**——可保留作历史记录，但 AGENTS.md 与 README.md 为权威依据。

---

## 九、实施步骤（从 0 完整搭建）

### 阶段 1：初始化包（5 min）

```bash
mkdir shadcn-ui-lib && cd shadcn-ui-lib
pnpm init
# 改写 package.json（含 scripts、engines、packageManager）
# 创建 .gitignore / .npmrc / .prettierrc.js / .prettierignore / .lintstagedrc.json / postcss.config.js
```

### 阶段 2：安装依赖（10 min）

```bash
# 运行时
pnpm add react@^19 react-dom@^19 next-themes sonner lucide-react \
  class-variance-authority clsx tailwind-merge tw-animate-css

# shadcn CLI 自动追加 radix-ui
# 开发
pnpm add -D vite@^8 @vitejs/plugin-react@^6 typescript@^6.0.3 \
  @types/react @types/react-dom @types/node \
  tailwindcss@^4 @tailwindcss/vite \
  storybook@^10 @storybook/react-vite@^10 \
  @storybook/addon-a11y @storybook/addon-themes \
  eslint@^9 typescript-eslint@^8.18 eslint-plugin-react-hooks \
  eslint-plugin-react-refresh eslint-config-prettier @eslint/js \
  prettier prettier-plugin-tailwindcss husky lint-staged @changesets/cli
```

### 阶段 3：配置文件（20 min）

按第四节创建：

- `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`
- `vite.config.ts`、`eslint.config.js`
- `index.html`、`components.json`
- `.storybook/main.ts`、`.storybook/preview.tsx`、`.storybook/css.d.ts`

### 阶段 4：源码骨架（15 min）

- `src/main.tsx`、`src/App.tsx`、`src/vite-env.d.ts`
- `src/global.css`（33 个 OKLCH 变量完整内容）
- `src/lib/utils.ts`
- `src/components/theme/theme-provider.tsx`

### 阶段 5：拉取并修正 shadcn 组件（30 min）

```bash
# 先建 components.json 后才能 add
pnpm dlx shadcn@latest init
# 批量 add（会覆盖 components.json 中 aliases，按预期）
pnpm dlx shadcn@latest add button input card dialog sheet \
  dropdown-menu tabs select avatar sonner

# 修正 cn 导入
mv src/components/ui src/shadcn-ui-lib/ui 2>/dev/null || true
# 用 shadcn CLI 直接写到 src/shadcn-ui-lib/ui/（通过 aliases.ui 配置）
# 然后 sed 替换 cn 导入
find src/shadcn-ui-lib/ui -name '*.tsx' -exec sed -i '' 's|from "cn"|from "@/lib/utils"|g' {} +
pnpm remove cn
```

> **注意**：`components.json` 的 `aliases.ui` 是 `"@/shadcn-ui-lib/ui"`，所以 CLI 默认写到 `src/shadcn-ui-lib/ui/`。验证 10 个 .tsx 都在该目录。

### 阶段 6：修正 sonner.tsx 的类型导入（5 min）

```diff
+ import type { CSSProperties } from 'react';
  ...
- } as React.CSSProperties
+ } as CSSProperties
```

### 阶段 7：写 10 个 stories（30 min）

按 `src/shadcn-ui-lib/ui/stories/*.stories.tsx` 路径手写。sonner 对应 `toast.stories.tsx`。

### 阶段 8：写 registry 生成脚本 + 生成 registry（10 min）

- 创建 `scripts/generate-registry.cjs`（约 200 行，逻辑见 6.1）
- 执行 `node scripts/generate-registry.cjs` 生成 12 个 JSON

### 阶段 9：CI / Hooks / Changesets（10 min）

- 创建 `.github/workflows/regen-registry.yml`
- 创建 `.changeset/config.json` 与 `.changeset/initial.md`
- 执行 `pnpm exec husky` 初始化 husky（自动生成 `.husky/pre-commit`）
- 改写 `.husky/pre-commit` 为 `pnpm exec lint-staged`

### 阶段 10：文档（15 min）

- 创建 `README.md`（按 8.1 章节）
- 创建 `AGENTS.md`（按 8.2 章节）

### 阶段 11：本地验收（10 min）

```bash
pnpm install
pnpm typecheck     # 必须 0 error
pnpm lint          # 必须 0 error（2 个 Fast Refresh warning 是已知的）
pnpm build         # 必须成功
pnpm build-storybook  # 必须成功，产出 storybook-static/
```

### 阶段 12：git 初始化与推送（5 min）

```bash
git init -b main
git add -A
git commit -m "feat: initial component library with 10 base components and Storybook demo"
git remote add origin git@github.com:SUN-TN/shadcn-ui-lib.git
git push -u origin main
```

---

## 十、验收清单

按以下顺序逐项打勾：

- [ ] `pnpm install` 无错误
- [ ] `pnpm typecheck` 通过（TS v6 + `verbatimModuleSyntax` + 0 error）
- [ ] `pnpm lint` 通过（0 error；2 个 Fast Refresh warning 为已知）
- [ ] `pnpm build` 成功（产出 `dist/`）
- [ ] `pnpm build-storybook` 成功（产出 `storybook-static/`）
- [ ] `pnpm dev` 启动 Storybook 6006 端口，左侧导航列出 10 个组件（Button/Input/Card/Dialog/Sheet/DropdownMenu/Tabs/Select/Avatar/Toast）
- [ ] 顶栏主题切换器（addon-themes）可切换 light / dark
- [ ] addon-a11y 对每个组件给出可访问性报告
- [ ] 10 个组件 stories 均可正常交互
- [ ] `registry/` 下 12 个 JSON（11 组件 + utils + index）齐全
- [ ] `registry/sonner.json` 的 content 中含 `import type { CSSProperties }`，**不**含 `as React.CSSProperties`（drift 已修）
- [ ] `node scripts/generate-registry.cjs` 跑通且对当前源码产生 0 改动（已对齐）
- [ ] `.husky/pre-commit` 内容为 `pnpm exec lint-staged`
- [ ] `.github/workflows/regen-registry.yml` 在本地 push 后会被触发
- [ ] GitHub Actions 启用（默认）
- [ ] 远程 origin 为 `git@github.com:SUN-TN/shadcn-ui-lib.git`，默认分支 `main`

---

## 十一、风险与陷阱（必须知道的）

| 风险                                                                  | 规避方式                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| TypeScript 7 暂未兼容 typescript-eslint                               | **锁 `^6.0.3`，禁止升 v7**（typescript-eslint#10940）       |
| Storybook 10 没有 `addon-essentials` v10 兼容版                       | 单独装 a11y + themes，**不要装** essentials                 |
| `@vitejs/plugin-react` v6 底层是 OXC                                  | 不要装 swc/oxc 变体；不要降 v5（与 Storybook 10 不匹配）    |
| shadcn CLI 默认装的 `cn` 包                                           | 必须 sed 替换为 `@/lib/utils`，并 `pnpm remove cn`          |
| shadcn CLI v4.7+ 用统一 `radix-ui` 包（**不是** `@radix-ui/react-*`） | 自动跟随，无需手动指定                                      |
| `verbatimModuleSyntax: true` 下禁止 `React.CSSProperties`             | sonner.tsx 必须显式 `import type { CSSProperties }`         |
| `package.json` 是 `"type": "module"`                                  | CommonJS 脚本必须 `.cjs` 后缀                               |
| CI drift check 会拦截未同步的 registry                                | 改完组件立刻 `node scripts/generate-registry.cjs` 并 commit |
| `shadcn registry add` 不会传染源端 `aliases`                          | 真正决定目录的是每个文件的 `files[].target`                 |
| 不发 npm 包                                                           | `"private": true` 保留；`pnpm release` 会拒绝发包           |
