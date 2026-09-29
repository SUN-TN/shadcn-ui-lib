# 组件通用规范

**版本** v1.0（草案） ｜ **最后更新** 2026-09-28

---

## 条款分级

| 标记          | 含义                                   | 违反后果                     |
| ------------- | -------------------------------------- | ---------------------------- |
| **MUST**      | 强制，所有组件契约与实现必须遵守       | 契约不予通过                 |
| **SHOULD**    | 推荐，偏离需在契约「设计决策」写明理由 | 评审时需说明                 |
| **MAY**       | 可选，按组件类型自定                   | 无                           |
| **EXCEPTION** | 已登记的例外，须在 §11 登记表有记录    | 无登记的例外按违反 MUST 处理 |

> **评估基准**：仓库内现有组件实现（含 story / test）均为**临时验证用实现，不构成规范依据**。定条款只按**客观设计合理性**，实现反向对齐规范；不得以「与现有实现一致」「改动面最小」作为论据。

> **本版状态**：条款已全部定稿，**无待裁决项**；遗留两项（异步校验细节、数组字段容器形态）见 《表单组件专项》§8.9「留 v0.2」标注。

---

## 0. 文档信息

| 项          | 内容                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 文档名      | 组件通用规范                                                                                                                             |
| 版本        | v1.0（草案）                                                                                                                             |
| 状态        | 草案，未回写飞书                                                                                                                         |
| 起草 / 更新 | 2026-09-24 / 2026-09-28                                                                                                                  |
| 上游真值源  | 《CSS Token 映射表 V1》——**Token 的值与命名以映射表为准，本规范只规定使用方式**                                                          |
| 关联文档    | 《组件库范围与 MVP 清单》（范围 / 分层 / MVP / DoD）；《Button 组件 API 契约》（横向基准，rev 1497）；《Input 组件 API 契约》（rev 226） |
| 子规范      | **《表单组件专项》**（`form-components-spec.md`）——本规范第 8 章的独立子文档，沿用 `§8.1–§8.9` 编号                                      |
| 决策来源    | 条款的决策论证与实测明细见 `form-integration-tanstack-review.md`（表单集成）与 `component-conventions-draft.md`（其余章节）              |

## 1. 适用范围与强制性

- 适用对象：本库全部组件的契约与实现。
- 条款分级：见上方「条款分级」。
- **冲突处理规则（MUST）**：本规范与单个组件契约冲突时，**以本规范为准**；确需例外者走 §11 例外登记。
- 与《CSS Token 映射表 V1》的分工：映射表管 **Token 的值与命名**，本规范管 **Token 的使用方式**。

## 2. 技术底座与运行时约定

- 无头库：**Base UI**（`@base-ui/react`），已替代 `radix-ui`。
- `asChild` **已废弃**，统一用 `render` prop（`Button` 即用 `useRender`）。
- React 19：`ref` 作为普通 prop，**不使用 `forwardRef`**。
- Tailwind v4（CSS-first，无 `tailwind.config`）。
- **无头库能力优先（MUST）**：Base UI 已内建的 **DOM / ARIA 能力**不得自行实现——受控双模式（`value` / `defaultValue` / `onValueChange`）、id 生成（`useLabelableId`）、label 关联（`Field.Label`）、`aria-describedby` 串联（`Field.Error` / `Field.Description`）、`aria-invalid` 注入、`data-*` 状态属性。
- **命令式能力约定（MUST）**：`ref` 一律指向 DOM 元素；确需命令式方法时仿 Base UI 用独立 `actionsRef`，**不占用 `ref`**。
- **表单依赖边界（MUST）**：**基础控件与 `InputGroup` 不得依赖 `@tanstack/react-form`**；只有字段集成层（`*Field` / `form-context` / `app-form`（导出 `useAppForm`）/ `form-error-summary`）封装它。控件 **MUST NOT** 接受任何表单库类型（`field` / `FieldApi` / `FormApi` …）。依据：《表单组件专项》§8.8.1 三层模型的直接推论——`shadcn add input` 只应装 `@base-ui/react`，`add input-field` 才引入表单库。
- **两层分工（MUST）**：**Base UI `Field` 管 DOM / ARIA，TanStack Form 管状态 / 校验**；二者的唯一接缝是 `Field.Root` 的 `invalid` / `touched` / `dirty` 三个 prop（Base UI 文档注释：_Useful when the field state is controlled by an external library_）。
- **校验的两条路径（MUST）**：
  - **层 1 原生路径**——基础控件置于 `Field.Root` 内、由使用方手搓表单时，走 Base UI 的 `validate` + ValidityState（§6.4 原文适用）。
  - **层 3 集成路径**——`*Field` 的校验由 TanStack Form 承担，经 `Field.Root` 的 `invalid` prop 注入（《表单组件专项》§8.9）。
  - **互斥（MUST）**：同一 `Field.Root` 上**不得**同时使用 `validate` 与外部 `invalid`——否则产生两个错误来源，且 `Field.Error` 的默认分支会读到与真实结果无关的 `validityData.state.valid`，属**静默不一致**。

## 3. 尺寸体系

### 3.1 已固化的尺寸阶梯（MUST）

| 维度        | 档位                                                          |
| ----------- | ------------------------------------------------------------- |
| `size` 枚举 | `small` / `medium` / `large`，默认 **`medium`**               |
| 高度        | **24px**（`h-6`）/ **32px**（`h-8`）/ **40px**（`h-10`）      |
| 字号        | **12px**（`text-caption`）/ **14px**（`text-body`）/ **14px** |
| 图标尺寸    | **14px**（`size-3.5`）/ **16px**（`size-4`）/ **16px**        |

- **MUST** 字号统一用《CSS Token 映射表 V1》§8 的**语义类**，**不得**再用 Tailwind 尺度类 `text-xs` / `text-sm`。语义类行高为 **1.5**（12px→18px、14px→21px），与尺度类的 1.33 / 1.43 不同，跨组件排版以 **1.5** 为准。
- **MUST** 正文与辅助说明文字同样使用语义类：`text-body`(14) / `text-caption`(12) / `text-title-md`(16) / `text-body-strong`(16 加粗) / `text-title-lg`(18)。**库内不并存第二套字号体系。**
- **MUST** 高度 / 字号 / 图标三者**联动**——选定 `size` 即同时决定三者，**不允许单独覆盖**。
- **MUST** 尺寸表须**分别列出「视觉尺寸」与「可点击区域」**两列（见 §6.10）。

### 3.2 控件圆角

> **MUST** 控件圆角统一为 **`radius/sm`（`rounded-sm`，4px）**。
> **MUST** 表面（卡片、弹层等）才用 `rounded-md` / `lg`。

依据：`--radius: 0.625rem` 阶梯下 `--radius-sm = calc(--radius / 5 * 2) = 4px`，**无需改 Token**，只改实现与契约。

### 3.3 含图标时的内边距

> **SHOULD** 控件在含图标时**收窄水平内边距**，以补偿图标自带的视觉留白。
> **MAY** 具体收窄档位由各组件契约按自身布局机制定义（flex 子项用 `has-[>svg]:px-*`；affix 绝对定位布局另议）。
> **EXCEPTION** 偏离须在组件契约「设计决策」写明理由。

依据：动因具普遍性，实现机制随布局变化，故不宜用 MUST 强加。

### 3.4 icon-only

> **MUST** `size` 枚举固定为 `small` / `medium` / `large` 三档，**不得**为 icon-only 增设尺寸档位。
> **MUST** icon-only 控件为正方形，边长 = 同档 `size` 的高度（24 / 32 / 40px）；通过**独立 prop** 表达，**不得**并入 `size` 枚举。
> **MUST** icon-only 控件提供无障碍名称（`aria-label` 或等价机制）。
> **SHOULD** 需要 `IconButton` 语义时，以薄封装复用 Button 的 variant 体系，不复制 variant 定义。

依据：`size`（尺度）与 icon-only（内容形态）为**正交维度**；并入同轴会导致枚举乘性增长、组合语义未定义（如 icon-only 档 + 文本子节点）、命名不对称。

### 3.5 控件内文字用映射表语义类

映射表 §8 已定义语义字号档，且已在 `src/global.css` 落地。两套写法**像素值相同，但行高不同**：

| 档位                | Tailwind 尺度类 | 行高                   | 映射表语义类   | 行高           | Figma 变量     |
| ------------------- | --------------- | ---------------------- | -------------- | -------------- | -------------- |
| small 档 12px       | `text-xs`       | 1rem / 16px（1.33）    | `text-caption` | **1.5 → 18px** | `text/caption` |
| medium / large 14px | `text-sm`       | 1.25rem / 20px（1.43） | `text-body`    | **1.5 → 21px** | `text/body`    |

