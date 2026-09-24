# Input 组件 API 契约 — 缺口分析与完善清单

- 审阅对象：[Input 组件 API 契约](https://kcnq8ppkkxh2.feishu.cn/wiki/Ws8nw41MWiNXVNkk7gRc2UgJnBg)（wiki `Ws8nw41MWiNXVNkk7gRc2UgJnBg` / docx `VxxMdrLvOosLJrxno8mcbGJvnUb`，revision 101，最后更新 2026-09-21）
- 对照基准：同知识库《Button 组件 API 契约》（`Pc6AdxcjJoNmztxYPcNcMUSeniB`，revision 1047，状态「评审中」）、本仓库 `src/global.css`、`src/shadcn-ui-lib/ui/input.tsx`、`stories/input.stories.tsx`
- 审阅日期：2026-09-22

---

## 1. 结论

契约骨架完整（0–11 节 + 两个附录，覆盖了变体 / Props / 事件 / Slots / Ref / 状态 / 组合 / a11y / 响应式 / 示例 / Token），但**处于「草案」早期**，与同系列 Button 契约存在明显成熟度落差，且与仓库现有实现**存在 5 处硬性不一致**。

三类问题按优先级分布：

| 级别    | 数量 | 性质                                       | 影响                 |
| ------- | ---- | ------------------------------------------ | -------------------- |
| P0 阻塞 | 6    | 契约与实现冲突 / 枚举不自洽 / 关键数值缺失 | 无法据此开工编码     |
| P1 结构 | 7    | 相对 Button 契约缺失的章节与列             | 无法据此走查与验收   |
| P2 细节 | 9    | 文档内部矛盾、事实错误、排版缺陷           | 评审易产生歧义与返工 |

**最短可用路径**：先裁决 P0 中的 5 个「契约 ↔ 实现」冲突与 1 个尺寸数值表，再补齐 Button 契约已有的 3 类结构（Figma 变量名列 / 尺寸映射表 / 状态样式精确表达式），其余可在评审后迭代。

---

## 2. P0 阻塞项（必须先裁决）

### 2.1 契约定义的 API 在实现中完全不存在

`src/shadcn-ui-lib/ui/input.tsx` 现状：仅透传 `React.ComponentProps<"input">`，无任何自定义 props。

| 契约声明                             | 实现现状                                        | 裁决建议                                                                                       |
| ------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `variant`（outline/filled/ghost）    | 无，硬编码 `border border-input bg-transparent` | 需实现（cva），或降级契约                                                                      |
| `size`（sm/default/lg）              | 无，硬编码 `h-9 px-3 py-1`                      | 需实现（cva）                                                                                  |
| `error`                              | 无，仅靠 `aria-invalid` 触发样式                | 二选一：删除 `error` prop，统一走 `aria-invalid`；或实现 `error` 并在内部同步写 `aria-invalid` |
| `prefix` / `suffix`                  | 无                                              | 需拆 `InputGroup` 或内部包裹 div（涉及 DOM 结构变化，见 2.2）                                  |
| `asChild`                            | 无                                              | 建议**删除**，见 3.3                                                                           |
| `InputHandle`（useImperativeHandle） | 无，ref 直接落到 `<input>`                      | 建议**删除** handle，见 3.4                                                                    |

> 建议立场：契约应明确「本版本实现范围」。若一期只做 `variant` + `size` + `error`，就把 `prefix`/`suffix`/`asChild` 移到「二期 / 未实现」小节并注明，避免实现方与评审方理解错位。

### 2.2 `prefix` / `suffix` 会改变根元素，契约未定义 DOM 结构

原生 `<input>` 不能包含子元素。加前后缀必然引入包裹层，带来连锁影响：

- `className` 合并到包裹层还是 `<input>`？
- `data-slot` 命名（`input-wrapper` / `input-prefix` / `input-suffix`）
- 点击前缀是否触发 `input.focus()`
- 包裹层如何继承 `disabled` / `error` 态样式
- registry 分发时是否新增独立 item（`input-group`），及其 `registryDependencies`

契约第 5 节只写了「与输入框同高对齐」，不足以开工。

### 2.3 变体枚举三处不一致

| 位置               | 声明                                                    |
| ------------------ | ------------------------------------------------------- |
| 第 2 节变体映射表  | 4 个：`outline` / `filled` / `ghost` / **`underlined`** |
| 第 3 节 Props 枚举 | 3 个：`"outline" \| "filled" \| "ghost"`                |
| 总结               | 「三类视觉变体」                                        |

`underlined` 既未进 Props 枚举，也无 Token 说明（`--input` 下边框 = 非圆角、非全描边，与 `rounded-md` 约定冲突）。**必须二选一**：补进 Props 并给出完整定义，或标注「暂不支持」移出表格。

### 2.4 缺尺寸数值表（最大空缺）

Button 契约 2.5 给出了 `small/medium/large` 的**高度 / 水平内边距 / 圆角 / 字号 / SVG 图标尺寸**五列精确值；Input 契约对 `sm / default / lg` 只有「紧凑高度 / 默认高度 / 宽松高度」三个形容词。附录 A 也只给了 default 的内边距（12px / 8px）。

没有这张表，`h-9` 是否等于 `default` 无法判定，实现方只能自行猜测。见第 6 节给出的可落地草案。

### 2.5 disabled 视觉口径冲突

- 契约第 7 节：`--disabled` 底 + 文字 `--muted-foreground`
- 实现：`disabled:pointer-events-none disabled:opacity-50`，**无底色**
- 事实：`--disabled` 与 `--input` 同为 `oklch(0.885 0 0)`（#D9D9D9）。若禁用底与描边同色，边框会完全消失

三者互斥，需明确：禁用态是「换底色」还是「降透明度」。Button 契约采用后者（`opacity-50`），建议 Input 与 Button 保持同一口径。

### 2.6 focus 环规格与实现不一致

- 契约第 7 节：`--ring` 聚焦环（`ring-2`）
- 实现与 Button 契约：`focus-visible:ring-[3px] focus-visible:ring-ring/50`

`ring-2`（2px）与 `ring-[3px]`（3px）必须统一；透明档按项目约定写 `ring-ring/50`，**不新建 token**。

---

## 3. 文档内部矛盾与事实错误（P1/P2）

| #   | 位置             | 问题                                                                                                                                       | 建议                                                                                                                                         |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | 总结             | 「待补充：元信息（负责人 / 设计负责人 / 评审人）」——但第 0 节三项均已填写                                                                  | 删除该条，改为列出真正待办：设计稿链接、走查记录、`error+disabled` 优先级、字号与 size 映射                                                  |
| 3.2 | 附录 A 备注      | 「Token 映射表字号基准为 `0.625rem`，与常见 14–16px 正文存在偏差」——`0.625rem` 是 `--radius`，不是字号                                     | 更正。`src/global.css` 已定义 `--text-caption: 12px`、`--text-body: 14px`、`--text-body-strong: 16px`、`--text-title-md: 16px`，可直接映射   |
| 3.3 | 第 5 节          | `asChild` 与 `<input>` 语义冲突：input 是 void 元素，Slot 替换根元素后没有可替换的子节点                                                   | 移除 `asChild`，或限定为「仅 prefix/suffix 场景下的装饰节点」                                                                                |
| 3.4 | 第 6 节          | `InputHandle` + `useImperativeHandle` 暴露 `focus/blur/select`——这三个方法原生 `HTMLInputElement` 已有，React 19 下 `ref` 直接透传即可拿到 | 与 Button 契约第 5 节写法统一：`Ref<HTMLInputElement>` + 「可用 DOM 方法」表。若确需额外能力（如 `clear()`），才保留自定义 handle 并说明理由 |
| 3.5 | 第 4 节          | 事件表保留「loading 时触发」列，但 Input 明确无 loading 态                                                                                 | 删除该列，或整列标注 N/A（Button 保留是因为 Button 确有 loading）                                                                            |
| 3.6 | 第 2 节          | `variant="underlined"` 行未加反引号，Markdown 表格渲染错列                                                                                 | 修排版                                                                                                                                       |
| 3.7 | 第 9 节          | 「Esc：清空」只在有清除按钮时成立，但清除按钮不是内置 API，第 3/5 节均未定义                                                               | 要么定义内置清除能力（`clearable` + 回调），要么把 Esc 从键盘表移除                                                                          |
| 3.8 | 第 10 节 vs 实现 | 契约「`< 640px` 全宽」，实现 `w-full min-w-0` 是**无条件全宽**                                                                             | 明确 `w-full` 是否为默认值、如何关闭；参照 Button 契约第 9 节「组件自身不做响应式，由业务层 className 控制」                                 |
| 3.9 | 附录 B / 实现    | 「当前暂不实现暗色模式」——但 `input.tsx` 含 `dark:bg-input/30`、`dark:aria-invalid:ring-destructive/40`，且 `theme-dark.json` 已发布       | 改为「组件随 `theme-dark` 提供中性暗色基线，暗色 token 以 `.dark` 段为准」                                                                   |

---

## 4. 相对 Button 契约缺失的结构（P1）

Button 契约已具备而 Input 契约缺失的部分：

1. **Figma 变量名列**——Button 每个变体 / 颜色 / 尺寸都给出 `color/brand/primary`、`radius/sm`、`spacing/md` 等 Figma 变量；Input 全文无 Figma 变量名，状态矩阵「设计稿」列全为「待补充」。
2. **变体映射表的完整列**——Button：语义 / Token / Figma / Tailwind 工具类 / CSS 值 / 视觉效果；Input：仅「说明」一列。
3. **尺寸映射表**（见 2.4）。
4. **状态样式的精确表达式**——Button hover 写 `hover:opacity-70` + `hover:bg-primary/90` + `hover:bg-accent`，disabled 写 `disabled:pointer-events-none disabled:opacity-50`，并注明「纯 Tailwind 工具类，无对应 Token」；Input 只写「描边略加深」，且现有 token 体系中**没有 hover 描边色**，实现无从下手。
5. **「继承的原生 Props」子表**——Button 有 2.6 节单列 `React.ComponentProps<"button">` 继承项；Input 未列，导致 `autoComplete`、`required`、`min/max/step`、`pattern`、`inputMode`、`autoFocus`、`name`、`form` 等表单核心属性处于契约空白。
6. **Token 映射速查章节**——Button 第 11 节把全文涉及的 token 汇总成「CSS 变量 / Figma 变量名 / Tailwind 工具类 / CSS 值」四列表；Input 只有附录 A，且未覆盖实现中实际用到的 `selection:bg-primary`、`file:*` 系列。
7. **关联文档中的 Figma 链接**——Button 元信息有具体 figma.com 设计稿 URL；Input 为「待补」。

---

## 5. 建议新增章节（P1/P2）

| 建议章节                 | 优先级             | 内容要点                                                                                                                                                                                                               |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 交付形态与 registry 约定 | P1（本项目特有）   | registry item 名 `@shadcn-ui-lib/input`、安装命令、落盘路径 `<aliases.ui>/shadcn-ui-lib/input.tsx`、依赖 `cn`、若拆 `InputGroup` 的 `registryDependencies` 与绝对 URL 写法。Button 契约同样缺，建议在 Input 上先立规范 |
| 表单集成规范             | P1                 | 与 `Label`（`htmlFor` ↔ `id`）、`FormItem`（错误文案容器）的协作；`id` 必须通过 `React.useId()` 生成（否则 SSR 水合错配）；`aria-describedby` 指向错误文本的 id 约定；`required` 的视觉与语义                          |
| 中文输入法（IME）处理    | P1（中文产品必写） | 受控 `value` 在 `compositionstart` ~ `compositionend` 期间的更新策略；是否透出 `onCompositionStart` / `onCompositionEnd`；`maxLength` 在组合态的计数口径                                                               |
| 受控 / 非受控边界        | P1                 | 现有一句注解不够。需写清：`value` 与 `defaultValue` 同时传的行为、`value` 传 `undefined` 的降级、只传 `onChange` 不传 `value` 的告警、与 react-hook-form `register` / `Controller` 的集成示例                          |
| 校验与错误文案规范       | P2                 | 错误文案长度上限、是否带图标、`role="alert"` / `aria-live="polite"`、错误态与 `focus` 的视觉优先级                                                                                                                     |
| 测试与验收清单（DoD）    | P2                 | 逐条可勾选：变体×尺寸×状态组合渲染、键盘可达、axe 无违规、对比度 AA、受控/非受控、IME、SSR 水合、暗色基线                                                                                                              |
| Storybook 覆盖清单       | P2                 | 现状 `input.stories.tsx` 只有 `Default / Disabled / File` 三个 story，契约定义了 3 变体 × 3 尺寸 × 8 状态。需列出必须覆盖的 story 清单                                                                                 |
| 版本与废弃策略           | P2                 | 语义化版本、`@deprecated` 处理、破坏性变更的上报路径（配合仓库的 changesets 流程）                                                                                                                                     |

---

## 6. 可直接落地的建议值（草案，待设计确认）

### 6.1 尺寸映射表（对齐 Button 的 24/32/40 阶梯）

| size      | 高度        | 水平内边距  | 圆角             | 字号                      | 前后缀图标      | 说明                             |
| --------- | ----------- | ----------- | ---------------- | ------------------------- | --------------- | -------------------------------- |
| `sm`      | 32px `h-8`  | 8px `px-2`  | `rounded-md` 6px | `--text-body` 14px        | 14px `size-3.5` | 表格内嵌、筛选栏                 |
| `default` | 36px `h-9`  | 12px `px-3` | `rounded-md` 6px | `--text-body` 14px        | 16px `size-4`   | 默认（与现实现 `h-9 px-3` 一致） |
| `lg`      | 40px `h-10` | 16px `px-4` | `rounded-md` 6px | `--text-body-strong` 16px | 16px `size-4`   | 登录/注册主表单                  |

> 待确认项：移动端建议保持 16px 以上（`text-base`），否则 iOS Safari 聚焦时会自动放大页面。当前实现 `text-base md:text-sm`（16px → 14px）已经规避了该问题，改用 `--text-body` 14px 会重新引入，需在设计侧确认取舍。

### 6.2 状态样式表达式（与实现 / Button 对齐）

| 状态        | Tailwind 表达式                                                                            | Token                                                                           |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| default     | `border border-input bg-transparent`                                                       | `--input` #D9D9D9                                                               |
| hover       | `hover:border-muted-foreground/60` 或沿用 Button 的 `hover:opacity-70` 口径                | 现有 token 无 hover 描边色，需设计确认；**不新建 token**，用透明度修饰符        |
| focus       | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`            | `--ring` #3091E1 / 50%                                                          |
| error       | `aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20` | `--destructive` #FD2237 / 20%                                                   |
| disabled    | `disabled:pointer-events-none disabled:opacity-50`（与 Button 同口径）                     | 无新 token                                                                      |
| readonly    | 同 default + `read-only:cursor-default`                                                    | —                                                                               |
| placeholder | `placeholder:text-subtle-foreground`                                                       | `--subtle-foreground` #999999（比 `--muted-foreground` #666666 更贴近占位层级） |

### 6.3 附录 A 需补充的行

- `--ring` 的透明档（`/50`）
- 聚焦环宽度 3px
- `selection:bg-primary` / `selection:text-primary-foreground`（文本选中）
- `file:` 系列（若 `type` 枚举保留 `file`——当前 story 有 `File` 但 Props 枚举未列 `file`，需同步）
- transition 时长与属性（`transition-[color,box-shadow]`）

---

## 7. 跨文档一致性提醒

Button 契约 11.1 中 `--info` 记为 `oklch(0.66847 0 0)`，反算约为 `#949494`，与 `#999999` 相差约 5 个色阶；本仓库 `src/global.css` 采用 `oklch(0.682 0 0)`（反算 ≈ `#989898`，误差 1 个色阶）。建议以仓库真源为准，回写 Button 契约。

---

## 8. 执行顺序建议

1. **裁决会**（设计 + 前端）：变体是否含 `underlined`、`error` prop 去留、disabled 口径、`prefix/suffix` 是否一期做——输出决策记录写进第 0 节。
2. **补数值**：尺寸映射表（6.1）、状态样式表达式（6.2）、hover 色确认。
3. **补结构**：变体表加 Figma/Tailwind/CSS 列；新增「继承的原生 Props」表；Token 速查章节。
4. **补章节**：表单集成、IME、受控边界、registry 交付形态、DoD、Storybook 清单。
5. **回写实现**：`input.tsx` 落地 cva 变体与尺寸；`input.stories.tsx` 补齐 story；重跑 `node scripts/generate-registry.cjs` 并连带提交 `registry/input.json`；补 changeset。
