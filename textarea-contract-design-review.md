# Textarea 组件 API 契约 — 设计侧评审与优化建议

- 评审对象：[组件 API 契约：Textarea](https://kcnq8ppkkxh2.feishu.cn/wiki/TWSuwCnk5igwIskXlwMcIteRnve)（docx `OTttdXfPYoeZFXxgdUwc3RgPnUh`，rev 16，状态「草案」）
- 上游依据：飞书《CSS Token 映射表 V1》（`color/status/destructive` #FD2237、`color/status/warning` #FE660A、`color/text/subtle` #999999、`color/border/input` #D9D9D9、`color/bg/background` #F2F4F8、`color/text/foreground` #333333）
- 横向基准：《Input 组件 API 契约》（rev 110，已定稿决策 D1–D10）、《Button 组件 API 契约》
- 评审方法：`lark-cli docs +fetch` 拉全文 → 对照 `feishu-component-api` skill 的 10 条铁律 + Input 评审先例 + Token 真值实测
- 评审日期：2026-09-23
- 范围：仅设计侧。不改本地组件源码；是否把结论回写飞书文档待裁决（本评审本身不修改飞书）

---

## 1. 结论

这份 Textarea 契约的**结构远优于当初的 Input 契约**（已覆盖高度策略 / IME / maxLength / 表单集成等专项章节，且第 12、13 节对中文输入法与硬软限制的处理是亮点）。但它存在两类问题：

1. **与已定稿的 Input 契约存在跨组件冲突**（size 枚举、prefix/suffix、Ref 方法三处直接矛盾）——同一表单库的兄弟组件必须一致。
2. **全文零 Token 映射**（无任何 figma 变量名 / Tailwind 工具类 / CSS 值），状态矩阵、尺寸、响应式全是形容词描述，无法落地、也无法通过本库契约标准（Input 评审 M1/M2/M4 要求的就是这些）。

| 分级       | 数量 | 说明                                                                                       |
| ---------- | ---- | ------------------------------------------------------------------------------------------ |
| 设计错误   | 11   | 可判定对错，含 2 条量化对比度不达标（placeholder 2.59:1、警告橙边 2.68:1）+ 3 处跨组件冲突 |
| 设计未决   | 6    | 文档自己标（待补）/ 需裁决                                                                 |
| 设计缺失   | 8    | 设计规范应当定义但完全空白                                                                 |
| 待裁决决策 | 0    | D1–D4 全部已裁决（均采纳推荐方案，见第 5 节）                                              |

---

## 2. 设计错误（可判定对错）

### E1（严重）第 9 节「placeholder 与背景 ≥ 3:1」为错误断言

实测（背景 #F2F4F8）：`--subtle-foreground` #999999 = **2.59:1**，低于 3:1；只有 `--muted-foreground` #666666 = 5.21:1 达标。契约若沿用默认 placeholder 色 #999999，声明「≥ 3:1」即与事实冲突。需收敛为单一值或显式豁免。

### E2（严重，新增发现）警告态橙边不满足非文本对比度 3:1

`status="warning"` 视觉为「橙色边框」。Token 真值 `--warning` #FE660A 在 #F2F4F8 上 = **2.68:1**，低于 WCAG 2.1 1.4.11（3:1）。错误态 `--destructive` #FD2237 = 3.49:1 达标，但 warning 不达标。契约第 7 节与第 9 节均未给 token 与实测，等于把不合规的橙边留给了实现方。

### E3 聚焦环宽度/不透明度未定义，沿用 `ring/50` 则不达标

第 7 节只写「高亮边框 + focus ring」，无宽度与不透明度。若沿用项目常见的 `ring-ring/50`（合成 #91C2EC）= **1.71:1**，低于 1.4.11 的 3:1；100% #3091E1 = 3.05:1 才达标。需写明宽度与不透明度（对齐 Input 已定稿的 `ring-[3px] ring-ring/50`，并标注该 50% 档 1.71:1 的已知风险 R3）。

> 一致性提示：Input 契约 rev 110 已落地 `focus-visible:ring-[3px] focus-visible:ring-ring/50` 并标注 R3 风险；Textarea **应直接对齐**，不要另起一套。

### E4 disabled 底与描边同色，轮廓消失（与 Input E4 同）

`--disabled` #D9D9D9 与 `--input` #D9D9D9 同值。第 7 节 disabled「灰底、灰字、无边框交互」结果是底与描边同色，输入框退化为无边色块（1.28:1）。需给禁用态一个可辨识的描边/底色层次或显式豁免声明。

### E5 readonly 浅灰底与 default 不可辨（与 Input E7 同）

第 7 节 readonly「浅灰底、常规字、无编辑光标」，`--muted` #F0F0F0 在 #F2F4F8 上 = **1.03:1**，用户只能靠尝试输入失败才发现不可编辑。至少应给一项区分（底 `--muted` / 光标形态 / 无聚焦环）。

### E6（严重）全文零 Token 映射，违反 skill 铁律 R1/R2/R9

全篇变体表、状态矩阵、尺寸、响应式、高度策略**没有任何一處 figma 变量名 / Tailwind 工具类 / CSS 值**。skill 铁律要求：凡 CSS Token 映射表优先三列（figma 变量名 / tailwind 工具类 / css 值），最少两列。当前文档连「红色边框」都没写清是 `--destructive` 还是别的、没写 `ring` 宽度。这是无法通过本库契约评审的最大缺口。

### E7 size 枚举 `sm/default/lg` 与 Input 已定稿冲突

Input 契约 D6 已裁决：**`small` / `medium` / `large`**（默认 `medium`），**不使用** `sm` / `default` / `lg` 简写。本契约第 3 节用 `'sm' | 'default' | 'lg'`、默认 `'default'`，直接矛盾。表单库兄弟组件 size 枚举必须一致。

### E8 prefix / suffix 直出 props 与 Input D10 冲突

Input 契约 D10 已裁决：Input **不提供** `prefix` / `suffix` props，前后缀一律走组合式 `InputGroup` + `InputGroupAddon`。本契约第 3、5 节把 `prefix` / `suffix` 当作 `ReactNode` props 直出，与 Input 的架构决策冲突。需统一裁决（见第 5 节 D2）。

### E9 Ref 暴露 `setValue` 命令式方法：受控反模式 + 与 Input C6 冲突

第 6 节 Ref 暴露 `setValue(value)`「命令式设置值并触发 onChange」。问题有二：

1. 受控组件应通过 `value` prop 驱动，命令式 `setValue` 在受控下易引发回环；标准 React 组件（AntD/shadcn）不暴露此类方法。
2. Input 契约 C6 已定稿：`Ref<HTMLInputElement>` + 原生 DOM 方法（focus/blur/select），**不用** `useImperativeHandle`、不造 `setValue`。

Textarea 应改为 `Ref<HTMLTextAreaElement>` + 原生方法（focus/blur/select/setSelectionRange/scrollTo）。

### E10 `active` 状态对文本输入控件无意义

第 7 节状态矩阵列了 `active`（「边框按下态」）。文本域不是按钮，无 `:active` 视觉语义，此行是照搬 Button 模板。应删除或标 N/A。

### E11 onPressEnter「回车」与多行换行语义冲突

第 4 节 onPressEnter 写「回车」且「多行默认换行，可按需改为提交」。但 textarea 原生 Enter = 换行；若 onPressEnter 在裸 Enter 触发并要求提交，会劫持换行。第 4 节 onKeyDown 说明又写「⌘/Ctrl+Enter 提交」——两处不自洽。多行语义下应明确：**bare Enter 永远换行，仅 ⌘/Ctrl+Enter 触发提交事件**（见第 5 节 D4）。

---

## 3. 设计未决（需裁决）

| #   | 位置        | 未决项                                                                                           |
| --- | ----------- | ------------------------------------------------------------------------------------------------ |
| O1  | 元信息      | 负责人 / 设计负责人 / 评审人 / 关联文档均为（待填）                                              |
| O2  | 状态矩阵    | 9 行「设计稿」列全为（待补）                                                                     |
| O3  | 全局        | 暗色规范结论缺失；Token 表 `--disabled` / `--subtle-foreground` / `--success` 等标注「未重声明」 |
| O4  | 第 9 节     | 辅助文本（label / help / error）视觉规范缺 token（字号/颜色/间距/必填标记）                      |
| O5  | 第 10 节    | 移动端「字号 ≥ 16px」与 `size` 默认 14px 冲突未解（size=sm/medium 在 <640px 会触发 iOS 缩放）    |
| O6  | 第 12+13 节 | IME 合成中途 × 硬限制 `maxLength` 的交互规则未定义（见第 6.4 节建议）                            |

---

## 4. 设计缺失（应有但未定义）

| #   | 缺失项                    | 应含内容                                                                                                      |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| M1  | **三列 Token 映射表**     | 全文补 figma 变量名 / Tailwind / CSS 值（变体、状态、尺寸、响应式、高度）——最大缺口                           |
| M2  | **状态矩阵精确 Tailwind** | `ring-[3px]`/`ring-ring/50`、`border-destructive`、warning 描边 token、disabled/readonly 的 token 与工具类    |
| M3  | **尺寸映射表**            | 高度/min-height、内边距、圆角、字号、行高、图标尺寸；Textarea 高度不由 24/32/40 决定，需自定阶梯              |
| M4  | **对比度实测表**          | 本文第 6.1 节数值可直接作为初稿                                                                               |
| M5  | **聚焦/错误/警告环**      | 宽度与不透明度（错误环同 Input `destructive/20`；警告环需新定义）                                             |
| M6  | **辅助文本体系**          | label / help / error / count 四者的版式、间距、token（error 用 `--destructive`、caption 用 `--text-caption`） |
| M7  | **暗色结论**              | 明确「是否定义暗色规范」；Token 表多项未重声明，基线不完整                                                    |
| M8  | **动效规范**              | transition 属性/时长/easing、`prefers-reduced-motion` 降级（第 9 节仅一句）                                   |

---

## 5. 待裁决决策（已用 AskUserQuestion 向你确认）

| #   | 议题                     | 我的建议                                                                                                  | 影响范围                                          |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| D1  | `size` 枚举命名          | **已裁决（用户确认）**：收敛到 `small` / `medium` / `large`（默认 `medium`），对齐 Input D6               | 第 3 节 Props、第 10 节响应式、示例               |
| D2  | `prefix` / `suffix` 实现 | **已裁决（用户确认）**：删除直出 props，改用组合式 `TextareaGroup` + `TextareaGroupAddon`，对齐 Input D10 | 第 3 节 Props、第 5 节 Slots、组合规则、第 6.9 节 |
| D3  | Ref 是否暴露 `setValue`  | **已裁决（用户确认）**：删除 `setValue`，改 `Ref<HTMLTextAreaElement>` + 原生 DOM 方法，对齐 Input C6     | 第 6 节 Ref、第 6.6 节                            |
| D4  | onPressEnter 触发语义    | **已裁决（用户确认）**：仅 ⌘/Ctrl+Enter 触发提交；bare Enter 永远换行                                     | 第 4 节事件、第 6.5 节                            |

> D1–D4 已全部裁决（均采纳推荐方案 A）：D1 对齐 Input `small/medium/large`；D2 改组合式 `TextareaGroup`；D3 删除 `setValue` 用原生 Ref；D4 仅 ⌘/Ctrl+Enter 提交。跨组件一致性已闭合。

### 5.1 D3 详细对比：`setValue` 去留

**方案 A（推荐）：删除 `setValue`，用 `Ref<HTMLTextAreaElement>` + 原生 DOM 方法**

- 优点：
  - 与 Input 契约 C6 完全一致，Form 体系内 Ref 行为统一
  - 符合 React 受控范式：值只由 `value` prop 驱动，无命令式回写导致的 render 回环风险
  - 原生方法（focus / blur / select / setSelectionRange / scrollTo）已 100% 覆盖「聚焦 / 选中 / 设光标 / 滚动」所有真实需求
  - 非受控取值可经原生 `name` 提交或 `ref.current.value` 读取，无需额外 API
- 缺点：非受控场景下「外部命令式设值」需改用 `defaultValue` 重置或受控 `value`（属 React 标准做法，不算额外成本）

**方案 B：保留 `setValue(value)` 命令式方法**

- 优点：非受控组件可由父级一行代码设值，调用方觉得方便
- 缺点：
  - 受控模式下 `setValue` 触发 onChange → 父级 setState → 可能回环，需业务自行 guard
  - 与 Input C6 冲突，兄弟组件 Ref 能力不对称，Form 集成层难以统一封装
  - 标准库（AntD / shadcn / Radix）均无此 API，属非惯例设计，增加迁移与认知成本
  - `useImperativeHandle` 包一层反而隐藏真实 DOM，调试不便

**结论（已采纳方案 A）**：删除 `setValue`，改 `Ref<HTMLTextAreaElement>` + 原生 DOM 方法（focus / blur / select / setSelectionRange / scrollTo），对齐 Input C6。若确有「非受控命令式设值」强诉求，应暴露原生 `ref.current.value = x` 的赋值封装（仍不触发 onChange），而非造 `setValue` 事件。

### 5.2 D4 详细对比：`onPressEnter` 语义

**方案 A（推荐）：仅 ⌘/Ctrl+Enter 触发提交，bare Enter 永远换行**

- 优点：
  - 不劫持多行换行，最符合 textarea 心智模型（Enter = 换行是用户肌肉记忆）
  - 与第 4 节 onKeyDown 说明「⌘/Ctrl+Enter 提交」自洽，无歧义
  - 跨平台一致（Mac ⌘ / Win Ctrl）
- 缺点：纯键盘提交需用户知道组合键（可用 hint / tooltip 提示）

**方案 B：暴露 `onEnter`，裸回车也触发，由业务 `preventDefault` 决定**

- 优点：业务可灵活决定「某些场景 Enter 即提交」（如聊天框）
- 缺点：
  - 若业务忘记 `preventDefault`，Enter 既提交又换行，体验割裂
  - 多行输入默认期望换行，把「是否换行」交给每个调用方易出错、难统一
  - 与文档「多行默认换行」表述直接冲突

**结论（已采纳方案 A）**：仅 ⌘/Ctrl+Enter 触发提交，bare Enter 永远换行。若业务需要「聊天式 Enter 提交」，应在该业务组件封装层处理（监听 `onKeyDown` 自行判断），而非在基础 Textarea 把 Enter 语义复杂化；基础组件保持「Enter = 换行」的纯净契约。

### 5.3 O5 详细对比：移动端字号与 size 冲突

**背景**：iOS Safari 在输入框聚焦时，若计算字号 < 16px 会自动放大页面（Apple 无障碍/可读性行为），破坏布局与输入体验。文档第 10 节因此要求移动端「字号 ≥ 16px」，但 `size` 默认 medium = 14px，二者冲突。

**方案 A（推荐）：移动端强制 16px，忽略 size 字号**

- 区别：`<640px` 时 Textarea 字号锁定 16px（无论 size=sm/medium/large），size 仅在 ≥640px 生效。
- 优点：① 彻底规避 iOS 聚焦自动放大；② 移动端触控可读性最佳；③ 实现简单（一个断点媒体查询 `max-[639px]:text-[16px]`）；④ 不改动桌面端既定 14px 视觉基线。
- 缺点：① 移动端失去 size 字号差异（small/medium 视觉一致），但移动端空间紧张、差异价值低；② 同 size 在手机/桌面字号不连续。

**方案 B：size 字号整体上调到 16px**

- 区别：所有断点 medium = 16px（原 14px），全局放大一档。
- 优点：① 全断点字号统一、无断点突变；② 同样规避 iOS 缩放。
- 缺点：① 桌面端 14px 是既定设计语言（与 Input/Button 对齐），全局改 16px 会偏离整个表单库视觉基线，需同步改 Input/Button；② 长文本在桌面端更占空间。

**方案 C：仅 sm 档移动端提 16px，medium/large 维持**

- 区别：只在 size=sm 时移动端锁 16px。
- 优点：改动最小，只动最容易触发缩放的小尺寸。
- 缺点：medium 也是 14px，移动端仍会触发 iOS 缩放——**逻辑不闭环，问题没解决**；且规则自相矛盾。

**结论（推荐方案 A）**：iOS 缩放触发条件是「聚焦时计算字号 < 16px」，只要任一 size 在移动端 < 16px 就会被放大。因此正确做法是移动端整体锁 16px，而非改全局基线（牵动 Input/Button）或只改 sm（medium 仍中招）。方案 A 用单一断点媒体查询即可闭环，且不影响桌面端视觉，是最优解。

### 5.4 M3 详细对比：尺寸映射表定义

**背景**：Textarea 高度不由 24/32/40（单行 Input 高度）决定，而是由 `rows` / `autoSize` 决定；`size` 只影响文字度量。文档当前缺任何尺寸映射表。

**方案 A（推荐）：采纳 6.3 草案，size 控制文字度量，高度由 rows / autoSize 决定**

- 区别：`size ∈ {small / medium / large}` 仅决定 字号 / 行高 / 水平内边距 / 圆角；垂直高度完全交给 `rows`（固定）或 `autoSize`（自适应）。
- 优点：① 与 Input D6 命名对齐；② 不重复定义高度（Textarea 高度是行数概念，非像素）；③ 语义清晰、实现简单；④ autoSize 上下限用户可控。
- 缺点：size 不改变「框有多高」，固定 `rows` 下 small/medium 只差文字大小，视觉差异弱；需文档显式声明「高度不由 size 决定」避免误用。

**方案 B：在 6.3 基础上补绝对 min-height 阶梯（small 56 / medium 72 / large 96px）**

- 区别：除文字度量外，再给每档一个最小高度像素值。
- 优点：即便 `rows=1` 也有合理最小高度，避免极矮框；设计稿可控。
- 缺点：① 与 autoSize / rows 可能冲突（min-height vs 行高撑高）；② 引入像素值需落标准档（R3：高度非标需标注）；③ 偏离「高度交 rows」原则，增加复杂度。

**方案 C：仅定义字号 / 内边距 / 圆角，高度完全交 rows / autoSize，不写 size 高度**

- 区别：比 A 更少，连 size 对文字度量的映射都不强制，只给全局默认。
- 优点：最小约束，灵活。
- 缺点：① size 枚举失去具体视觉含义，等于摆设；② 各业务自行发挥，一致性差。

**结论（推荐方案 A）**：Textarea 高度本质是行数（rows / autoSize），与单行 Input 的像素高度是不同维度；用 24/32/40 套 Textarea 会错配。方案 A 让 size 回归「文字度量」本职、与 Input 命名一致、不引入非标像素，最干净。需文档显式声明「高度不由 size 决定」。

### 5.5 M8 详细对比：动效规范

**背景**：文档第 9 节仅一句「autoSize 高度过渡应尊重 prefers-reduced-motion」，缺 transition 属性 / 时长 / easing 定义。

**方案 A（推荐）：补完整动效规范**

- 区别：定义 `transition-property`（border-color、box-shadow）、`duration`（如 150ms）、`easing`（ease-out）；autoSize 高度过渡用同时长；`prefers-reduced-motion` 下关闭 border/box-shadow 过渡与高度动画。
- 优点：① 交互反馈一致、可预期；② 对齐主流库（AntD ~0.2s ease）；③ 无障碍降级明确。
- 缺点：需定具体数值（建议固定 ms，避免依赖未定义 token）。

**方案 B：仅保留 reduced-motion 一句**

- 区别：不定义 transition，只声明尊重 reduced-motion。
- 优点：最小，不绑定具体时长。
- 缺点：① 各浏览器默认 transition 不一致，focus/error 切换突兀；② 等于没规范。

**方案 C：补 transition，但 reduced-motion 交 CSS 默认**

- 区别：定义 transition，reduced-motion 不单独处理。
- 优点：折中。
- 缺点：reduced-motion 用户仍可能看到高度动画，无障碍不闭环。

**结论（推荐方案 A）**：表单控件状态切换（focus / error）若无统一过渡会显得廉价且不一致；150ms ease-out 是行业共识。reduced-motion 必须显式关闭（不仅高度，box-shadow 聚焦环也该关），方案 C 留漏洞。数值建议固定 ms（如 150ms）。

---

## 6. 优化方案（可直接写入的草案）

### 6.1 对比度实测表（替代第 9 节「≥ 4.5:1 / ≥ 3:1」空话）

| 元素                | Token                 | 取值    | 与 #F2F4F8 对比度 | 判定                          |
| ------------------- | --------------------- | ------- | ----------------- | ----------------------------- |
| 输入文字            | `--foreground`        | #333333 | 11.47:1           | 达标（AA 4.5）                |
| placeholder（采用） | `--subtle-foreground` | #999999 | **2.59:1**        | 低于 3:1，按 E1 收敛或豁免    |
| placeholder（备选） | `--muted-foreground`  | #666666 | 5.21:1            | 达标                          |
| 错误描边            | `--destructive`       | #FD2237 | 3.49:1            | 达标（1.4.11 3:1）            |
| 警告描边            | `--warning`           | #FE660A | **2.68:1**        | 低于 3:1，按 E2 标注风险      |
| 聚焦环 100%         | `--ring`              | #3091E1 | 3.05:1            | 达标                          |
| 聚焦环 50%（采用）  | 合成 #91C2EC          |         | **1.71:1**        | 低于 3:1，按 R3 标注风险      |
| 禁用底              | `--disabled`          | #D9D9D9 | 1.28:1            | 轮廓消失，按 E4 处理          |
| 只读底              | `--muted`             | #F0F0F0 | 1.03:1            | 与 default 不可辨，按 E5 处理 |

### 6.2 状态矩阵 Tailwind 表达式草案（替代形容词）

| 状态        | Tailwind 表达式                                                                            | 说明                                               |
| ----------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| default     | `border-input bg-background`                                                               | —                                                  |
| hover       | 暂不定义                                                                                   | 现有 token 无 hover 描边色（同 Input R1）          |
| focus       | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`            | 对齐 Input；50% 档 1.71:1 标 R3                    |
| error       | `aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20` | 常驻；20% 档 1.34:1 仅作辅助层次                   |
| warning     | `aria-[warning]:border-warning` + 同口径环                                                 | **警告描边 2.68:1 不达标，需标注风险或加深 token** |
| disabled    | `disabled:bg-disabled disabled:text-muted-foreground disabled:pointer-events-none`         | 底描边同色→轮廓消失（E4）                          |
| readonly    | `read-only:bg-muted read-only:cursor-default`                                              | 至少区分底色（E5）                                 |
| placeholder | `placeholder:text-subtle-foreground`                                                       | #999999=2.59:1，按 E1 收敛                         |

### 6.3 size 映射表草案（命名待 D1 裁决）

> Textarea 高度不由 24/32/40 决定（那是单行 Input 高度），`size` 仅控制文字度量；高度由 `rows` / `autoSize` 决定。以下为文字度量映射：

| size（建议）     | 字号                  | 行高 | 水平内边距  | 圆角             |
| ---------------- | --------------------- | ---- | ----------- | ---------------- |
| `small`          | `--text-caption` 12px | 1.5  | `px-2` 8px  | `rounded-md` 6px |
| `medium`（默认） | `--text-body` 14px    | 1.5  | `px-4` 16px | `rounded-md` 6px |
| `large`          | `--text-body` 14px    | 1.5  | `px-6` 24px | `rounded-md` 6px |

### 6.4 IME × maxLength 硬限制交互规则（补 O6）

建议写入第 12 节：

```
- 硬限制下，maxLength 以「compositionend 之后的真实字符串长度」为判据。
- 合成中途（isComposing=true）允许临时超过 maxLength（拼音/假名未上屏），
  compositionend 落定后再按 maxLength 截断并触发 onChange。
- 软限制不受此约束，仅提示不截断。
```

### 6.5 onPressEnter 语义明确（补 D4）

建议第 4 节改为：

```
onPressEnter：仅在 ⌘/Ctrl+Enter 组合键时触发（提交场景）；
裸 Enter 恒为换行，不触发该事件也不可被拦截。
```

### 6.6 Ref 修正（补 D3）

```
- Ref 类型：React.Ref<HTMLTextAreaElement>
- 不使用 useImperativeHandle / 不暴露 setValue
- 可用原生 DOM 方法：focus() / blur() / select() / setSelectionRange() / scrollTo()
- 非受控取值：通过原生 name 提交或 ref.current.value 读取，不设命令式 setValue
```

### 6.7 暗色结论草案（补 M7/O3）

> 本期**不定义** Textarea 暗色规范：Token 映射表中 `--disabled` / `--subtle-foreground` / `--success` 等标注「未重声明（继承亮色）」，暗色基线本身不完整。待 Token 表补齐暗色声明后，再补暗色状态矩阵。

### 6.8 删除 `active` 状态（补 E10）

第 7 节状态矩阵删除 `active` 行（文本输入控件无 `:active` 语义）。

### 6.9 TextareaGroup 组合式规范（补 D2 / E8）

> 前提（写进正文）：原生 `<textarea>` 是 void 元素，不能包含子节点。Textarea **不提供** `prefix` / `suffix` props；前后缀与附加元素一律通过组合式 `TextareaGroup` 承载，命名与用法对齐 Input 的 `InputGroup`（D10）。

**组件清单**（单文件导出，对应 1 个 registry item）

| 组件                    | 职责                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `TextareaGroup`         | 容器，承担边框 / 圆角 / 底色与聚焦环；非「前后缀」概念，统一组合容器                                                          |
| `TextareaGroupAddon`    | 附加元素插槽（图标 / 文本 / 单位 / 按钮）；`align`：`inline-start`（前缀）/ `inline-end`（后缀）/ `block-start` / `block-end` |
| `TextareaGroupTextarea` | 组内输入框，复用 Textarea 的 size / 变体逻辑，组内去掉自身边框圆角，由容器统一承担                                            |

**关键样式联动（必须写进文档）**

- 视觉边界转移到容器：`TextareaGroup` 承担 `border` / `rounded-md` / 底色；组内输入框去边框
- 聚焦环由容器表达：`focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50`
- 错误态由容器表达：`has-[textarea[aria-invalid="true"]]:border-destructive`（同口径 3px 环 + `/20`）

**用法示例（写入第 15 节）**

```tsx
// 纯多行输入（无附加元素）—— 只用 Textarea，不引入 TextareaGroup
<Textarea placeholder="请输入问题描述" rows={4} />

// 带前缀图标
<TextareaGroup>
  <TextareaGroupAddon align="inline-start"><SearchIcon /></TextareaGroupAddon>
  <TextareaGroupTextarea placeholder="搜索" />
</TextareaGroup>
```

---

## 7. 处理顺序建议

1. **先裁决 D1–D4**（已用 AskUserQuestion 确认）：这 4 项决定跨组件一致性与 API 形态，是其余所有定义的前提。
2. **收敛色值口径**：E1 placeholder、E2 warning 橙边、E3 聚焦环 → 输出第 6.1 节实测表，warning 2.68:1 需设计裁决（加深 token 或豁免）。
3. **补三列映射表**：M1/M2/M3（状态矩阵 Tailwind、size 表、高度策略 token）。
4. **补缺失项**：M4 实测表、M6 辅助文本、M7 暗色、M8 动效；消 O1/O2（填负责人 + 回链设计稿）。
5. **修正文档错误**：E4 disabled、E5 readonly、E9 Ref、E10 active、E11 onPressEnter；落决策记录。

---

## 8. 决策记录（O1–O6 / M1–M8 裁决汇总）

全部 14 项已裁决（均采纳推荐方案，除非标注）：

| 编号    | 类型        | 议题                            | 裁决                                                                                                |
| ------- | ----------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| O1      | 未决        | 元信息（负责人 / 评审人等）待填 | 保留待填，评审阶段由 PM / 设计补                                                                    |
| O2      | 未决        | 状态矩阵「设计稿」列待补        | 保留（待补），等设计稿回链                                                                          |
| O3 / M7 | 未决 / 缺失 | 暗色规范结论                    | 本期不定义暗色（同 Input C15），写明基线不完整                                                      |
| O4 / M6 | 未决 / 缺失 | 辅助文本视觉规范                | 补 label / help / error / count 完整版式 + token（error→`--destructive`、caption→`--text-caption`） |
| O5      | 未决        | 移动端字号 vs size 冲突         | 方案 A：`<640px` 强制 16px，忽略 size（详见 5.3）                                                   |
| O6      | 未决        | IME × 硬限制 maxLength          | 采纳 6.4：合成中不截断，compositionend 后按真实长度截断                                             |
| M1      | 缺失        | 三列 Token 映射表               | 全文档补三列（figma 变量名 / tailwind / css 值）                                                    |
| M2      | 缺失        | 状态矩阵 Tailwind 表达式        | 采纳 6.2 草案（对齐 Input `ring-[3px]`/`50`、`destructive/20`）                                     |
| M3      | 缺失        | 尺寸映射表                      | 方案 A：size 管文字度量，高度交 `rows` / `autoSize`（详见 5.4）                                     |
| M4      | 缺失        | 对比度实测表                    | 采纳 6.1 实测表                                                                                     |
| M5      | 缺失        | 聚焦 / 错误 / 警告环            | 采纳：对齐 Input；warning 标 2.68:1 风险或加深 token                                                |
| M8      | 缺失        | 动效规范                        | 方案 A：补 `transition`（150ms ease-out）+ `reduced-motion` 显式关闭（详见 5.5）                    |

> 决策策略：所有待裁决项均先给方案利弊 + 推荐理由（见 5.1–5.5），再以「选项 + 自定义回答」提问，由用户拍板。
