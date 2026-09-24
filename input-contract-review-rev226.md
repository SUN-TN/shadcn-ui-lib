# Input 组件 API 契约 — 复审（rev 226）+ 可拆分复用工具评估

- 评审对象：[Input 组件 API 契约](https://kcnq8ppkkxh2.feishu.cn/wiki/Ws8nw41MWiNXVNkk7gRc2UgJnBg)（docx `VxxMdrLvOosLJrxno8mcbGJvnUb`，**revision 226**，最后更新 2026-09-21）
- 真值源：`src/global.css`（最终权威）、线上《CSS Token 映射表 V1》（`HPgCdifqwoKaYSxPpSKc2Qy3nGr`，rev 894）、`references/token-v1.md`（离线快照）
- 实现基准：`src/shadcn-ui-lib/ui/input.tsx`、`registry/index.json`
- 前置评审（本文对照基线）：`input-contract-design-review.md`（rev 101）、`input-contract-gap-analysis.md`（rev 101）
- 评审依据：`.agents/skills/feishu-component-api`（铁律 1–12 / R0–R7 / 设计决策点 1–7 / 检查点 A–B）
- 评审日期：2026-09-24

---

## 1. 结论

**契约主体质量较 rev 101 有实质提升**：变体枚举已在四处对齐、尺寸数值表已补齐、Figma 变量名列已进入变体表、字号映射事实错误已更正、`prefix`/`suffix`/`asChild` 已明确移出并引入组合式 `InputGroup`。附录 A 的 9 个 token 值经逐项比对 `src/global.css`，**全部准确**（含 `--disabled` 确实存在且与 `--input` 同值 `oklch(0.885 0 0)`）。

但存在**一处契约阶段的必需产出缺失**，以及若干未闭环项：

| 级别                | 数量 | 性质                                                                                                                                                                  |
| ------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 阻塞**         | 5    | 铁律 11 未满足（缺工具清单）/ `size` 枚举两处失效 / Ref 语义自相矛盾 / §9 引用不存在的 `suffix` / **未声明技术底座（F20）**                                           |
| **P1 需裁决**       | 7    | 聚焦环与错误环口径不达标且偏离映射表 / 禁用态轮廓消失 / placeholder 达标论证不成立 / hover 无定义 / 变体边界 3:1 未裁决 / 暗色结论与仓库现状冲突 / 响应式与实现不一致 |
| **P2 结构与一致性** | 7    | 附录 B 两处悬空引用 / 附录 B 与 §8 说法冲突 / §8 组合规则覆盖不足 / 表列命名混用 / §4 冗余列 / 尺寸表缺 Figma 列 / 无交付形态章节与继承 Props 表                      |

**已裁决（2026-09-24）**：

| #      | 议题                    | 结论                                                                                                                                              |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D0** | Input 的技术底座（F20） | **Base UI `Input` + `Field` 配套（选项 3）**：Input 基于 Base UI `Input`（保持控件纯净，不内建 Field 逻辑）；`Field` 作为独立配套组件另行设计契约 |

**核心答复（用户关注点）**：契约**完全缺失**「可拆分复用工具」清单（铁律 11 / R7 未满足），且文档骨架中**没有「变更记录」章节**可供挂指向。按本契约已定义的能力推导并扣除 Base UI 内建能力后，**仍有 3 项应提取为通用复用工具**（T4 IME / T5 `fieldRings` / T6 `fieldSizeStyles`），其中 T5+T6 建议合并为 1 个独立 registry 条目；另有 T7 `inputVariants` 随组件内联分发（详见 §3）。

---

## 2. 核心发现：缺「可拆分复用工具」清单

铁律 11 规定：契约必须显式判断组件是否含可跨组件复用的模块，有则逐项列出 `工具名 / 形态 / 说明 / 复用范围`，无则写「无」——**这是契约阶段的必需产出，不是可选附录**。R7 进一步规定「复用范围」是「是否独立成 registry 条目」的判据。

**现状**：

- 全文 0–11 节 + 附录 A/B + 总结，**无任何一节承载该清单**。
- 文档骨架中**无「变更记录」章节**（`references/contract-template.md` 有），因此连「写入项目 MVP 清单并在变更记录留指向」的退路也不成立。
- 契约中已实质定义了 3 类可复用能力，却以「组件私有」形态描述，未做提取判定：
  1. §3 的「受控 / 非受控二选一，同时传以受控为准」——这是**全库表单控件的共同语义**，不是 Input 独有；
  2. §5.1 明确写 `InputGroupInput`「复用 `Input` 的变体与尺寸逻辑」——这是**已声明的跨文件共享**，但未说明如何共享、是否产生 registry 依赖；
  3. §3 `error` prop「内部转写 `aria-invalid`」+ §9 的 ARIA 清单——这是**状态 → ARIA 的归一化逻辑**，所有表单控件同构。

---

## 3. 可拆分复用工具候选清单

判定信号取自设计决策点 7（纯浏览器 API 封装 / 纯函数校验 / 数据模型与状态机 / 副作用 Hook / 通用交互 Hook / 对外契约类型 / 无状态工具函数）。

> **⚠️ 前置修正（2026-09-24 追加）**：本节初稿在**未确认技术底座**的前提下推导，导致 T1/T2/T3 被高估。底座经裁决为 **Base UI `Input` + `Field` 配套（选项 3）** 后，经 `node_modules/@base-ui/react@1.8.0` 类型与实现核实：
>
> - Base UI `Input` **已内建**受控双模式（`value` / `defaultValue` / `onValueChange`）→ **T1 降级为「视情况」**（若全库表单控件均基于 Base UI，则无需自建）。
> - Base UI `Field` **已内建** id 自动生成（`FieldControl.mjs:71` 调 `useLabelableId`）、label 自动关联（`FieldLabel.mjs` 经 `useLabel` + `LabelableContext`）、描述/错误自动串联（`FieldError` / `FieldDescription` 消费 `LabelableContext`，由 `LabelableProvider` 合并进 `aria-describedby`）、错误态（`useFieldValidation.mjs:295` 设 `aria-invalid`）→ **T2 与 T3 取消自建**，改由 `Field` 契约承担。
> - 因此实际需自建的独立条目从 4 项收敛为 **2 项（T4 / T5+T6）**，另有 T7 随组件内联。

### 3.1 汇总表

| #      | 工具名                                | 形态                 | 说明                                                                         | 复用范围                 | 建议去向                                    |
| ------ | ------------------------------------- | -------------------- | ---------------------------------------------------------------------------- | ------------------------ | ------------------------------------------- |
| T1     | `useControllableState`                | Hook                 | 受控/非受控二值归一；同时传以受控为准 + dev 告警                             | 待定                     | **降级**：Base UI `Input` 已内建（见 §3.0） |
| —      | ~~`useFieldId`~~                      | —                    | id 生成 + 派生 `errorId`/`helpId` + `aria-describedby` 拼接                  | —                        | **取消自建**：Base UI `Field` 承担          |
| —      | ~~`useFieldAria`~~                    | —                    | `{ error, disabled, readOnly, required }` → ARIA 属性包                      | —                        | **取消自建**：Base UI `Field` 承担          |
| **T4** | `useImeComposition`                   | Hook                 | 中文输入法组合态跟踪 `{ isComposing, onCompositionStart, onCompositionEnd }` | **全库通用**             | 独立成条                                    |
| **T5** | `fieldRings`                          | 常量模块             | 聚焦环 / 错误环 class 片段（含 `underlined` 例外）                           | **全库通用**             | 独立成条或并入 T6                           |
| **T6** | `fieldSizeStyles`                     | 常量模块             | `small`/`medium`/`large` → 高度 / 内边距 / 字号 / 图标尺寸                   | **全库通用**（表单控件） | 独立成条或并入 T5                           |
| **T7** | `inputVariants`                       | cva 表               | `variant × size` 的 class 生成                                               | 本组件 + `InputGroup`    | 随 `input` 内联分发                         |
| T8     | `usePrefersReducedMotion`             | Hook（**已存在**）   | 动效降级                                                                     | 全库通用                 | **复用** `a11y-hooks`                       |
| T9     | `useKeyActivation`                    | Hook（**已存在**）   | Enter/Esc 激活                                                               | 全库通用                 | **复用** `a11y-hooks`                       |
| T10    | `genUid`                              | 纯函数（**已存在**） | 非 SSR 敏感 id                                                               | 全库通用                 | **复用** `common-utils`（表单 id 须用 T2）  |
| —      | `InputHandle` + `useImperativeHandle` | —                    | `focus`/`blur`/`select`                                                      | —                        | **不建议提取，建议删除**（见 3.4）          |
| —      | `type` 枚举校验                       | —                    | 无逻辑，纯透传                                                               | —                        | **不建议提取**                              |

### 3.2 建议独立成 registry 条目的 2 项（逐条详述）

> 底座定为 Base UI 后，原 T1/T2/T3 的自建必要已被取消或降级，说明如下；需自建的独立条目收敛为 **T4（IME）** 与 **T5+T6（字段样式常量）**。

**T1 `useControllableState` —— 降级为「视情况」，非必需**

- 契约原文（§3 注）：「受控 / 非受控二选一：`value` + `onChange` 为受控；`defaultValue` 为非受控。两者同时传时以受控为准（React 会告警）。」
- **底座裁决后的事实**：Base UI `Input` 的 props 已含 `value` / `defaultValue` / `onValueChange`（`Input.d.ts:15-23`），受控双模式**由 Base UI 内建**。若全库表单控件（Input / Textarea / Select / Checkbox / Radio / Switch / NumberField / OTPField）都基于 Base UI，则无需自建该 Hook。
- **仍可能需要的场景**：仅当出现「非 Base UI 的自研复合控件」且需受控双模式时才需要。届时再立项，**当前不建**。
- 结论：**不列入本次工具清单**。

**~~T2 `useFieldId`~~ —— 取消自建，由 Base UI `Field` 承担**

- 契约 §3 的 `id`「自动生成」+ §9 的「`label` 必须关联」+「错误文本通过 `aria-describedby` 播报」，三者在底座定为 Base UI `Field` 后**全部由 Base UI 内建**，已核实：
  - `FieldControl.mjs:71` 调用 `useLabelableId` → **id 自动生成**
  - `FieldLabel.mjs` 经 `useLabel` + `LabelableContext` → **label 自动关联**（`FieldLabel.mjs:52` 的报错文案亦印证 native label association 由 Base UI 维护）
  - `FieldError.mjs` / `FieldDescription.mjs` 消费 `LabelableContext`，由 `LabelableProvider` 合并进 `aria-describedby`
- 保留的注意点：Base UI 的 id 由 `useLabelableId` 内部生成，**无需 `useId` 或 `genUid`**；契约只需声明「`id` 由 `Field` 提供，Input 自身不生成」。
- 结论：**取消自建**。

**~~T3 `useFieldAria`~~ —— 取消自建，由 Base UI `Field` 承担**

- 契约 §3 `error` prop「内部转写 `aria-invalid`」与 §9 的 ARIA 清单，同样由 Base UI 内建：
  - `useFieldValidation.mjs:295` 设置 `'aria-invalid': true`
  - `Field.Root` 提供 `invalid` / `dirty` / `touched` 三个外部受控 prop（`FieldRoot.d.ts:100-110`），供外部校验库接管
  - `Field.Root` 的 `validate` / `validationMode` / `validationDebounceTime` 承担校验编排（`FieldRoot.d.ts:78-95`）
- **但这里暴露一个仍需裁决的新问题**：§9 承诺 `aria-required`，而 §3 Props 表**没有 `required` prop**（见 §4.3 F5）。底座为 Base UI 后，该问题应转由 `Field` 契约回答（原生 `required` 透传 + `Field.Control` 的 ValidityState），**不再需要自建 Hook**。
- 结论：**取消自建**。

**T4 `useImeComposition` —— 中文产品必需，契约完全未提**

- rev 101 评审 §5「建议新增章节」已列为 **P1（中文产品必写）**，本次契约仍**完全未提 IME**。
- 影响面：受控 `value` 在 `compositionstart` ~ `compositionend` 期间若逐字符上抛，中文候选词会被打断；`maxLength` 的计数口径在组合态下也不确定。
- 形态：`useImeComposition()` → `{ isComposing, onCompositionStart, onCompositionEnd }`；由组件在 `onChange` 中据此决定是否上抛。
- 复用范围：全库通用（Input、Textarea、SearchBar、Select 搜索框）。

**T5 / T6 `fieldRings` 与 `fieldSizeStyles` —— 消除已发生的漂移**

这两项是**同一类问题**（同一串 class 在多处重复定义），合并说明：

- **`fieldRings` 的必要性有实证**：契约中同一串 class 重复出现 ≥4 次——
  - §2 变体表注：`focus-visible:border-b-ring focus-visible:ring-0`、`aria-invalid:border-b-destructive aria-invalid:ring-0`
  - §7 focus 行：`focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`
  - §7 error 行：`aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20`
  - §5.1 联动：`focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50`、`has-[input[aria-invalid=true]]:border-destructive`
    这串 class 同时承载「环宽度 + 透明档 + underlined 例外」三个易漂移维度。E5/E6（透明档未定义）在 rev 101 被提出后，本次虽补上了 `/50` 与 `/20`，但**数值本身不达标**（见 §4.2）——集中定义才能一处修正、全局生效。
- **`fieldSizeStyles` 的必要性同样有实证**：`size` 枚举在本文档中**已发生漂移**——§2/§3 定为 `small`/`medium`/`large`，而 §11 使用示例写 `size="lg"`、§10 响应式写 `size="default"`（见 §4.1 F2）。这正是「枚举散落在多处」的直接后果。
- 两者与 Button 契约的聚焦环口径（`ring-[3px]`）以及映射表「落地规则」（`focus:ring-2`）的三方关系，也需要一个单一出处来收敛（见 §4.2）。
- 形态：纯常量模块（无 React 依赖），`全库通用`。

### 3.3 应复用既有工具的 3 项（不要重新发明）

| 既有工具                  | 位置                                    | 契约中的对应处                                                                                                                  |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `usePrefersReducedMotion` | `src/hooks/shadcn-ui-lib/a11y-hooks.ts` | §9「尊重 `prefers-reduced-motion`，focus / error 动画降级」——**已声明但无实现落点**，且 §7 状态矩阵无动效列、无 transition 定义 |
| `useKeyActivation`        | 同上                                    | §9 键盘操作 Enter 提交 / Esc 清空                                                                                               |
| `genUid`                  | `src/lib/shadcn-ui-lib/common-utils.ts` | §3 `id` 自动生成（但**表单 id 须走 T2 的 `useId`**，见 3.2）                                                                    |

> 这三项在 `registry/index.json` 中已是独立条目（`a11y-hooks`、`common-utils`），契约只需**引用**并声明 `registryDependencies`，无需新建。

### 3.4 建议不提取的 2 项

**`InputHandle` + `useImperativeHandle`（契约 §6）**

- `focus` / `blur` / `select` **三个方法原生 `HTMLInputElement` 全部已有**，React 19 下 `ref` 直接透传即可获得，再包一层 `useImperativeHandle` 是重复封装。
- rev 101 评审 3.4 已给出同一建议；仓库既有定稿决策亦为「Ref 用原生 DOM 方法」。
- 契约 §6 与 §5.1 对 ref 的描述**互相矛盾**（见 §4.1 F3），是本次最需要先裁决的点之一。
- 若确需额外能力（如 `clear()`），应保留自定义 handle **并写明理由**——当前契约未给理由。

**`type` 枚举校验**：纯透传给原生 `<input>`，无解析或校验逻辑，不构成工具。

### 3.5 分发层影响（契约缺失，需补）

1. **`inputVariants`（T7）的共享方式决定 registry 依赖**：§5.1 已声明 `InputGroupInput`「复用 `Input` 的变体与尺寸逻辑」。若该逻辑留在 `input.tsx` 内并由 `input-group.tsx` 导入，则 `registry/input-group.json` 必须写 `registryDependencies: ["<绝对URL>/input"]`——**同仓库依赖必须写绝对 URL，裸名会被解析为官方 `@shadcn` 同名组件**。
2. **`InputGroup` 的 3 组件 / 1 item 划分**：§5.1 写「单文件导出 3 个组件，对应 1 个 registry item」——与项目分发模型一致（`Button` 亦为多导出 / 单 item），此点**无需改动**。
3. **契约全文无「交付形态与 registry 约定」章节**（rev 101 评审 §5 已建议，未补）：item 名、安装命令、落盘路径 `<aliases.ui>/shadcn-ui-lib/input.tsx`、`data-slot` 命名（`input` / `input-group` / `input-group-addon` / `input-group-input`）均未定义。§5.1 只写了视觉联动，没写分发关系。
4. **`data-slot` 命名约定**属跨组件一致性约定（非工具），建议在契约中固化——`InputGroup` 的错误态选择器 `has-[input[aria-invalid=true]]` 依赖 Input 的 `aria-invalid` 约定，两者耦合需显式声明。

---

## 4. 其他审查发现

### 4.1 P0：可判定对错的问题

**F1（严重）铁律 11 未满足** — 见 §2。无工具清单，且无「变更记录」章节可挂指向。

**F2（严重）检查点 A：`size` 枚举两处失效**

| 位置                 | 声明                                  | 判定                          |
| -------------------- | ------------------------------------- | ----------------------------- |
| §2 尺寸变体表        | `small` / `medium` / `large`          | ✅                            |
| §3 Props 枚举        | `"small" / "medium" / "large"`        | ✅                            |
| §10 响应式「尺寸」列 | `size="default"`                      | ❌ **`default` 不是合法枚举** |
| §11 使用示例         | `<Input variant="ghost" size="lg" />` | ❌ **`lg` 不是合法枚举**      |

`default` / `lg` 是 rev 101 时期的旧命名（`sm`/`default`/`lg`）残留。铁律 4 要求枚举值四处完全一致，检查点 A 直接不通过。同源问题：§10 的 `size="default"` 出现 2 次。

**F3（严重）Ref 语义自相矛盾**

- §6：`ref?: Ref<InputHandle>`（**命令式句柄对象**），通过 `useImperativeHandle` 暴露 `focus`/`blur`/`select`。
- §5.1 表格：「`Input` / `InputGroupInput` 的 ref **均指向 `input` 元素**」（**原生 DOM 元素**）。

两者互斥，不可能同时成立。且 §6 与仓库既有定稿「Ref 用原生 DOM 方法」不一致。**必须先裁决**（见 §5 D1）。

**F4（严重）§9 引用契约已明确移除的 `suffix`**

- §9 键盘操作：「Esc：清空（当 `suffix` 含清除按钮时）」。
- §5 明确：「`Input` 不提供 `prefix` / `suffix` / `asChild`……前后缀与附加元素一律通过组合式 `InputGroup` 承载」。

rev 101 评审 3.7 已提出同一问题，未修。且「Esc 清空」依赖的能力（`clearable` / 清除按钮）在 §3 Props 与 §5 Slots 中**均未定义**。

**F20（严重，前置）契约未声明底层无头库，且与仓库底座不一致**

- 契约全文**0 处**提及 `Base UI` / `base-ui` / `radix` / `render prop` / `useRender`；仅 2 处提到 `asChild`（均为「不提供」）；§1 写「无硬依赖」；§5 写「命名与用法对齐 **shadcn 官方**」；§9 写「渲染原生 `<input>`」。
- 仓库事实：`AGENTS.md` 明确「无头库 = **Base UI**（`@base-ui/react`）——替代原 `radix-ui`；`Button` 用原生 `render` prop 组合（`asChild` 已移除）」；`package.json` 声明 `"@base-ui/react": "^1.0.0"`，实际安装 **1.8.0**。
- 影响：契约把 Input 描述为**纯原生 `<input>` 包装**，与仓库既有底座脱节。这不是文字瑕疵——它直接决定 ref 语义（F3）、受控双模式是否自建、id/ARIA 是否自建（§3 工具清单规模），以及是否应提供 `render` prop 与 `onValueChange`。
- **裁决结果（2026-09-24）**：底座定为 **Base UI `Input` + `Field` 配套（选项 3）**。契约需新增「技术底座」声明，并据此重写 §3 受控说明、§6 Ref、§9 a11y，以及 §5 的「对齐 shadcn 官方」表述（应为「与 Base UI 底座一致，命名对齐 shadcn 习惯」）。

### 4.2 P1：对比度实测（禁止手抄，全部按 WCAG 公式实测）

页面底 `#F2F4F8`，白色 `#FFFFFF`。实测结果：

| 项                                         | 合成色    | 对比度      | 阈值 | 判定 |
| ------------------------------------------ | --------- | ----------- | ---- | ---- |
| 正文 `#333333` / 页面                      | `#333333` | **11.47:1** | 4.5  | ✅   |
| placeholder `#999999` / 页面               | `#999999` | **2.59:1**  | 4.5  | ❌   |
| placeholder `#999999` / 白底               | `#999999` | 2.85:1      | 4.5  | ❌   |
| placeholder `#666666` / 页面               | `#666666` | **5.21:1**  | 4.5  | ✅   |
| disabled 文字 `#666666` / 禁用底 `#D9D9D9` | `#666666` | **4.07:1**  | 4.5  | ❌   |
| `outline` 描边 `#D9D9D9` / 页面            | `#D9D9D9` | **1.28:1**  | 3.0  | ❌   |
| `filled` 底 `#F0F0F0` / 页面               | `#F0F0F0` | **1.03:1**  | 3.0  | ❌   |
| `ghost`（无描边无底）                      | —         | **1.00:1**  | 3.0  | ❌   |
| 聚焦环 `#3091E1` 100% / 页面               | `#3091E1` | **3.05:1**  | 3.0  | ✅   |
| 聚焦环 `#3091E1` **50%** / 页面            | `#91C2EC` | **1.71:1**  | 3.0  | ❌   |
| 错误环 `#FD2237` 100% / 页面               | `#FD2237` | **3.49:1**  | 3.0  | ✅   |
| 错误环 `#FD2237` **20%** / 页面            | `#F4CAD1` | **1.34:1**  | 3.0  | ❌   |

**F5（严重）§7 `empty` 行的达标论证不成立**

契约原文：「仅显示 placeholder 提示文字（实测 **2.59:1**，未达 4.5:1 正文标准，按 **1.4.11 图形对象 3:1 折中**）」。

- 实测确认 2.59:1 无误。
- **但 2.59 < 3.0**——1.4.11 的 3:1 门槛**同样不达标**，因此「按 1.4.11 折中」这一论证不成立。
- 若选 `--muted-foreground` `#666666` 则 5.21:1 达标（rev 101 评审 E3 已给出该建议，本次仍保留 `--subtle-foreground`）。

**F6（严重）聚焦环 / 错误环口径不达标，且偏离映射表落地规则**

- 实测：`ring-ring/50` = **1.71:1**、`ring-destructive/20` = **1.34:1**，均低于 1.4.11 的 3:1；100% 档才达标（3.05:1 / 3.49:1）。
- 线上《CSS Token 映射表 V1》（rev 894）「落地规则」的示例为：

  ```tsx
  // 聚焦环
  <input className="rounded-md border border-input ring-ring focus:ring-2" />
  ```

  即规范口径是 **`focus:ring-2`（2px）+ 无透明档**；契约用的是 **`ring-[3px]` + `/50`**，宽度与透明档**双重偏离**。

- 这与 rev 101 评审的更正结论（`ring-2` 符合规范示例，是 Button 的 `ring-[3px]` 偏离）方向相反——本次 Input 采用了 Button 的偏离值，**Input 从合规变为不合规**。
- 结论：`ring-[3px]` 与 `/50` `/20` 三个数值需要**一次统一裁决**，并同时决定是否回写 Button 契约与映射表。这正是 T5 `fieldRings` 应集中定义的理由。

**F7 禁用态轮廓消失（已知但未闭环）**

契约 §7 自述「描边与底同为 `#D9D9D9`，轮廓消失」。已核实 `src/global.css` 中 `--disabled: oklch(0.885 0 0)` 与 `--input: oklch(0.885 0 0)` **确为同值**。rev 101 评审 E4 已提出，未裁决。附带：禁用文字实测 4.07:1，低于 4.5:1（WCAG 1.4.3 对 inactive 组件有豁免，但契约未声明豁免）。

**F8 变体边界 3:1 未裁决（E1 遗留）**

三个变体在页面底上均不构成可辨识边界（1.28 / 1.03 / 1.00:1）。本次契约**不再声称「满足 WCAG AA」**（较 rev 101 是改进），但也**未给出结论**——既未改 token，也未声明「边界豁免 1.4.11」。附录 B 与总结均无该议题的记录。

### 4.3 文档内部矛盾与结构缺失

**F9 附录 B 两处悬空引用**

- §7 `readonly` 行：「（与可编辑态区分弱，**已知风险，见附录 B**）」→ 附录 B 只有 3 条 FAQ（loading / error+disabled / 暗色），**无 readonly 条目**。
- §7 `empty` 行：「（……**见附录 B**）」→ 附录 B **无对比度条目**。

**F10 附录 B 与 §8 说法冲突**

附录 B 写「本契约默认『错误优先』存在歧义，**已在『组合规则』标记需设计确认**」；但 §8 组合规则仅 3 行，**没有任何「需设计确认」标记**。

**F11 §8 组合规则覆盖严重不足**

现仅 3 行：`filled`+`error`、`ghost`+`disabled`、`error`+`disabled`。按阶段 5 的 7 类规则结构（覆盖类 / 继承类 / 互斥类 / 跨 preset 等价 / 常用组合 / 状态叠加 / 警告类），**仅覆盖「状态叠加」一类**。明确缺失：

- `underlined` + `focus` / + `error`——§2 的注里已定义规则，却未进 §8；
- `filled` + `focus`、`ghost` + `error`、`error` + `readOnly`、`readOnly` + `disabled`；
- `size` + Addon 图标尺寸的联动；
- `variant` + `error` 的描边/底色保留关系（仅 `filled` 一行）。

**F12 表列命名混用（A.2 明确警告的反模式）**

| 表          | 现用列名       | A.2 标准列名      |
| ----------- | -------------- | ----------------- |
| §2 变体表   | `Figma 变量名` | `Figma 变量名` ✅ |
| 附录 A      | `CSS 变量`     | `Figma 变量名` ❌ |
| §7 状态矩阵 | `视觉表现`     | `视觉效果` ❌     |

A.2 要求「视觉展示表统一列 `视觉效果` / `Figma 变量名` / `Tailwind 工具类` / `设计稿`」，并明确「两张表的列定义不要混用」。

**F13 §4 事件表冗余列**

保留「loading时触发」列，每行填「否（Input 无 loading 态）」，表下又重复注释一次。rev 101 评审 3.5 建议删除该列（Button 保留是因为 Button 确有 loading 态）。

**F14 §2 尺寸表缺 Figma 变量名列**

R1/R3 要求尺寸表按三列（`figma 变量名` / `tailwind 工具类` / `对应的 css 值`）。该表为「高度 / 水平内边距 / 圆角 / 字号 / Addon 图标」，混合了 px 值与工具类，**无 Figma 变量名**（映射表已给出 `spacing/md`、`spacing/xl`、`radius/md`、`text/caption` 等命名体系）。rev 101 评审 M1 要求补 Figma 列，变体表补了、尺寸表未补。

**F15 附录 B 暗色结论与仓库现状冲突**

契约写「当前暂不实现暗色模式，所有 Token 仅取亮色值」。但仓库现状：

- `src/global.css` 含 `.dark` 段；
- `registry/theme-dark.json` 已作为独立 registry item 发布；
- `src/shadcn-ui-lib/ui/input.tsx` 含 `dark:bg-input/30`、`dark:aria-invalid:ring-destructive/40`。

rev 101 评审 3.9 建议改为「组件随 `theme-dark` 提供中性暗色基线，暗色 token 以 `.dark` 段为准」，未修。

**F16 §10 响应式与实现不一致**

契约「`< 640px` 全宽」，实现 `w-full min-w-0` 是**无条件全宽**（不受断点影响）。需明确 `w-full` 是否为默认值、如何关闭。rev 101 评审 3.8 已提，未修。

**F17 无「继承的原生 Props」子表**

`React.ComponentProps<"input">` 的继承项（`required` / `autoComplete` / `inputMode` / `pattern` / `min`/`max`/`step` / `autoFocus` / `form`）未列。与 F5（§9 承诺 `aria-required` 但无 `required` prop）直接相关——Button 契约有 2.6 节专列继承项，Input 无。

**F18 §9 ARIA 命名不规范**

§9 写「`aria-disabled` / `readonly`」——`readonly` 大小写错误，应为 `readOnly`（React prop）或 `aria-readonly`（ARIA 属性），两者语义不同，不可混写。

**F19 总结措辞**

总结写「错误态、禁用、只读、**前后缀复合输入**均已定义」——但 §5 明确 Input 不做前后缀，前后缀属 `InputGroup`。措辞需改为「前后缀复合输入由 `InputGroup` 承载」。

### 4.4 已修复项（相对 rev 101，应予确认）

| rev 101 问题                                | 本次状态                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| E9 / 2.3 变体枚举三处不一致（3 个 vs 4 个） | ✅ Props 枚举已含 `underlined`，总结改为「四类视觉变体」       |
| M1 缺尺寸数值表                             | ✅ §2 已补（高度 / 内边距 / 圆角 / 字号 / Addon 图标）         |
| M2 全文无 Figma 变量名                      | ✅ §2 变体表已含（尺寸表与状态矩阵部分，见 F14）               |
| E8 / 3.2 附录 A 字号「0.625rem」事实错误    | ✅ 已更正为 `--text-caption` / `--text-body`                   |
| 3.3 `asChild` 与 void 元素冲突              | ✅ 已明确移除                                                  |
| 3.6 `underlined` 行 Markdown 渲染错列       | ✅ 已修                                                        |
| E3 placeholder「二选一」留给实现方          | ✅ 已收敛为单一值 `--subtle-foreground`（但该值不达标，见 F5） |
| E5 / E6 环透明档未定义                      | ⚠️ 已定义（`/50`、`/20`），但数值不达标且偏离映射表（见 F6）   |
| 铁律 3 token 值准确性                       | ✅ 附录 A 9 项全部与 `src/global.css` 一致                     |
| 变体边界 3:1 声称与冲突                     | ⚠️ 已移除「满足 AA」的声称，但未给结论（见 F8）                |

---

## 5. 待裁决决策（给方案 + 推荐，不替用户硬定）

### D1 Ref 语义（F3，阻塞）— 底座裁决后已收敛

**底座裁决（D0 = 选项 3：Base UI `Input` + `Field`）使本项的答案基本唯一**，因为 Base UI 自身给出了明确惯例：

| 证据                   | 内容                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `Input.d.ts:10`        | `React.RefAttributes<HTMLElement>` → **ref 指向 DOM 元素**                                     |
| `FieldControl.d.ts:16` | `RefAttributes<HTMLElement>` → 同上                                                            |
| `FieldRoot.d.ts:115`   | `actionsRef?: RefObject<FieldRoot.Actions>` → **命令式能力走独立 `actionsRef`，不占用 `ref`**  |
| Button 契约 rev 1497   | 「Button **不暴露任何自定义命令式方法，ref 仅指向 DOM 元素**」；`useImperativeHandle → 未使用` |
| `button.tsx:44-48`     | `ref` 直接进 `useRender`，无 `useImperativeHandle`                                             |

| 方案                            | 说明                                                                        | 与 Base UI 底座                              | 与 Button 契约 | 实现成本     |
| ------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------- | -------------- | ------------ |
| **A. 原生 DOM ref（推荐）**     | `ref?: React.Ref<HTMLInputElement>`，直接透传                               | ✅ 一致                                      | ✅ 一致        | 0            |
| B. 保留 `InputHandle`           | `useImperativeHandle` 暴露 3 方法                                           | ❌ **反向**（Base UI 专门另开 `actionsRef`） | ❌ 冲突        | 需包装层转换 |
| C. 原生 ref + `actionsRef` 预留 | A 之上，未来命令式能力仿 Base UI 用 `actionsRef` 而非 `useImperativeHandle` | ✅ 一致                                      | ✅ 一致        | 0            |

**推荐 A**（若需为未来 `clear()` 留通道，则取 C 的表述）。三条理由：① 三个方法原生全有，且原生 ref 暴露的能力是**严格超集**；② Base UI 与 Button 契约**两方都指向 DOM ref**，方案 B 是双重偏离；③ 零实现成本——`input.tsx` 当前就是原生透传。

**连带改动**：§6 重写为对齐 Button 契约的形态（`Ref 类型` / `forwardRef 未使用` / `useImperativeHandle 未使用` + 常用 DOM 方法示例表）；§11 示例的 `useRef<InputHandle>` → `useRef<HTMLInputElement>`；§5.1 **无需改动**。

### D2 聚焦环 / 错误环口径（F6，阻塞）

| 方案                       | 说明                                                    | 优点                                                     | 缺点                                     |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| **A. 对齐映射表（推荐）**  | `focus:ring-2` + `ring-ring`（无透明档）；错误环用 100% | 100% 档实测达标（3.05:1 / 3.49:1）；与映射表落地规则一致 | 需同步回写 Button 契约与 `input.tsx`     |
| B. 保留 3px，透明档改 100% | `ring-[3px]` + `ring-ring`（去 `/50`）                  | 与 Button 现状一致，视觉更重                             | 宽度仍偏离映射表；需回写映射表或接受偏离 |
| C. 保留现状                | `ring-[3px]` + `/50` + `/20`                            | 无需改动                                                 | 1.71:1 / 1.34:1 均不达 1.4.11，合规风险  |

**推荐 A**：唯一同时满足对比度与映射表一致性的选项。若设计坚持 3px，则选 B 并明确记录「宽度偏离映射表」的决策依据。

### D3 placeholder 色值（F5）

| 方案                                             | 实测      | 优点                     | 缺点                                                                                                         |
| ------------------------------------------------ | --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **A. 改 `--muted-foreground` `#666666`（推荐）** | 5.21:1 ✅ | 达标；rev 101 评审已建议 | 占位与正文层级拉近（正文 `#333333`）                                                                         |
| B. 保留 `#999999` + 声明豁免                     | 2.59:1    | 层级清晰                 | 需明确声明「placeholder 视为非必要提示文本，豁免 1.4.3」，且当前「按 1.4.11 折中」的论证站不住（2.59 < 3.0） |

**推荐 A**。若选 B，必须删除现有 1.4.11 论证并改写为明确的豁免声明。

### D4 禁用态表达（F7）

| 方案                                      | 说明                 | 优点                 | 缺点                               |
| ----------------------------------------- | -------------------- | -------------------- | ---------------------------------- |
| **A. 改用 `disabled:opacity-50`（推荐）** | 与 Button 契约同口径 | 全库一致；实现已在用 | 半透明底叠页面底，需重测文字对比度 |
| B. 改 token：`--disabled` 深于 `--input`  | 禁用底独立取值       | 保留「换底色」语义   | 改 token 影响面大；需评估明度阶梯  |

**推荐 A**：与 Button 一致，且 `input.tsx` 已实现该口径（`disabled:opacity-50`），改契约即可对齐实现，改动面最小。

### D5 变体边界 3:1（F8）

| 方案                                   | 说明                                                                                                      | 优点                   | 缺点                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------- |
| A. 改 token：描边深于 `#8D8D8D`        | 实测 3.01:1 临界                                                                                          | 真正达标               | 影响全库描边；需重做明度阶梯 |
| **B. 声明豁免 + 转移视觉重量（推荐）** | 明确「边界依赖 label + placeholder + 值文本识别，豁免 1.4.11」，并把视觉重量移到 focus / hover / 已填写态 | 不改 token；可立即落地 | 需要设计与产品签字确认       |

**推荐 B**（不改 token 的前提下）。但**无论选哪个，§2 与 §7 必须写出结论**，不能留空。

### D6 工具清单的落地位置（铁律 11）

| 方案                                          | 说明                                       | 优点                        | 缺点                                         |
| --------------------------------------------- | ------------------------------------------ | --------------------------- | -------------------------------------------- |
| **A. 契约内新增一节（推荐）**                 | 在 §3 Props 之后插入「可拆分复用工具」一节 | 直接满足铁律 11；消费者可见 | 需确认上游模板是否允许增章节（铁律 1）       |
| B. 写入项目 MVP 清单 + 契约「变更记录」留指向 | 铁律 11 的退路                             | 不改模板结构                | 当前契约**无「变更记录」章节**，需先补该章节 |

**推荐 A**。若上游模板不允许增章节，则选 B 并**先补「变更记录」章节**（`contract-template.md` 本就有此章节，缺失应视为模板对齐问题）。

### D7 `Field` 配套契约的安排（D0 的连带决策）

底座定为 Base UI `Input` + `Field` 后，`Field` 需要**独立契约**（依据见下方表格）。本项裁决的是**排期与粒度**。

| 方案                              | 说明                                                          | 优点                                                              | 缺点                                                                        |
| --------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **A. 同期起草、独立评审（推荐）** | `Field` 契约与 Input 契约同期起草，但作为两份文档独立评审定稿 | Input 的 §9 a11y 有可验收的对象；接口一次对齐；仍保持各自评审节奏 | 人力投入增加                                                                |
| B. 两份契约同批评审定稿           | Input 与 Field 合并到同一评审批                               | 接口绝对一致                                                      | 范围翻倍，评审周期拉长；Input 被 Field 阻塞                                 |
| C. Input 先定稿，Field 延后立项   | 本轮只改 Input，Field 另立排期                                | 范围最小、最快                                                    | Input §9 长期「待实现」，a11y 部分无法验收；§1/§9 对 `Label` 的引用持续悬空 |

**推荐 A**：Input 契约只需在「技术底座」与「配套组件」两处写清边界声明（`id` / `aria-describedby` / `aria-invalid` 由 `Field` 提供），即可先行定稿；`Field` 契约同期起草、独立评审，避免 §9 变成不可验收的悬空承诺。

#### D7 依据：`Field` 为何必须独立契约

| 依据                       | 说明                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R0 元规则：触发域发散**  | Input 服务「单行文本输入控件」；Field 服务「表单字段容器 + 校验编排 + 可访问性串联」，已是不同领域                                                                                                                                                                                                                          |
| **API 量级不同构**         | Field 有 7 个部件（Root / Label / Description / Error / Control / Validity / Item），Root 独有 `validate` / `validationMode` / `validationDebounceTime` / `invalid` / `dirty` / `touched` / `actionsRef`（`FieldRoot.d.ts`）                                                                                                |
| **骨架不匹配**             | Input 用「组件 API 契约」骨架；Field 需「部件表 + 组合规则 + 校验状态机 + a11y 串联矩阵」                                                                                                                                                                                                                                   |
| **分发上必然独立**         | `field.json` 为独立 registry item；Input 不依赖 Field，Field 依赖 Input（作为 Control）                                                                                                                                                                                                                                     |
| **铁律 12 / A.4**          | 控件保持纯净 → Input 契约**不得**含 Field 逻辑，Field 能力必须以独立契约存在，否则「走契约外机制」变成无处定义                                                                                                                                                                                                              |
| **当前悬空引用正由它收口** | Input §1「建议配合 `Label`」、§9「`label` 必须关联」「错误文本通过 `aria-describedby` 播报」——仓库现有 UI 组件仅 `button.tsx` / `input.tsx`（**无 `Label`**），Base UI 58 个组件目录中亦**无独立 `label`**（只有 `field` / `fieldset` / `form` / `input`），Label 仅存在于 `Field.Label`。故该引用的唯一落点就是 Field 契约 |

---

## 6. 建议处理顺序

1. **裁决 D1（Ref 语义）**——阻塞项；底座（D0）已定，本项答案已收敛为方案 A。
2. **裁决 D7（Field 契约排期）**——决定 Input §9 是否有可验收对象。
3. **裁决 D2 / D3 / D4 / D5（四个色值与口径）**——集中一次会裁决，产出对比度实测表附进契约（本文 §4.2 可直接复用）。
4. **补工具清单（D6 / 铁律 11）**——底座裁决后收敛为 T4 / T5+T6 / T7 三项（见 §3.1）。
5. **修 P0 枚举与悬空引用（F2 / F4 / F9 / F10）**——纯文档修正，无设计争议，可即刻执行。
6. **补结构**：新增「技术底座」声明（F20）、§8 组合规则扩到 7 类（F11）、表列命名对齐 A.2（F12）、尺寸表补 Figma 列（F14）、新增「继承的原生 Props」表（F17）与「交付形态与 registry 约定」章节（§3.5）。
7. **补章节**：IME 处理（T4）、受控/非受控边界细则（改为对齐 Base UI `onValueChange` 口径）、校验与错误文案规范。
8. **改实现**：`input.tsx` 改为基于 Base UI `Input` 并落地 cva 变体与尺寸；`input-group.tsx` 新增；`field.tsx` 视 D7 排期；重跑 `node scripts/generate-registry.cjs` 并连带提交 `registry/*.json`；补 changeset。

---

## 附录：本次评审的核对方法

| 检查项         | 方法                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| Token 真值     | 逐项比对 `src/global.css` `:root` 段（9/9 一致）                             |
| 对比度         | Python 按 WCAG 2.x 相对亮度公式实测，含 alpha 合成；禁止手抄                 |
| 聚焦环规范口径 | 回线上《CSS Token 映射表 V1》rev 894「落地规则」代码示例核对                 |
| 枚举一致性     | 检查点 A 四处比对（Props / 变体映射 / 组合规则 / 使用示例），另加 §10 响应式 |
| 文档读取       | `lark-cli docs +fetch --doc-format markdown`（rev 226，全文 11,063 字符）    |