> **MUST** 控件内文字统一用 `text-caption` / `text-body`，行高 **1.5**；**MUST NOT** 使用 `text-xs` / `text-sm`。

依据：消灭并存体系；行高 1.5 可读性更好。可行性已核实：24px 档容纳 18px ✅，32 / 40px 档容纳 21px ✅。

### 3.6 本节开放项

- **非标值登记方式**：`underlined` 类「圆角 0」如何登记——非标值须在 Figma 变量列显式标注。
- **触控目标下限**：WCAG 2.2 SC 2.5.8 最小 24px，而 `small` 档高度**恰在下限**；移动端是否允许使用该档需明确。
- **内边距的 Figma 变量**：已核实与映射表 §10 口径一致（无图标 8 / 16 / 24，带图标 6 / 12 / 16），无需修订。

## 4. 状态语言

### 4.0 状态全集

对齐《组件库范围与 MVP 清单》§7 DoD：默认 / hover / focus / active / disabled / loading / error / empty / readonly。

### 4.1 各态统一表达手段

| 态       | 统一手段                                            | 分级                     |
| -------- | --------------------------------------------------- | ------------------------ |
| default  | 基准                                                | —                        |
| hover    | 换底色 / 换描边（**禁止**整体 `opacity`）           | 见 4.2                   |
| focus    | 焦点环（口径见 §5）                                 | MUST                     |
| active   | 非颜色手段（位移 / 缩放）+ 底色微调为装饰（见 4.5） | MUST（仅可点击类）       |
| disabled | token 化禁用色（见 4.3）                            | MUST                     |
| loading  | 保留尺寸占位 + 禁止交互 + 进度指示（见 4.6）        | SHOULD                   |
| error    | 描边换 `destructive` + 错误环 + 辅助文案（§5）      | MUST                     |
| empty    | 内容区占位文案（**非控件态**，仅登记，本章不约束）  | —                        |
| readonly | 弱底色 + 保留描边与焦点环（见 4.4）                 | MUST（仅适用可录入控件） |

### 4.2 hover 的必选 / 可选归属

> **MUST** 可点击 / 可操作类控件（Button 及同类）必须有 hover 反馈。
> **SHOULD** 文本录入类控件（Input / Textarea 及同类）提供轻微 hover 反馈（描边或底色变化）。
> **MAY** 录入类在契约「设计决策」写明理由后豁免 hover。
> **MUST** hover 反馈**不得**使用整体 `opacity`。
> **MUST** hover 的**主要状态指示**须达 §5.4 的 3:1；**底色 alpha 档单独不满足**——实测 `primary/90` vs `primary` = **1.21:1** → 须改用**描边**、**非颜色手段**，或与 §4.5 的 active 口径同源组合表达。
> **MUST NOT** 把「换底色 alpha 档」当作唯一指示——该手段在现有 token 阶梯下结构性不达标，与 §4.3 的 `border-disabled` 同属**死条款**。

依据：hover 是「可被操作」的预反馈，对可点击类属必需；录入类的关键态是 focus。
**实现须反向对齐**：现行 `button.tsx` 的 `hover:bg-primary/90` 仅 **1.21:1**，不满足 §5.4。

### 4.3 disabled 口径

> **MUST** 禁用态由语义 token 决定：底色 `bg-disabled`；**禁止**整体 `opacity` 降透明度方案。
> **MUST** 按 variant 分类给细则：填充类（default / destructive / secondary / outline）换禁用底色与描边；纯文字类（ghost / link）仅弱化文字。
> **MUST NOT** 依赖 `border-disabled` 传达禁用态——`--disabled` 与 `--border` **同值 #D9D9D9**，描边压在同色底色上实测 **1.00:1，完全不可见**，写上即为死代码。
> **SHOULD** 禁用态**省略描边**（由底色 + 弱化文字表达）；确需轮廓者，须在组件契约中显式说明所用档位并给出实测对比度。
> **MUST** 禁用态文字使用弱化前景 token；实测参考：`#666666` on 禁用底 = 4.07:1，`#333333` = 8.95:1，`#999999` = **2.02:1（不推荐）**。
> **MUST** 禁用态**不要求**对比度达标——WCAG 1.4.3 / 1.4.11 对 inactive 组件有豁免；但豁免须在组件契约中**显式声明依据**。

依据：token 化保证确定性、可审查、可随主题切换；整体 `opacity` 非 token 化，且描边与内容一并淡化发灰。

### 4.4 readonly 口径

> **MUST** readonly 与 default 视觉可区分。
> **MUST** readonly 与 disabled 可区分：readonly 仍可聚焦、可选中复制、会被提交，故 **MUST** 保留焦点指示，**MUST NOT** 使用禁用态配色。
> **MUST** readonly 控件**必须可聚焦**。
> **SHOULD** 表达方式：底色 `bg-muted`、描边保持、文字保持 `foreground`（内容有效，不弱化）、焦点环保留。

依据：readonly 语义是「内容有效但不可编辑」——可读、可复制、不可改，且不得与 disabled 混淆。

### 4.5 active 口径

> **MUST** **可点击 / 可操作类**控件必须有 active（按下）反馈；**录入类不单独定义 active**——其按下语义已由 focus 承担。
> **MUST** active 的**主要状态指示**用**非颜色手段**（位移 / 缩放，具体值由组件契约定），因为**底色档位在现有 token 阶梯下结构性无法达标**（见下方实测）。
> **MAY** 底色微调作为**装饰增强**，但 **MUST NOT** 作为唯一指示（§5.4）。
> **MUST NOT** 沿用「底色再加深一档」作为唯一手段——该表述在现有 token 阶梯下不可实现，属**死条款**（与 §4.3 的 `border-disabled` 同类）。

依据：WCAG 1.4.11 衡量的是**颜色对比**，形态变化（位移 / 缩放）不落入该门槛；用底色档位表达 active 则须与相邻态拉开 3:1，现有阶梯做不到。

**实测（Python，OKLab→sRGB + WCAG 相对亮度；亮色，合成到页面 `#F2F4F8`）**

| 手段                                 | 相邻档对比度                            | 判定                                                                                                                |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| alpha 档 `primary/90` → `primary/80` | **1.17:1**                              | ❌ 要达 3:1 需 alpha ≈ **0.025**（等同透明）                                                                        |
| 黑色叠加 `black/10` → `black/20`     | 1.09 → 1.20:1                           | ❌ 同源失效                                                                                                         |
| 独立深色 token（降 L）               | L=0.45 → 2.22:1；**L≤0.35 → 3.40:1 ✅** | ⚠️ 达标但代价大：`#3091E1` → `#003982`，属「一档到黑」而非「再加深一档」，且需新增 token（超出 §2 的 token 白名单） |
| 位移 / 缩放（非颜色）                | —                                       | ✅ 不落入 1.4.11 门槛                                                                                               |

### 4.6 loading 口径

> **MUST** loading 的**表达手段**须三项同时成立：**保留尺寸占位**（不得因加载而改变控件尺寸，避免布局跳动）+ **禁止交互**（`disabled` 或等价的指针 / 焦点阻断）+ **进度指示**（进度条 / 旋转指示 / 骨架）。
> **MUST NOT** 仅用整体 `opacity` 表达 loading（与 §4.2 / §4.3 同口径）。
> **MAY** 控件是否提供 loading 态由组件契约自定——本态**不是**所有控件的必需态。

> **本态与实现解耦**：本节只定义**表达手段**，不规定触发来源。**表单提交场景**下由 TanStack Form 的 `isSubmitting` 驱动——该映射写在 《表单组件专项》§8.9，不写进本节（避免把「某场景的实现」混入「态的定义」）。

## 5. 聚焦与错误指示

### 5.0 实测基线

亮色主题，环邻接页面背景 `#F2F4F8`；Python 按 WCAG 相对亮度 + alpha 合成实测。

