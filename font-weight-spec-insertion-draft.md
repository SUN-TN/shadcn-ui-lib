# 字体字重规范（Font Weight）— 方案 A 落地留档

> **插入位置**：飞书文档《设计 Token 映射表（shadcn + Tailwind CSS v4）》中「八、字体行高」与「十、间距」之间，作为「九、字体字重（Font Weight）」
> **文档链接**：https://kcnq8ppkkxh2.feishu.cn/wiki/N8CUw90lViYpmPkbuVrc8675nsf
> **规范来源**：Figma 设计变量 `text-weight-*`，对应 CSS `font-weight` 属性
> **采用方案**：方案 A —— 直接复用 Tailwind v4 内置语义工具类，不新增 CSS 变量 / registry token
> **同步状态**：✅ 已于 2026-09-22 写入飞书文档；原第九点「间距」及之后顺延为十~十三

## 设计规范

| Figma 变量             | Tailwind v4 工具类 | CSS 值 | 用途                            |
| ---------------------- | ------------------ | ------ | ------------------------------- |
| `text-weight-Normal`   | `font-normal`      | 400    | 正文、基础文本、说明文字        |
| `text-weight-Medium`   | `font-medium`      | 500    | 按钮/控件文字、列表项、次要强调 |
| `text-weight-Semibold` | `font-semibold`    | 600    | 小标题、标签、卡片标题、导航项  |
| `text-weight-Bold`     | `font-bold`        | 700    | 主标题、重点数据、核心强调      |

## 落地规则

1. **字重阶梯收紧为四档**：`400 / 500 / 600 / 700`，与 Figma 变量一一对应，禁止出现规范外的字重档位。
2. **禁止越界字重**：在所有组件源码与 Storybook story 中，不得使用 `font-light`、`font-extrabold`、`font-black` 等超出上述四档的工具类；Tailwind 默认的 `450 / 550 / 650 / 750` 等中间值也不引入。
3. **不新增 token**：直接复用 Tailwind v4 内置语义类，不向 `src/global.css` 的 `:root` 或 `@theme inline` 添加 `--font-*` / `--text-weight-*` 变量，不进入 registry 分发（与项目"禁止新增非语义 token"约定一致）。
4. **一致性维护**：规范与代码的一致性通过"组件源码仅使用上述四个工具类"的约定保障，可选补充 ESLint 规则禁用越界字重类；不依赖颜色同步式的 token 机制。

## 备注

- 飞书文档为唯一真源，本 md 仅为方案留档。
- 字重首档变量名以飞书文档为准：`text-weight-Normal`（对应 CSS 400 / `font-normal`）。
