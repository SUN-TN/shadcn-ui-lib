# shadcn-ui-lib

基于 **React 19 + Vite 8 + TypeScript 7 + Tailwind CSS v4 + shadcn/ui + Storybook 10** 的组件库脚手架。

## 技术栈

- **构建**: Vite 8 + `@vitejs/plugin-react` v6（底层 OXC）
- **语言**: TypeScript 7（启用 `erasableSyntaxOnly`）
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
├── components/
│   ├── ui/                # shadcn 组件（10 件套）
│   ├── theme/             # next-themes 包装
│   └── stories/           # 每个组件的 Storybook story
├── lib/
│   └── utils.ts           # cn() 等
├── App.tsx
├── main.tsx
└── index.css              # Tailwind v4 入口 + 主题变量
.storybook/                # Storybook 配置
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

shadcn CLI 会把组件源码写到 `src/components/ui/<name>.tsx`，并自动安装依赖。导入路径已统一为 `@/lib/utils`。

随后在 `src/components/stories/` 下新建 `<name>.stories.tsx`：

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '../ui/my-component';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { /* ... */ } };
```

## 主题

主题由 `next-themes` 管理（`attribute="class"`，`defaultTheme="system"`），与 Tailwind v4 的 `@custom-variant dark (&:is(.dark *))` 配合。

在 Storybook 中可使用顶部 **Themes** 工具栏切换 light / dark。

## Changesets

修改完成后：

```bash
pnpm changeset          # 选择 bump 类型并写说明
pnpm version-packages   # 更新 package.json 与 CHANGELOG.md
pnpm release            # 发布到 npm（需先去掉 package.json 中的 private）
```

## 已知约束

- TS 7 启用 `erasableSyntaxOnly`，禁止 `enum` / `namespace` / 参数属性。shadcn 生成的组件如有 `enum`，需改写为 `as const` 对象字面量。
- shadcn CLI 默认装 `cn` 包；本项目已替换为 `@/lib/utils`，并 `pnpm remove cn`。
- 包当前为 `private: true`，`pnpm release` 会拒绝发包；正式发包前改回 `false` 并配置 `files` 字段。