| 环色                      | 100%      | 50%       | 达 3:1 所需最小 α |
| ------------------------- | --------- | --------- | ----------------- |
| `--ring` (#3091E1)        | 3.05:1 ✅ | 1.71:1 ❌ | **98.7%**         |
| `--destructive` (#FD2237) | 3.49:1 ✅ | 2.09:1 ❌ | **78.9%**         |

> 关键推论：`--ring` 对浅背景的对比度上限仅 3.05:1，故**任何肉眼可辨的透明档都无法达标**；`/50` 是结构性不达标，不是可调项。

### 5.1 聚焦环

> **MUST** 聚焦环统一 **3px** 宽 + **50% 不透明档**（`ring-[3px] ring-ring/50`）。
> **MUST** 该档位不满足 WCAG 1.4.11 的 3:1；**合规性须由「描边」承担**（见 5.3 / 5.4）。

### 5.2 焦点伪类归属

> **MUST** 录入类控件（Input / Textarea 及同类）使用 `:focus`——鼠标点入也必须显示焦点指示。
> **MUST** 可点击类控件（Button 及同类）使用 `:focus-visible`。

依据：录入类的焦点位置是**必要信息**（用户须知道正在哪个字段输入）；可点击类用 `:focus-visible` 可避免鼠标点击时的视觉噪音。

> **选择器等效说明**：按 CSS 规范，文本录入类**无论以何种方式聚焦**（含鼠标点入）浏览器均判 `:focus-visible` 成立，故 `focus-visible:` 前缀实现与本条意图**等效**——现状 `input.tsx` 即此情形，**无需整改**。本条约束的是「点入必须可见焦点指示」这一行为，而非选择器字面量。

### 5.3 错误指示

> **MUST** 错误态描边换 `--destructive`（100%，3.49:1 ✅），由描边承担 1.4.11。
> **MUST** 错误环统一 **3px** 宽 + **50% 不透明档**（`ring-destructive/50`，2.09:1）。
> **MUST** 组件契约须显式声明「**描边为错误态的主要指示，环为强调装饰**」，据此满足 1.4.11。

### 5.4 对比度门槛与「主要指示」原则

> **MUST** 非文本对比度 ≥ 3:1（WCAG 1.4.11）由**主要状态指示**（描边 / 底色）承担。
> **MAY** 装饰性强调（如 50% 档环）不适用该门槛，但**必须**在契约中显式声明其为装饰、并指明主要指示是什么。

### 5.5 无描边控件的焦点指示

> **MUST** 全库统一 3px / 50% 环；**MUST NOT** 引入环与控件的间隙（`ring-offset` / `outline-offset`），**MUST NOT** 为无描边控件补描边或提高环档位。

**已知风险（须随规范发布）**

1. Button 的 `default` / `secondary` / `ghost` / `link` 变体在焦点态**只有一个可见指示**——3px / 50% 环，实测 **1.71:1**，**不满足 WCAG 2.1 SC 1.4.11 的 3:1**。
2. 有描边控件（Input / Textarea / Button `outline`）**不受影响**：其 1px 描边在焦点态变为 100% `--ring`（实测 **3.05:1 ✅**），环为装饰强调。
3. 错误态同理：`aria-invalid:border-destructive` 在无描边变体上同样是死代码，错误指示亦仅剩环（实测 2.09:1 ❌）。
4. 受影响场景：键盘用户在无描边变体上定位焦点时指示偏弱，在低对比度显示器或强环境光下尤为明显。

> **后续可选整改路径（未启动）**：① 引入环与控件的间隙，使环只需与页面背景对比而可取 100%；② 无描边控件的环取 100%（实测 3.05:1 ✅）；③ 在 §11 正式登记该偏差。

**实测证据（真实 Chromium，键盘 Tab 触发 `:focus-visible`）**

| 元素                       | 聚焦后 border 宽度 | border 颜色               | box-shadow 环层    | 可见的焦点指示                |
| -------------------------- | ------------------ | ------------------------- | ------------------ | ----------------------------- |
| Button `default`（无描边） | **0px**            | 已变 ring 色但宽 0 不可见 | `…/0.5) 0 0 0 3px` | **仅 3px 50% 环 = 1.71:1 ❌** |
| Button `outline`（有描边） | 1px                | ring 色 ✅                | `…/0.5) 0 0 0 3px` | 1px 描边 **3.05:1 ✅** + 环   |
| Input（有描边）            | 1px                | ring 色 ✅                | `…/0.5) 0 0 0 3px` | 1px 描边 **3.05:1 ✅** + 环   |

> 机制依据：Tailwind v4 preflight 对 `*` 设 `border: 0 solid` → 全局 border-width = 0；`button.tsx` 基础类只有 `focus-visible:border-ring`（**只设颜色、不设宽度**），border 宽度类仅出现在 `outline` 变体。故无描边变体上该声明不产生可见效果——**不影响环的渲染**（环走 box-shadow）。
>
> 叠加事实：`--ring` 与 `--primary` **同值**（`#3091E1`，两个独立 token），故在 `default`（primary 填充）按钮上 100% 环与按钮底色同色；`/50` 因更浅反而可辨，但代价即 1.71:1。

### 5.6 全库对比度实测与已知偏差

**结论：保持现有设计**——不改任何 Token 值，全部按「已识别的已知偏差」登记并随规范发布；Token 整改另立议题，不阻塞本规范。

| #   | 场景                                                       | 实测       | 门槛                  | 判定 | 处理           |
| --- | ---------------------------------------------------------- | ---------- | --------------------- | ---- | -------------- |
| C1  | 填充按钮文字 `--primary-foreground` #FCFCFC on `--primary` | 3.27:1     | 1.4.3 正文 **4.5:1**  | ❌   | §11 登记 EX-01 |
| C1' | #FCFCFC on `--destructive` #FD2237                         | 3.75:1     | 4.5:1                 | ❌   | §11 登记 EX-01 |
| C2  | **默认态**描边 `--border` / `--input` #D9D9D9 vs 页面      | 1.28:1     | 1.4.11 非文本 **3:1** | ❌   | §11 登记 EX-02 |
| C3  | 禁用态描边 `--disabled` #D9D9D9 on 禁用底 `--disabled`     | **1.00:1** | —（完全不可见）       | ❌   | 见 §4.3 注     |
| C4  | `--secondary` / `--muted` #F0F0F0 填充面 vs 页面           | **1.03:1** | 1.4.11 **3:1**        | ❌   | §11 登记 EX-03 |

**补充实测值**

| 组合                                                                                  | 实测        | 门槛 | 判定  |
| ------------------------------------------------------------------------------------- | ----------- | ---- | ----- |
| 正文 `--foreground` #333333 on 页面                                                   | 11.47:1     | 4.5  | ✅    |
| 弱化文字 `--muted-foreground` #666666                                                 | 5.21:1      | 4.5  | ✅    |
| placeholder / `--subtle-foreground` #999999                                           | 2.59:1      | 4.5  | ❌    |
| `--ring` 100% / 50%（vs 页面）                                                        | 3.05 / 1.71 | 3.0  | ✅/❌ |
| `--destructive` 100% / 50%（vs 页面）                                                 | 3.49 / 2.09 | 3.0  | ✅/❌ |
| #FFFFFF on `--ink` #212C3C                                                            | 14.09:1     | 4.5  | ✅    |
| `--success` #3AD75C vs 页面                                                           | 1.73:1      | 3.0  | ❌    |
| `--warning` #FE660A vs 页面                                                           | 2.68:1      | 3.0  | ❌    |
| 反解：白字达 4.5:1 需底色亮度 L ≤ 0.1774（primary 现 0.2632 / destructive 现 0.2230） | —           | —    | —     |
| 反解：vs 页面达 3:1 需目标亮度 L ≤ 0.2679（#D9D9D9 现 0.6966）                        | —           | —    | —     |

**由实测得出的三条硬结论**

1. **§5.4 的「主要指示」原则只在「状态态」成立。** 有描边控件的 1px 描边在**聚焦态**变为 100% `--ring`（3.05:1 ✅），但**默认态**仍是 #D9D9D9（1.28:1 ❌）。两者是**两个独立缺口**，不可互相抵消。
2. **C1 无法通过调前景色解决**：`--primary-foreground` 已是最亮值 #FCFCFC，唯一出路是加深底色（候选 `--primary` → #1E6FB8 得 5.09:1、`--destructive` → #D91629 得 5.00:1）。`--ring` 是**独立 token**，加深 `--primary` 不影响 §5 环色数值；真正同值需同步的只有 `--chart-1` 与 `--sidebar-primary`。
3. **`secondary` 变体不得仅靠填充面建立边界**（1.03:1）：**MUST** 依赖描边或文字对比来标识控件，否则该变体在页面背景上不可识别。

## 6. 可访问性基线

> 本章「Base UI 实证」结论均取自 `node_modules/@base-ui/react@1.8.0` 源码，非凭印象。

### 6.0 合规目标与门槛

- **MUST** 合规目标等级为 **WCAG 2.1 AA**（依据：《组件库范围与 MVP 清单》§3）。
- **SHOULD** WCAG 2.2 新增项（2.4.11 焦点不被遮挡、2.5.8 目标尺寸 ≥24px、2.5.7 拖拽替代方式）尽量满足——目标等级未包含 2.2，但达标可提升体验。
- **MUST** 交付门槛对齐 MVP 清单 §7 DoD：每个组件交付前必须通过 **键盘 / 焦点 / ARIA / 对比度** 四项 a11y 检查，缺一不予通过。

### 6.1 id 生成与归属

- **MUST** 控件的 `id` 由 Base UI 统一生成与注册（`Field.Control` 内部走 `useLabelableId`，上下文为 `LabelableProvider`）；组件自身 **不得**自行生成 id，**不得**硬编码 id，**不得**建立自增计数器。
- **MUST** 允许外部传入 `id` 且不得忽略：`Field.Control` 会把 `idProp` 交给 `useLabelableId` 接管，传入值即最终值。
- **MUST** 非 `Field` 体系的独立控件需要 id 时，优先复用 Base UI 的 id 工具；确需自建须在契约「设计决策」写明理由并登记 §11。

### 6.2 label 关联

- **MUST** 表单控件的可见标签通过 `Field.Label` 提供；**MUST NOT** 用 `placeholder` 代替标签。
- **MUST** 用 `render` 把 `Field.Label` 换成**非 `<label>` 元素**时（典型场景：`Select.Trigger` / `Combobox.Trigger` 的 `<button>`），**必须**同时设 **`nativeLabel={false}`**。否则开发态报错，且原生 `htmlFor` 关联失效、还会继承 label 的指针行为（hover 联动、点击穿透）。
  > 实证：`useLabel({ native })` —— `native: true` 返回 `{ id, htmlFor: controlId, onMouseDown }`；`native: false` 返回 `{ id, onClick, onPointerDown }`，点击时走 JS `focusControl()`。
- **MUST** `Field.Control` 已自动获得 `aria-labelledby: labelId`；组件 **MUST NOT** 再手写 `aria-labelledby`。
- **MUST** 无可见标签的控件（icon-only）提供无障碍名称：`aria-label`，或 `Field.Label` 配 `sr-only`（呼应 §3.4）。

### 6.3 描述与错误文案的串联（`aria-describedby`）

- **MUST** 帮助文本走 `Field.Description`、错误文案走 `Field.Error`——二者会自动注册进 `messageIds`，由 Base UI 串到控件上。
- **MAY** 组件可安全追加自身的 `aria-describedby`（如控件自带的单位 / 格式提示）：实证 `getDescriptionProps()` 会把 `messageIds` **追加**到已有值之后，去重后空格连接，**不会覆盖**外部传入值。
- **MUST NOT** 组件自行读取并拼接 `aria-describedby` 字符串——会与上述合并逻辑重复，产生重复 id。

### 6.4 校验态与状态属性

- **MUST** 错误态由 `Field.Root` 的 `validate` / `invalid` 驱动；**MUST NOT** 由组件自行写死 `aria-invalid`。
  > 实证：`getValidationProps` 仅在 `state.valid === false && !state.disabled && !disabled` 时注入 `'aria-invalid': true`。
  > **按层落点（§2「校验的两条路径」）**：层 1 由 `validate` + ValidityState 驱动（本条原文）；层 3 由 TanStack 字段状态经 `invalid` prop 驱动（《表单组件专项》§8.9）。**两者在同一 `Field.Root` 上互斥**；无论哪条路径，`aria-invalid` 都由 Base UI 注入，组件不得手写。
- ⚠️ **由上条推出的边界（必须写进契约）**：`aria-invalid` 在 **disabled 态不会注入**——「已禁用且已被标记为无效」的字段不会向辅助技术传达 invalid 状态。确需表达须显式传 `invalid` 并在契约中说明。
- **MUST** 有效性判定优先使用 `Field.Validity` / 原生 ValidityState（`badInput` / `valueMissing` / `typeMismatch` / `tooShort` / `tooLong` / `patternMismatch` …）；**MUST NOT** 自建一套校验状态码。
  > **按层落点**：层 1 用 ValidityState（本条原文）；层 3 用 TanStack validator（自定义函数 / Standard Schema），**不消费 ValidityState**（《表单组件专项》§8.9）。
- **MUST** 必填字段同时具备**视觉必填标记**与**语义标记**（`aria-required="true"` 或原生 `required`），二者缺一不可。
  > 语义来源的落地见 《表单组件专项》§8.3。

### 6.5 键盘操作基线

- **MUST** 所有可交互控件可仅用键盘到达并操作（进入 Tab 序列、无键盘陷阱）。
- **MUST** 原生语义元素优先：可点击用 `<button>`，录入用 `<input>` / `<textarea>`。**MUST NOT** 用 `<div>` / `<span>` + `onClick` 充当可交互元素。
- **MUST** 确需用非语义元素承载交互时（如 dropzone），复用 `@hooks/shadcn-ui-lib/a11y-hooks` 的 **`useKeyActivation`**（Enter / Space），并自行补齐 `role` / `tabIndex` / 无障碍名称。
  > 该 hook 已内置三条守卫：`target !== currentTarget` 忽略（防子元素冒泡）、`repeat` 忽略（长按只激活一次）、命中时 `preventDefault`（Space 默认滚动页面）。
- **SHOULD** 触发元素已是原生 `<button>` 时**不要**叠加 `useKeyActivation`——原生 button 已在 Enter / Space 上触发 click，叠加有双触发风险。
- **MUST** 弹层类组件（Dialog / Popover / DropdownMenu / Tooltip）支持 **Esc 关闭**，关闭后焦点归还触发元素。
- **MUST** 复合控件（Tabs / Select / Menu / Combobox）的方向键与 Home / End 语义遵循 ARIA APG 对应模式；契约须逐键列出。

### 6.6 焦点管理

- **MUST** 焦点可见性遵循 §5（环 3px / 50%；伪类归属按 §5.2）。
- **MUST** 焦点顺序与 DOM 顺序一致；**MUST NOT** 使用 `tabIndex > 0` 重排顺序。
- **MUST** 模态弹层打开时焦点移入弹层、限制在弹层内（`aria-modal` + focus trap），关闭后归还触发元素。
- **MUST** disabled 控件**不可聚焦**（用原生 `disabled`，或 `aria-disabled` 时同时阻止 focus）。
- **MUST** `readonly` 控件**必须**可聚焦（呼应 §4.4）；`readonly` 与 `disabled` 在可聚焦性上的差异是二者的硬性区分点。
  > 兼容提示：Base UI 的 `focusElementWithVisible()` 用 `element.focus({ focusVisible: true })`，该选项 **Chrome 144+（2026-01）才支持**，Safari / Firefox 已支持。低版本 Chrome 会忽略该选项降级为普通 focus——不影响可聚焦性，只影响是否显示焦点环。

### 6.7 对比度门槛与豁免声明规则

- **MUST** 文本对比度 ≥ **4.5:1**（1.4.3）；「大文本」（≥18.66px 粗体或 ≥24px）≥ **3:1**。
- **MUST** 非文本对比度（控件边界、状态指示、图标、焦点指示）≥ **3:1**（1.4.11）。
- **MUST** 未达标项**必须**走 §11 例外登记，并在组件契约的「可访问性」小节显式写明四项：**未达的项 / 实测值 / 门槛 / 豁免依据**。**MUST NOT** 未声明即发布。
- **MUST** 禁用态（inactive）**不要求**对比度达标——1.4.3 / 1.4.11 对 inactive 组件有豁免；但豁免**必须**在契约中显式声明依据（呼应 §4.3）。
- 当前已登记：EX-01（填充按钮文字 3.27:1）、EX-02（默认态描边 1.28:1）、EX-03（secondary 填充面 1.03:1）、EX-04（无描边变体焦点环 1.71:1）、EX-05（placeholder 文字 2.59:1）。完整实测基线见 **§5.6**。

### 6.8 减少动态效果

- **MUST** 动效遵循 §7（时长三档 150 / 200 / 300ms；缓动见 §7.2）。
- **MUST** 所有非必要动效支持 `prefers-reduced-motion: reduce` 降级；复用 `@hooks/shadcn-ui-lib/a11y-hooks` 的 **`usePrefersReducedMotion`**。
  > 该 hook 用 `useSyncExternalStore` 实现：渲染期即可读到真值、订阅回调内不 setState、SSR 有独立快照。
- **SHOULD** 组件层用该 hook 关闭或缩短过渡；装饰性动画（骨架屏微光等）在 reduce 下停止。

### 6.9 测试基线

- **MUST** 每个组件的交付包含 a11y 断言，覆盖 DoD 四项（键盘 / 焦点 / ARIA / 对比度）。
- 落点：单元测试用 RTL + `jest-dom` 断言 `role`、`aria-*`、`aria-invalid`、键盘交互与焦点转移；**对比度以 §5.6 实测表为准，不重复计算**。
- **SHOULD** 弹层类组件额外断言：Esc 关闭、焦点归还、focus trap。

### 6.10 可点击区域

> **MUST** 所有可交互目标的**可点击区域** ≥ **24×24 CSS px**。视觉尺寸可小于该值，但可点击区域须通过 padding 或伪元素（`::before` 绝对定位扩区）补足。
> **MUST** 组件契约的尺寸表须**分别列出「视觉尺寸」与「可点击区域」**两列，不得只写视觉尺寸。
> **SHOULD** WCAG 2.2 其余新增项（2.4.11、2.5.7）尽量满足——本库目标等级仍为 **WCAG 2.1 AA**，2.5.8 不在等级内；此处是以「低成本不豁免」为由单独收紧，**非变更目标等级**。

**受影响的具体位置（须逐个核对）**

| 位置                                          | 现状                                 | 处理                                     |
| --------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| Button `small` 档（24px 高）                  | 高 24px、宽度远超 24px               | ✅ 天然达标                              |
| Button `ghost` / `link` 变体                  | 高度由内容撑开，14px 行高 = **21px** | ❌ 须补足到 24px（padding 或 `min-h-6`） |
| Checkbox / Radio / Switch 视觉框（常见 16px） | 视觉 16px                            | ❌ 须扩区到 24px（padding 或伪元素）     |
| icon-only 控件（§3.4）                        | 24 / 32 / 40px 正方形                | ✅ 天然达标                              |

> **Spacing 例外判据（澄清常见误读）**：例外条件是「以目标为中心的 24px 直径圆**不与相邻目标的圆相交**」。两个 24×24 目标并排时中心距 = `24 + gap`，只要 `gap ≥ 0` 即不相交 → **密排本身不违规**，无需为间距额外留白。

### 6.11 错误与状态播报

> **MUST** 字段级即时校验的反馈用 **`aria-live="polite"`**（排队播报、不打断当前朗读）。
> **MUST** 表单提交后的错误汇总区用 **`role="alert"`**（隐含 assertive），确保提交失败被确定播报。
> **MUST** **live region 容器必须常驻 DOM，只切换文本内容**。
> **MUST NOT** 依赖 `Field.Error` 的挂载 / 卸载来触发播报。

**依据（源码实证）**：

1. `Field.Error` **不注入任何 `role` 或 `aria-live`** —— 只注入 `id` 与 `children`，渲染为 `<div>`。**错误文案默认不会被辅助技术播报**。
2. `Field.Error` 未挂载时 **`return null`**（`enabled: mounted`）——出错前元素**不存在于 DOM**。live region 的通行要求是容器常驻、只切换内容；**后插入的 live region 在部分 AT 上不播报**，故直接给它挂 `role="alert"` 可能完全失效。

**实现形态**

| 层级         | 元素                                 | 属性                                        | 播报时机             |
| ------------ | ------------------------------------ | ------------------------------------------- | -------------------- |
| 字段级       | 常驻的错误容器（包裹 `Field.Error`） | `aria-live="polite"` + `aria-atomic="true"` | 单字段校验失败时写入 |
| 表单级汇总区 | 常驻的错误汇总容器                   | `role="alert"`                              | 提交失败时写入       |

### 6.12 a11y 自动化扫描

> **MUST** `@storybook/addon-a11y` 的扫描结果纳入组件 DoD。
> **MUST** 允许对已登记的例外做显式抑制（story 的 `parameters.a11y.config.rules`），但**每条抑制必须指向 §11 的 `EX-xx` 编号**，并在抑制处写明编号。
> **MUST NOT** 抑制未登记的规则——登记与抑制互为校验：登记了没抑制 → 扫描红；抑制了没登记 → 评审拦。
> **MUST** 对比度判定以 **§5.6 的 Python 实测表为准**，axe 结果仅作回归哨兵。

> 补充：axe 的 `color-contrast` 对**半透明前景 / 背景**判定不稳定（本库焦点环为 50% alpha），不得据 axe 结果修改实测结论。

## 7. 动效

**基准**：《组件库范围与 MVP 清单》§3 已定「动效 150 / 200 / 300ms + ease-out」。本章把它落为**可机械校验**的条款，并补齐**属性范围**与**弹层过渡**两块。

> **MUST** 时长与缓动**不新建 Token**——`@theme inline` **不新增** `--duration-*` / `--ease-*`；条款直接引用 Tailwind 原生 `duration-*` / `ease-*` 工具类。

### 7.1 时长档位与语义

| 档位     | 时长  | 语义                            | 典型场景                                                       |
| -------- | ----- | ------------------------------- | -------------------------------------------------------------- |
| **fast** | 150ms | **非位移的微变化**              | hover / 状态色 / 描边 / 阴影 / 焦点环                          |
| **base** | 200ms | **小尺寸元素的位移或尺寸变化**  | Checkbox 勾选、Switch 滑块、图标旋转、小区域折叠展开           |
| **slow** | 300ms | **大面积或跨区域的出现 / 消失** | Popover / DropdownMenu / Dialog / Tooltip / Toast 的入场与退场 |

- **MUST** 只使用上述三档；**MUST NOT** 出现档外时长（`duration-75` / `duration-500` / 任意值 `duration-[180ms]` 等）。
  > **适用域限定**：三档只管辖**常规动效**。§7.5 的 `prefers-reduced-motion` 降级场景不受本条约束——降级过渡允许 **≤100ms**（该场景语义是「压到几乎不可感知」，快于 fast 档属设计意图）。豁免**仅限**reduce 语境，不得援引为常规动效使用档外时值的依据。
- **MUST** 档位选择遵循「**面积越大、位移越远 → 时长越长**」——使视觉速度（px/ms）近似恒定。
- **SHOULD** 同一组件的入场与退场取同一档位，仅缓动方向不同（见 7.2）。
- **MUST** 在契约中**显式写出**时长类，不得依赖默认值。
  > 实证（Tailwind v4 dist）：`transitionDuration` 的 `DEFAULT` 恰为 **`150ms`**。即「不写时长」等于 fast 档——故必须显式声明，否则「无过渡」与「fast 过渡」在源码上无法区分。

### 7.2 缓动

- **MUST** **入场 / 展开**用 **`ease-out`**（`cubic-bezier(0, 0, 0.2, 1)`）——快起慢停，符合「动作到位」的直觉。
- **MUST** **退场 / 收起**用 **`ease-in`**（`cubic-bezier(0.4, 0, 1, 1)`）——慢起快走。
- **MAY** 双向对称变化（hover 进出、主题切换）用 `ease-out` 或 `ease-in-out`；择一后**在同一组件内保持一致**。
- **MUST NOT** 用 `ease-linear` 描述界面动效——仅适用于进度条、骨架屏微光等**匀速语义**的场景。

> 实证（Tailwind v4 dist）：`transitionTimingFunction` 的 `DEFAULT` 是 **`cubic-bezier(0.4, 0, 0.2, 1)`**（≈ `ease-in-out`），**不是** `ease-out`。故 **MUST** 显式写缓动类，不得依赖默认值。各档实际值：`linear` / `in` = `(0.4, 0, 1, 1)` / `out` = `(0, 0, 0.2, 1)` / `in-out` = `(0.4, 0, 0.2, 1)`。

### 7.3 属性范围（白名单）

- **MUST** 只动画化**不触发 layout 重排**的属性：`color` / `background-color` / `border-color` / `outline-color` / `text-decoration-color` / `fill` / `stroke` / `opacity` / `box-shadow` / `transform` / `filter` / `backdrop-filter`。
- **MUST NOT** 动画化触发 layout 的属性：`width` / `height` / `margin` / `padding` / `top` / `left` / `right` / `bottom` / `font-size` / `line-height`。确需尺寸变化时用 `transform: scale()`、`grid-template-rows` 过渡，或接受**无过渡的瞬时变化**。
- **SHOULD NOT** 使用 **`transition-all`**；**SHOULD** 改用裸 `transition`（默认属性列表即安全白名单）或显式属性列表。
  > 两条理由：① **无法保证上一条**——`transition-all` 会把后续任何属性变化一并纳入动画，包括无意新增的 layout 属性；② **污染测试**——`transition-all` 使过渡期间读取的计算样式返回中间值，自动化测量须等 **400–700ms** 才稳定。
  > **偏离成本**：SHOULD 的偏离**须在契约「设计决策」写明理由**。故使用 `transition-all` 的组件须逐条论证「为何无法枚举属性」。
- **SHOULD** 优先用**裸 `transition`**，或**显式枚举**实际会变的属性（`transition-[color,box-shadow]`）；**SHOULD NOT** 用 `transition-colors` 这类宽泛简写掩盖真实意图。
  > 实证（Tailwind v4 dist）：裸 `transition` 的默认属性列表为 `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter`——**不含任何 layout 属性**。故「裸 `transition` 安全、`transition-all` 不安全」有客观依据，非风格偏好。
  > **实现须反向对齐**：`button.tsx` 现用 `transition-all`（属 SHOULD 偏离，须在契约「设计决策」写明理由）；合规写法见 `input.tsx` 的 `transition-[color,box-shadow]`。

### 7.4 弹层（Popup）过渡

**Base UI 的数据属性（源码实证）**：`utils/CommonPopupDataAttributes.d.ts` 定义 `data-open` / `data-closed` / `data-starting-style` / `data-ending-style` / `data-anchor-hidden` / `data-side` / `data-align`。

> **⚠️ 与 Radix 的关键差异（静默失效风险）**：Base UI **不使用** `data-state="open" | "closed"`。所有自 shadcn 官方（Radix 版）复制的弹层样式里的 `data-[state=open]:` / `data-[state=closed]:` 选择器在本库**全部失效**——**不报错、不告警**，只是动画不发生。必须改用 `data-open:` / `data-closed:`。

- **MUST** 弹层的进入 / 离开过渡基于 **`data-starting-style`** / **`data-ending-style`**（分别表示「入场起始帧」「退场期间」），而非 `data-open` / `data-closed`——后两者在整个开 / 关期间常驻，无法表达起始帧。
- **MUST** 用 `tw-animate-css` 的 `animate-in` / `animate-out` 系列类；**MUST NOT** 自写 `@keyframes`。
  > 依据：`scripts/generate-registry.cjs` 通过 `USES_ANIMATE_RE = /\banimate-(in|out)\b/` **自动**把 `tw-animate-css` 写进条目 `devDependencies`。自写 keyframes 会绕过该自动声明，导致下游项目缺依赖。
- **MUST** 采用标准组合，契约直接引用、不自行发挥：
  - 入场：`data-[starting-style]:animate-in data-[starting-style]:fade-in-0` + 方向类（`zoom-in-95` / `slide-in-from-top-2` 等）
  - 退场：`data-[ending-style]:animate-out data-[ending-style]:fade-out-0` + 对应方向类
- **MUST** 时长与缓动按 7.1 / 7.2——弹层属 **slow 档 300ms**，入场 `ease-out`、退场 `ease-in`。
- **MUST NOT** 在退场动画期间提前卸载弹层——Base UI 已内建「保持挂载至过渡结束」（`data-ending-style` 期间元素仍在 DOM），组件不得用条件渲染摘除。

### 7.5 减少动态效果

引用 §6.8，不重复定义。补充两条：

- **MUST** `reduce` 下降级为**瞬时切换**（保留最终态、去掉过程），**MUST NOT** 因移除过渡而导致状态切换失去视觉反馈。
- **SHOULD** `reduce` 下保留 `opacity` 过渡（≤ 100ms，属 §7.1 三档的降级豁免）作为「发生了什么」的最小提示；位移与缩放类过渡应**完全移除**。

## 8. 表单组件专项

> **本章已拆分为独立子规范《表单组件专项》**（`form-components-spec.md`），沿用本章编号 `§8.1–§8.9`。
>
> **引用约定**：本规范内的 `《表单组件专项》§8.x` 指向该子规范；子规范内不带文档名的 `§x.y` 均指本规范对应章节。
>
> **本章相关但仍留在本规范的条款**：§2「表单依赖边界 / 两层分工 / 校验的两条路径」（三层模型的底座约定）· §9.4 表单库依赖声明与落点 · §9.9 断言 A16 · §10.1 / §10.3 / §10.4 / §10.6 表单文案条款。

## 9. 分发约定

**基准**：本库以 shadcn registry 形式对外分发，用户通过 `shadcn@latest add @shadcn-ui-lib/<name>` 安装。`components.json` 中的 registry 映射为
`"@shadcn-ui-lib": "https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/{name}.json"`。
本章条款**全部可由 `scripts/generate-registry.cjs` 的产物机械校验**，不作风格偏好。

### 9.1 条目命名

- **MUST** item `name` 用 **kebab-case 全小写**（`button` / `file-utils` / `theme-provider`），且与源文件名同基名（`<name>.tsx` / `<name>.ts`）。
- **MUST NOT** 使用 camelCase、下划线、大写字母或数字开头。
- **MUST** 一个条目对应**一个源文件**；多部件组件（`Select` 的 Trigger / Content / Item…）仍为**单一条目**，内部用 `data-slot` 区分（见 9.5）。

### 9.2 条目类型与落盘路径

| `type`           | 用途        | `files[].target`                     | 落到用户项目                              |
| ---------------- | ----------- | ------------------------------------ | ----------------------------------------- |
| `registry:ui`    | 组件源码    | `@ui/shadcn-ui-lib/<name>.tsx`       | `<aliases.ui>/shadcn-ui-lib/<name>.tsx`   |
| `registry:lib`   | 工具函数    | `@lib/shadcn-ui-lib/<name>.ts`       | `<aliases.lib>/shadcn-ui-lib/<name>.ts`   |
| `registry:hook`  | React hooks | `@hooks/shadcn-ui-lib/<name>.ts`     | `<aliases.hooks>/shadcn-ui-lib/<name>.ts` |
| `registry:theme` | CSS 变量    | **无 `files`**，走 `cssVars` / `css` | 写入 `components.json` 指定的 CSS 文件    |

**两个已存在的例外**（属历史约定，改动需评估下游影响）：

- `utils` 条目（`registry:lib`）的 target 为 **`@lib/utils.ts`**（不带 `shadcn-ui-lib/` 子目录）——`cn` 是通用工具，与官方 `@shadcn` 的同名 utils 路径一致。
- `theme-provider` 条目（`registry:lib`）的 target 为 **`@components/theme/theme-provider.tsx`**。

### 9.3 路径隔离

- **MUST** `registry:ui` 的 target 固定为 **`@ui/shadcn-ui-lib/<name>.tsx`**——落到用户项目的 `<aliases.ui>/shadcn-ui-lib/` **子目录**，**不是** `<aliases.ui>/<name>.tsx`。
- **理由**：与官方 `@shadcn` registry 的同名组件（`button` / `input` / `select` …）**物理隔离**，同名也互不覆盖，用户可两者共存。
- **MUST NOT** 为「更符合官方习惯」而平铺到 `<aliases.ui>/` 根——那会导致与官方组件互相覆盖，且不可逆。

### 9.4 依赖声明

- **MUST** 同仓库内部依赖（`registryDependencies`）写**绝对 URL**：
  `https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry/<name>.json`。
  > **裸名 = 官方 `@shadcn` 的同名条目**。这是**静默错误**：不报错、不告警，但会装成官方组件。这是本库最危险的一类错误。
- **MUST** 所有 `registry:ui` 条目自动携带 **`utils` + `theme`** 两个依赖（由脚本注入：`utils` 提供 `cn`，`theme` 保证「装上即设计规范生效」），契约中**无需手写**。
- **MUST** `dependencies` 只列**真实第三方 npm 包**（由脚本扫描裸 import 提取）；`react` / `react-dom` 视为使用方已有（`KNOWN_PEERS`），**不计入**。
- **MUST** 基于 Base UI 的组件，其 `dependencies` 含 **`@base-ui/react`**（由裸 import 自动提取，无需手写）。
- **MUST** 源文件内跨条目 import **只能**走以下别名前缀之一（脚本白名单 `INTERNAL_ALIAS_PREFIXES`）：
  `@/shadcn-ui-lib/ui/` · `@/lib/shadcn-ui-lib/` · `@/hooks/shadcn-ui-lib/` · `@/components/ui/`（历史遗留，保留兼容）。
  > 用其他前缀（如 `@/components/foo/`）写的跨条目依赖**不会被脚本识别**，`registryDependencies` 会**静默缺失**。
- **MUST** 依赖表单库的条目（层 3）在 `dependencies` 中声明 **`@tanstack/react-form`**——与 `@base-ui/react` 同口径。registry schema **无** `peerDependencies` 通道，只能走 `dependencies`。
- **MUST** 版本策略为 **`^1.33`**——2.0 仅 alpha；`^` 允许 1.x 内收 bug 修复。**MUST NOT** 直接声明 `2.x`。
- **MUST NOT** 非集成层条目声明 `@tanstack/react-form`（§2「表单依赖边界」）——由契约断言 **A16** 机械校验（§9.9）。
- **MUST** 契约 / 文档提示：`*Field` 与 `form-context` 必须解析到**同一份** `@tanstack/react-form`（上下文须单例），下游不得引入第二份副本。
- **MUST** 前置条目 `form-context` / `app-form`（命名裁决见《表单组件专项》§8.8.1，导出符号为 `useAppForm`）落点为 **`registry:ui`**，源文件置于 `src/shadcn-ui-lib/ui/`、扩展名 **`.tsx`**。三条硬约束叠加后只剩这一条路：
  - 只有 `ui/` **顶层 `.tsx`** 才被扫描为条目（`generate-registry.cjs` 用 `readdirSync` + `.tsx` 过滤）→ 放 `src/lib/` 的 `.ts` 文件**不成条目**，也不进 `knownItemNames`。
  - 跨条目 import 不在 `knownItemNames` 内则**静默丢弃** `registryDependencies`（`generate-registry.cjs:186-198`）→ 指向 `form-context` 的 import 无声消失，下游缺文件且无报错。
  - **A14** 断言工具条目**零 npm 依赖**（`scripts/__tests__/registry-contract.test.ts:217-224`）→ `form-context` 必须 import 表单库，**不能**登记为 `TOOL_ITEMS`。

### 9.5 数据属性 `data-slot`

- 用途：**跨组件选择器的唯一稳定锚点**。示例——`InputGroup` 需要定位内部输入框时，`has-[input[aria-invalid=true]]` 依赖「内部确实是 `<input>` 元素」这一假设；改用 `has-[input[data-slot=input][aria-invalid=true]]` 可与任意 `input` 元素区分。
- **MUST** 每个组件的**根元素**输出 `data-slot`。
- **MUST** 值**绑定 item 名**：
  - 单部件（本体）：`data-slot="<item-name>"` —— `button` / `input` / `textarea`。
  - 多部件：`data-slot="<item-name>-<part>"` —— `select-trigger` / `select-content` / `select-item`。
- **MUST NOT** 使用与 item 名无关的值（例如把 `Select` 的内容区命名为 `data-slot="content"`）。评审据此断言：「`<name>` 条目的所有 `data-slot` 必须以 `<name>` 或 `<name>-` 开头」。
- **SHOULD** 部件名优先取自**候选词表**（可新增）：

  `trigger` · `content` · `item` · `label` · `separator` · `control` · `indicator` · `viewport` · `arrow` · `icon` · `value` · `group`

  > 词表无合适词时**可新增**，但须在契约「设计决策」登记该部件名。词表是「**减少不必要的命名分歧**」的工具，不是「禁止新词」的白名单——定为 MUST 会迫使作者硬套近义词（如把 `thumb` 硬叫 `control`），反而降低可读性。

- 现状：`button.tsx` / `input.tsx` 已输出 `data-slot="button"` / `data-slot="input"`，满足本条。

### 9.6 DOM 契约：Base UI 数据属性

- **MUST NOT** 使用 **`data-state="open" | "closed"`**——Base UI 不使用该口径（详见 §7.4 的实证与静默失效风险）。
- **MUST** 弹层状态用 `data-open` / `data-closed`；过渡起始帧用 `data-starting-style` / `data-ending-style`。
- **MUST NOT** 组件自行生成 `id`、`aria-labelledby`（由 `Field.Control` / `useLabelableId` 统一接管，见 §6.1 / §6.2）。

### 9.7 `devDependencies` 自动声明

- **MUST** 源码中出现 `animate-in` / `animate-out` 时，脚本自动把 **`tw-animate-css`** 写入 `devDependencies`。
- **MUST NOT** 自写 `@keyframes` 绕过该机制（呼应 §7.4）——否则下游项目缺依赖，动效静默失效。

### 9.8 主题分发（`registry:theme`）

- `theme` 条目：`:root` → `cssVars.light`；`@theme inline` → `css["@theme inline"]`；`@custom-variant dark` → `css["@custom-variant dark"]`。
- `theme-dark` 条目：`.dark` → `cssVars.dark`，**不随组件自动安装**——避免业务项目「装个 button 就把自定义暗色冲掉」。
- **MUST NOT** 用 `cssVars.theme` 承载 `--color-*` 映射——CLI 会按变量名自动补 `--color-` 前缀，生成 **`--color-color-success`** 这类错误变量。一律走 `css["@theme inline"]`。
- **MUST** 契约 / 文档须提示：`theme` 条目为 **`overwriteCssVars = true`**，会**覆盖**业务项目 `:root` 中的同名 token。

### 9.9 生成、校验与提交

- **MUST NOT** 手工编辑 `registry/*.json`——一切由 `node scripts/generate-registry.cjs` 生成。
- **MUST** 改动以下任一位置后**立即重跑脚本并一起提交**，否则 CI drift check 失败：
  `src/shadcn-ui-lib/ui/**` · `src/lib/**` · `src/hooks/**` · `src/global.css` · `src/components/theme/**` · `scripts/generate-registry.cjs`
- **MUST** `registry/` 保持在 `.prettierignore` 中（否则落盘格式 ≠ 脚本输出，drift check 必挂）。
- **MUST** 全部条目通过 `scripts/__tests__/registry-contract.test.ts` 的断言（A1–A16，分发红线）。
- **MUST** 断言 **A16（表单依赖边界）**：非集成层条目的 `dependencies` 不得包含 `@tanstack/react-form`；判定式为条目名匹配 `/-field$/` 或在 `{form-context, app-form, form-hook, form-error-summary}` 之内（§9.4）。
  > **理由**：该边界最易在后续迭代中被无声侵蚀（例如为省事直接在 `input.tsx` import 一个表单库类型）。加一条断言即把「按需安装」的收益锁死，且失败信息直接指向成因。建议生成器侧加同名守卫，把问题拦在生成阶段而非测试阶段（现状：守卫未实现，仅测试断言）。
- **MUST NOT** 把测试文件放在 `src/shadcn-ui-lib/ui/` **顶层**——生成器用 `readdirSync(srcDir).filter(f => f.endsWith('.tsx'))` 扫描顶层，会生成 `button.test.json` 并污染 `index.json`。
- **MUST** `index.json` 的 `name` 为 `@shadcn-ui-lib`，`items` 覆盖 `registry/` 下全部条目——清单以 `registry/index.json` 为准，二者一致性由断言 **A1** 机械校验（§9.9）。本规范**不复述条目清单**，避免制造第二个会过期的真值源。

## 10. 内容与文案

**基准**：本章只管**文案的内容与结构**（写什么、多长、什么句式），不管**视觉呈现**（字号 / 颜色归 §3.5 / §5.6，位置归 《表单组件专项》§8.2）。凡与无障碍相关的要求（如「不得用 placeholder 代替 label」）在 §6 已定，本章只补充**文案侧**的理由与可校验项。

### 10.1 文案层级与长度上限

| 文案位置            | 上限        | 依据                                 |
| ------------------- | ----------- | ------------------------------------ |
| `Field.Label`       | **≤ 12 字** | 本规范新定                           |
| `placeholder`       | **≤ 20 字** | 沿用 Input 契约 rev 226              |
| `Field.Description` | **≤ 30 字** | 《表单组件专项》§8.2                 |
| `Field.Error`       | **≤ 40 字** | 《表单组件专项》§8.4，且须含修复指引 |
| 按钮 / 操作文案     | **≤ 6 字**  | 本规范新定                           |

- **MUST** 上限按「**视觉宽度折算**」计数：CJK 字符计 1，其余字符（拉丁字母 / 数字 / 空格）**每 2 个计 1**。否则 `YYYY-MM-DD` 会被当成 10 字而误判超限。
- **MUST** **校验器产出的 message 视为 `Field.Error` 文案**，同受本节上限约束；**MUST NOT** 直接透出校验库（Zod / Standard Schema 等）的默认英文消息。
- **SHOULD** 越接近用户操作焦点，文案越短（Label > Description > Error 的上限递增，按钮最严）。
- **MAY** 业务确需超限时走 §11 例外登记（如政务 / 金融场景的长标签）。

### 10.2 `placeholder` 的定位与色值

- **MUST** `placeholder` 只承载**示例性提示**（格式示例 / 简短引导）。
- **MUST NOT** `placeholder` 承载必要信息——具体指：
  - 必填标记（归 《表单组件专项》§8.3 的红色星号）；
  - 格式要求与取值范围（归 `Field.Description`，《表单组件专项》§8.2）；
  - 单位（归 `InputGroup` 的 prefix / suffix，《表单组件专项》§8.8.1）。
- **MUST NOT** 用 `placeholder` 代替 `Field.Label`（§6.2 已定，此处补充文案侧理由：**placeholder 在输入后消失**，用户随即失去字段定位线索）。
- **色值口径（保留 `--subtle-foreground` #999999 + 显式声明）**：

  > 实测 **2.59:1**（vs 页面 `#F2F4F8`）。**属已知不符合项（non-conformance），不是 WCAG 认可的豁免**——1.4.3 的豁免范围仅限「inactive 组件内文本 / 纯装饰 / 不可见文本 / 图像内文本」四类，placeholder 是**活动输入框内的文本**且承载示例信息，**不在豁免之列**。据此：
  >
  > - **MUST** 按 **EX-05** 登记（§11），并在组件契约「可访问性」小节写明四项：**未达的项 / 实测值 2.59:1 / 门槛 4.5:1 / 决策依据**（§6.7）。
  > - **MUST NOT** 沿用原契约的「按 1.4.11 图形对象 3:1 折中」论证——该论证**不成立**（2.59 < 3.0），必须删除并替换为本裁决的说明。
  > - **MUST** 配套补偿：placeholder **不得**承载必要信息（见上文两条 MUST NOT），使「placeholder 看不清」**不阻塞**填写。

### 10.3 错误文案结构

- **MUST** 结构为「**问题 + 修复指引**」两段式；缺修复指引视为不合格。

  | 判定      | 示例                                                     |
  | --------- | -------------------------------------------------------- |
  | ✅ 合格   | 「密码至少 8 位，请补充至 8 位以上」                     |
  | ❌ 不合格 | 「格式错误」「输入有误」「非法输入」——只说问题、不给动作 |

- **MUST** 内联错误（`Field.Error`）**不得**重复字段名。
  > 理由：字段身份已由 `Field.Label` 建立，且 `Field.Control` 的 `aria-describedby` 已串上错误文案——重复字段名会产生「密码：密码至少 8 位」这类视觉与听觉冗余，并挤压修复指引的 40 字预算。
  > **例外**：若某组件的错误文案**不渲染在 `Field.Root` 内**（脱离 Field 体系独立使用），本条不适用，该组件须自行在文案中补字段名，并在契约「设计决策」中显式声明该用法。
- **MUST** 汇总区（`form-error-summary`，《表单组件专项》§8.4）条目**必须**含字段名——汇总区脱离字段上下文，缺字段名则用户无法定位。
- **SHOULD** 用「陈述问题 + 祈使动作」句式；**MUST NOT** 使用反问或责备语气（「你怎么没填？」）。
- **SHOULD** 同一字段的格式要求（`Field.Description`）与错误文案（`Field.Error`）**不得逐字重复**——《表单组件专项》§8.2 已要求二者共存，逐字重复会把「共存」放大成「啰嗦」。

### 10.4 术语与句式一致性

- **MUST** 同一语义在全库使用同一措辞，对照表：

  | 语义         | 采用                       | 禁用                      |
  | ------------ | -------------------------- | ------------------------- |
  | 文本输入引导 | 请输入                     | 填写 / 键入 / 录入        |
  | 选择类引导   | 请选择                     | 请选取 / 请选中           |
  | 必填         | **红色星号**（不写文字）   | （必填）/ 必填项 / \*必填 |
  | 长度下限     | 至少 N 位                  | 不少于 N 位 / 长度需 ≥ N  |
  | 数值区间     | N–M 之间                   | 大于 N 小于 M             |
  | 格式示例     | 请按「YYYY-MM-DD」格式填写 | 格式错误                  |
  | 提交动作     | 提交                       | 送出 / 递交               |

- **MUST** 中文文案使用**全角标点**（，。、「」）；句末**不加句号**（短语式文案）。
- **MUST** 中文与半角字符混排时加**空格**（`8 位` / `20 MB` / `YYYY-MM-DD 格式`）。
- **MUST** 校验器（含 Standard Schema / Zod 等）的 message 必须为**符合本章的中文文案**，并满足 §10.1 的 `Field.Error` ≤ 40 字与 §10.3 的「问题 + 修复指引」结构。
- **MUST** 校验器返回的错误可能是**非字符串**（对象 / Standard Schema issue 数组）——归一化为展示字符串的职责归 **`*Field` 集成层**（《表单组件专项》§8.9）；业务侧不得依赖 `errors` 的原始形态。

### 10.5 数字、单位与日期

- **MUST** 数字与单位之间加空格（`8 位` / `20 MB` / `3 秒`）。
- **MUST** 日期统一 **`YYYY-MM-DD`**，时间统一 **`HH:mm`**（24 小时制）。
- **MUST** 金额带币种符号——本项目面向中文用户，默认 **`¥`**，千分位分隔（`¥1,234.00`）。
- **MUST** 数值区间用 **en dash `–`**（`1–10`），**MUST NOT** 用连字符 `-`（避免与负号混淆）。
- **SHOULD** 计量单位优先用中文（`位` / `个` / `条` / `秒`），技术单位保留英文缩写（`MB` / `KB` / `px`）。

### 10.6 错误汇总区文案

> **MUST** 计数句式为固定句式「**N 个字段需要修改**」——`N` 用**阿拉伯数字**，不写汉字数字。
> **MUST** **不处理复数**——中文无复数形态；`N=1` 时同样写「1 个字段需要修改」，不得写成「一个字段需要修改」。
> **MUST** 字段列表项**必须含字段名**（§10.3）——汇总区脱离字段上下文，缺字段名则用户无法定位。
> **MUST** 句式符合 §10.4（全角标点、句末不加句号、中半角混排加空格）。
> **MAY** 列表项文案直接取 `Field.Label` 文本，不自建第二套字段称谓。

## 11. 例外登记表

| 编号  | 适用对象                                                  | 条款                      | 例外内容                                                                      | 理由                                                                                                                                                                                                                                                                                                                                                                                                | 决策人 | 日期       |
| ----- | --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| EX-01 | 全库：填充变体（Button `default` / `destructive`）        | §6 / WCAG 1.4.3           | 填充面文字对比度 **3.27:1**（primary）/ **3.75:1**（destructive），低于 4.5:1 | 保持现有设计。`--primary-foreground` 已为最亮 #FCFCFC，唯一出路是加深底色，属品牌色变更需设计确认。整改候选：`--primary`→#1E6FB8（5.09:1）、`--destructive`→#D91629（5.00:1）；`--ring` 为独立 token 不受影响，`--chart-1` / `--sidebar-primary` 同值需同步                                                                                                                                         | 用户   | 2026-09-28 |
| EX-02 | 全库：所有有描边控件的**默认态**                          | §5.4 / WCAG 1.4.11        | 默认态描边 #D9D9D9 vs 页面 **1.28:1**，低于 3:1                               | 保持现有设计。加深 `--border` 会使全库分割线一并变重，属视觉变更需设计确认。缺陷只影响「默认态边界识别」，状态指示（聚焦 / 错误）另行达标                                                                                                                                                                                                                                                           | 用户   | 2026-09-28 |
| EX-03 | 全库：`secondary` / `muted` 填充变体                      | §4 / WCAG 1.4.11          | 填充面 #F0F0F0 vs 页面 **1.03:1**，控件边界不可识别                           | 保持现有设计。改由 MUST 条款兜底：`secondary` 变体**不得**仅靠填充面建立边界，须依赖描边或文字对比（§5.6 硬结论 3）                                                                                                                                                                                                                                                                                 | 用户   | 2026-09-28 |
| EX-04 | 全库：无描边变体的焦点 / 错误指示                         | §5.5 / WCAG 1.4.11        | 焦点环 50% = **1.71:1**、错误环 50% = **2.09:1**，低于 3:1                    | 保持现有设计 + 提示风险。受影响：Button `default` / `secondary` / `ghost` / `link`；处理路径见 §5.5                                                                                                                                                                                                                                                                                                 | 用户   | 2026-09-24 |
| EX-05 | 全库：`placeholder` 文字（`--subtle-foreground` #999999） | §6.7 / §10.2 / WCAG 1.4.3 | placeholder 文字 vs 页面 **2.59:1**，低于 4.5:1                               | 保留色值 + 显式声明。**属已知不符合项（non-conformance）**——1.4.3 的豁免仅覆盖 inactive 组件内文本 / 纯装饰 / 不可见文本 / 图像内文本，placeholder 是活动输入框内的文本，**不在豁免之列**。**必须**：① 删除原契约中不成立的「按 1.4.11 图形对象 3:1 折中」论证（2.59 < 3.0）；② 以「placeholder 不得承载必要信息」为配套补偿；③ 契约「可访问性」小节写明四项（未达的项 / 实测值 / 门槛 / 决策依据） | 用户   | 2026-09-28 |

> EX-01 / EX-02 / EX-03 同源于一个根因：**Token 的明度阶梯过浅**（页面 0.967 / 交互面 0.955 / 描边 0.885 三档彼此极近）。三条合并为一个待议整改议题《Token 明度阶梯复核》，与设计确认后再动。
