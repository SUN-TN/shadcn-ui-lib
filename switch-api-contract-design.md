# Switch 组件 API 契约 — 设计方案（提案，未回写飞书）

> 本文件是 Switch 组件 API 契约的**设计方案（提案）**，依据飞书《组件 API 契约：Switch》模板骨架、参考《组件 API 契约：Textarea》对齐，并基于本地 `global.css` 真实 token 与 Base UI Switch 真实 API 编写。**在用户明确指示回写前，不会写入飞书文档。**
>
> **范围说明**：本文档仅包含 `Switch` 控件本身的 API 契约设计；标签 / 描述 / 校验等组合方案不在本文档范围内（独立文档或后续迭代设计）。

---

## 一、调研结论与关键决策（已与用户确认）

| 决策点    | 结论                                                                              | 依据                                                             |
| --------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| On 态配色 | 仅主色 `bg-primary`，**不引入** color/variant 维度                                | 遵循 shadcn 语义 token、用色克制；语义配色后续可作 variant 扩展  |
| 控件边界  | `Switch` 为纯控件（轨道 + 滑块）；label/描述/校验组合**不在本文档范围**           | 按用户要求本文档仅含 Switch 组件设计，保持控件纯净、与表单族对齐 |
| 滑块表达  | 纯轨道 + 滑块（shadcn 默认），**不内置** checkedIcon/uncheckedIcon 与 on/off 文字 | 首版精简；thumb 后续可作自定义 children 开放                     |
| 尺寸      | `size = small / medium / large`（medium 默认），复用 Textarea 尺寸阶梯            | 与表单族组件对齐                                                 |

### 已核实的真实事实（非假设）

- **Base UI 包名**：`@base-ui/react@^1.0.0`（非 `@base-ui-components/react`）。Switch 导入：`import { Switch } from "@base-ui/react/switch"`，使用 `Switch.Root` / `Switch.Thumb`。
- **SwitchRoot** 渲染 `<span>` + 旁边隐藏 `<input>`；`ref` 类型为 `HTMLElement`（根 span）；自带 `inputRef: React.Ref<HTMLInputElement>`。
- **props（真实）**：`checked`、`defaultChecked`、`disabled`、`readOnly`、`required`、`name`、`form`、`value`、`uncheckedValue`、`id`、`onCheckedChange:(checked, eventDetails)=>void`、`render`（ReactElement 或函数）、`nativeButton`。
- **data 属性（关键）**：Base UI 用 `data-checked` / `data-unchecked` / `data-disabled` / `data-readonly` / `data-required` 等。**注意：不是 Radix/shadcn 的 `data-state=checked`，Tailwind 选择器须用 `data-[checked]:` 等形式。**
- **error 视觉态触发**：由调用方设置 `aria-invalid`（与 Textarea 契约一致），经 `aria-invalid:` 选择器映射红色反馈环，无需依赖任何组合组件。
- **本地 token（`src/global.css`）**：`--input #D9D9D9`、`--primary #3091E1`、`--ring #3091E1`、`--background #F2F4F8`(light)/≈`#0E0E0E`(dark)、`--primary-foreground #FAFAFA`、`--destructive #FD2237`、`--disabled #D9D9D9`、`--radius 0.625rem`。Figma 变量命名沿用 Textarea 已建立的 `color/<layer>/<semantic>` 约定。
- **本地组件范式**：`button.tsx` 用 `useRender` + `render` prop + `data-slot` + `cn()`；React 19 用普通 `ref` prop（无 `forwardRef`）。新组件放 `src/shadcn-ui-lib/ui/switch.tsx`，同目录 `stories/`、`__tests__/`。`generate-registry.cjs` 会自动扫描 `ui/` 顶层 `.tsx` 生成 registry（测试文件必须放子目录，见 AGENTS.md 约束）。

### 待核对风险（回写前需确认）

- **《设计 Token 映射表》文档（wiki/N8CUw90lViYpmPkbuVrc8675nsf）在飞书 AI fetch 端点持续返回 Bad Gateway（仅 outline 轻量端点可用）**，全文未能拉取。本文档的 Figma 变量名依据 Textarea 文档已建立的 `color/<layer>/<semantic>` 约定 + `global.css` 真实 token 推导。**建议回写前对照该 Token 映射表（尤其「十三、Figma 变量结构建议」）复核 Figma 变量名与取值。**
- 暗色下 `--background` 为深值，thumb 用 `bg-background` 在 on 态主色轨道上对比度需实测（建议回写前用 WCAG 公式复核，禁止手抄近似值）。

---

## 二、Switch 组件 API 契约文档（方案全文）

# 组件 API 契约：Switch

本文档定义 Switch（开关控件）的对外 API 契约与设计要点，供设计、前端、测试三方对齐实现。所有接口条目为必须遵循的契约；标注「建议 / 推荐」的条目为设计取舍说明，不强制实现。基础交互能力（角色、键盘、表单提交、读写状态）由 Base UI Switch 保证，本组件在其之上提供尺寸变体、样式 token 映射与可控的 error 视觉态。

## 0. 元信息

- 组件名：Switch
- 分类：表单 / 数据录入（开关控件）
- 版本：v1.0.0
- 状态：草案
- 负责人：（待填）
- 设计负责人：（待填）
- 评审人：（待填）
- 最后更新：2026-09-24
- 关联文档：设计稿链接、[Token 映射表](https://kcnq8ppkkxh2.feishu.cn/wiki/N8CUw90lViYpmPkbuVrc8675nsf)、组件文档、走查记录

---

## 1. 概述

- 用途：在两种互斥状态（开 / 关）之间切换，表达即时生效的二元设置（如通知开关、功能启用、隐私选项）。
- 使用场景：设置页偏好项、功能启停、即时筛选条件、权限开关、列表行内快速切换。
- 不适用场景：多选 / 多中选一应使用 Checkbox / Radio；需要延迟生效或二次确认的操作应使用 Button / Dialog；连续数值调节应使用 Slider；纯展示布尔值应使用 Typography / Badge。

---

## 2. 设计变体映射

Switch 不像 Button 拥有视觉色板变体；其「变体」体现为**尺寸形态**。On 态统一为主色（见决策），不提供 color 维度。

| 设计变体 | Props 枚举值          | 说明                                |
| -------- | --------------------- | ----------------------------------- |
| 基础开关 | 默认（无附加能力）    | 标准轨道 + 滑块，off 灰、on 主色    |
| 小尺寸   | size="small"          | 紧凑轨道，适合密集列表 / 表格行内   |
| 中尺寸   | size="medium"（默认） | 标准轨道                            |
| 大尺寸   | size="large"          | 更大触控目标，适合移动端 / 重点设置 |

### 尺寸映射表（轨道 / 滑块 / 位移）

| size           | 轨道 (h×w)          | 滑块 (size)    | on 态位移 `translate-x` | 圆角         | 说明            |
| -------------- | ------------------- | -------------- | ----------------------- | ------------ | --------------- |
| small          | h-4 w-7（16×28px）  | size-3（12px） | translate-x-3（12px）   | rounded-full | 列表 / 表格行内 |
| medium（默认） | h-5 w-9（20×36px）  | size-4（16px） | translate-x-4（16px）   | rounded-full | 标准            |
| large          | h-6 w-11（24×44px） | size-5（20px） | translate-x-5（20px）   | rounded-full | 移动端 / 重点   |

> 位移计算：track 内边距 2px 两侧；travel = trackW − thumb − 4，恰好等于 translate-x-(n)（small:28−12−4=12；medium:36−16−4=16；large:44−20−4=20）。

---

## 3. Props

### 3.1 `<Switch>`（控件本体，基于 Base UI `Switch.Root` + `Switch.Thumb`）

| 名称            | 类型                                                       | 默认值   | 必填 | 受控 | 枚举 / 范围 | 说明                                                        |
| --------------- | ---------------------------------------------------------- | -------- | ---- | ---- | ----------- | ----------------------------------------------------------- |
| checked         | boolean                                                    | —        | 否   | 是   | —           | 受控选中态；传入后为受控模式                                |
| defaultChecked  | boolean                                                    | false    | 否   | 否   | —           | 非受控初始选中态                                            |
| onCheckedChange | (checked: boolean, eventDetails) => void                   | —        | 否   | —    | —           | 状态变化回调，受控模式唯一更新入口                          |
| disabled        | boolean                                                    | false    | 否   | —    | —           | 禁用，不可聚焦、不可切换                                    |
| readOnly        | boolean                                                    | false    | 否   | —    | —           | 只读，可聚焦但不可切换                                      |
| required        | boolean                                                    | false    | 否   | —    | —           | 表单必填语义标记（`aria-required`）；`*` 等视觉由调用方渲染 |
| name            | string                                                     | —        | 否   | —    | —           | 原生表单提交字段名（承载于隐藏 input）                      |
| value           | string                                                     | 'on'     | 否   | —    | —           | 开启时随表单提交的值                                        |
| uncheckedValue  | string                                                     | —        | 否   | —    | —           | 关闭时随表单提交的值（默认不提交）                          |
| id              | string                                                     | 自动生成 | 否   | —    | —           | 用于关联 label 与 aria 属性                                 |
| size            | 'small' \| 'medium' \| 'large'                             | 'medium' | 否   | —    | —           | 尺寸（轨道 / 滑块 / 位移量，见 2 节）                       |
| inputRef        | React.Ref<HTMLInputElement>                                | —        | 否   | —    | —           | 透传 Base UI 隐藏 `<input>` 的 ref                          |
| className       | string                                                     | —        | 否   | —    | —           | 样式扩展（置于基础类之后，可覆盖）                          |
| style           | CSSProperties                                              | —        | 否   | —    | —           | 内联样式扩展                                                |
| render          | React.ReactElement \| (props, state) => React.ReactElement | —        | 否   | —    | —           | Base UI 渲染组合（替代 asChild），用于换成其他元素          |
| ...rest         | —                                                          | —        | 否   | —    | —           | 透传至根 `<span>`（如 `data-*`、`aria-*`）                  |

> 注：`Switch.Thumb` 由组件内部渲染，不对外暴露独立 props；如需自定义滑块内容（图标 / 文字），后续可开放 thumb 作为 children 插槽（本期不实现，见决策）。

---

## 4. 事件

| 名称            | 触发时机                                 | 参数                             | 是否可取消 | disabled 时触发 | 说明                                           |
| --------------- | ---------------------------------------- | -------------------------------- | ---------- | --------------- | ---------------------------------------------- |
| onCheckedChange | 选中态变化（点击 / 键盘 Space / 程序化） | (checked: boolean, eventDetails) | 否         | 否              | 受控值更新入口；`eventDetails.reason` 区分来源 |
| onFocus         | 获得焦点                                 | (event)                          | 否         | 否              | 聚焦                                           |
| onBlur          | 失去焦点                                 | (event)                          | 否         | 否              | 失焦，常触发表单校验                           |
| onKeyDown       | 按键按下                                 | (event)                          | 部分       | 否              | 监听快捷键；Space 切换由 Base UI 内置          |

> 说明：Base UI Switch 原生支持 Space 键切换与开关语义，组件不重新实现键盘逻辑。

---

## 5. Slots / Children

| 名称                  | 类型          | 是否必需   | 说明                                                       |
| --------------------- | ------------- | ---------- | ---------------------------------------------------------- |
| Switch.Thumb          | 内置 `<span>` | 是（内部） | 滑块，基于 `data-checked` / `data-disabled` 设置位移与配色 |
| 隐藏 input            | 内置          | 是（内部） | `name` / `value` 表单提交载体                              |
| children（Switch 根） | 不推荐        | 否         | 轨道内不直接放文本 / 图标（见决策：纯轨道 + 滑块）         |

---

## 6. Ref 方法

React 19 起 `ref` 作为普通 prop 传入，不再使用 `forwardRef`：

- 根 `ref` 类型：`React.Ref<HTMLSpanElement>`（Base UI `SwitchRoot` 渲染 `<span>`，ref 为 `HTMLElement` → 用 `HTMLSpanElement`）。
- 隐藏 input 经 `inputRef` 访问（`React.Ref<HTMLInputElement>`）。
- 暴露能力：根节点聚焦 / 失焦（`focus()` / `blur()`）、节点访问。
- **不暴露命令式 toggle**：状态变更统一走 `checked` / `onCheckedChange`（受控）或 `defaultChecked`（非受控），与 Base UI 一致。

```tsx
const ref = useRef<HTMLSpanElement>(null);
<Switch ref={ref} />;
ref.current?.focus();
ref.current?.blur();
```

| 名称           | 类型                  | 说明                                   |
| -------------- | --------------------- | -------------------------------------- |
| Ref 类型（根） | Ref<HTMLSpanElement>  | 所有根节点方法经原生 span 调用         |
| focus / blur   | () => void            | 原生方法：聚焦 / 失焦                  |
| inputRef       | Ref<HTMLInputElement> | 隐藏 input 的 ref，用于表单取值 / 校验 |

---

## 7. 状态矩阵

> 配色全部取自 `src/global.css` 语义 token；Figma 变量名沿用 Textarea 已建立的 `color/<layer>/<semantic>` 约定（待对照 Token 映射表复核）。Tailwind 选择器基于 Base UI `data-*` 属性（`data-[checked]` 等，非 `data-state`）与 `aria-invalid`。

| 状态                   | 是否支持 | 视觉表现                                                            | Figma 变量名                          | Tailwind 工具类                                                                                         | 交互行为          | 设计稿 |
| ---------------------- | -------- | ------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- | ------ |
| off（default）         | 是       | 灰色轨道（`--input` #D9D9D9）+ 左侧浅色滑块（`--background`）       | color/bg/input, color/bg/background   | `bg-input` + thumb `bg-background data-[unchecked]:translate-x-0`                                       | 可点击切换        | 待补充 |
| on（checked）          | 是       | 主色轨道（`--primary` #3091E1）+ 右侧浅色滑块                       | color/bg/primary, color/bg/background | `data-[checked]:bg-primary` + thumb `data-[checked]:translate-x-4`                                      | 可点击切换        | 待补充 |
| hover                  | 暂不定义 | 同 default（光标 `cursor-pointer`）                                 | —（无新增 token）                     | `cursor-pointer`（基础类已含）                                                                          | 指针反馈          | 待补充 |
| focus（focus-visible） | 是       | 蓝色聚焦环（3px，`--ring` 50% 透明度）                              | color/border/ring                     | `focus-visible:ring-[3px] focus-visible:ring-ring/50`                                                   | 键盘 / 点击可达   | 待补充 |
| disabled（off）        | 是       | 轨道 + 滑块整体降透明度 50% + 禁用光标                              | —（opacity 50%）                      | `data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed`                                         | 不可切换 / 无指针 | 待补充 |
| disabled（on）         | 是       | 主色轨道降透明度 50% + 禁用光标                                     | —（opacity 50%）                      | `data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed`（track 仍 `data-[checked]:bg-primary`） | 不可切换          | 待补充 |
| readonly               | 是       | 同 default（无视觉差异，仅去掉切换能力；区分弱，已知风险）          | —                                     | `data-[readonly]:cursor-default`                                                                        | 可聚焦不可切换    | 待补充 |
| invalid（error）       | 是       | 红色反馈环（`--destructive` 20%）+ 轨道保持                         | color/border/destructive              | `aria-invalid:ring-[3px] aria-invalid:ring-destructive/20`                                              | 提示并阻断提交    | 待补充 |
| active / pressed       | 否       | 同 default（Switch 无按压态，thumb 不缩放）                         | —                                     | —                                                                                                       | —                 | 不适用 |
| loading                | 否       | 同 default（Switch 无内置 loading；由应用层处理或用 disabled 兜底） | —                                     | —                                                                                                       | —                 | 不适用 |

### 推荐基础类名（Switch.tsx 落地的参考实现骨架）

```tsx
// 轨道（Switch.Root, data-slot="switch"）
'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors ' +
  'bg-input focus-visible:ring-[3px] focus-visible:ring-ring/50 ' +
  'data-[checked]:bg-primary data-[unchecked]:bg-input ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ' +
  'data-[readonly]:cursor-default ' +
  'aria-invalid:ring-[3px] aria-invalid:ring-destructive/20';

// 滑块（Switch.Thumb, data-slot="switch-thumb"）
'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform ' +
  'size-4 data-[unchecked]:translate-x-0 data-[checked]:translate-x-4';
// size=small → size-3 / translate-x-3；size=large → size-5 / translate-x-5
```

---

## 8. 组合规则

| 组合                   | 是否允许 | 视觉规则                                                                         | 说明                   |
| ---------------------- | -------- | -------------------------------------------------------------------------------- | ---------------------- |
| `disabled` + `checked` | 是       | 主色轨道降透明度 50%，保持 on 但不可切换                                         | 展示已保存且禁用的状态 |
| `readOnly` + `checked` | 是       | 保持 on 主色，但不可切换                                                         | 展示已保存状态         |
| `required` + 任意态    | 是       | `required` 仅作表单语义标记（`aria-required`），不影响控件视觉；`*` 由调用方渲染 | 语义与视觉解耦         |
| `size` 与其他维度      | 是       | size 仅改尺寸，不影响 on 态主色与交互                                            | 正交维度               |

---

## 9. 可访问性

- 语义角色：Base UI `Switch.Root` 渲染 `role="switch"` + 隐藏 `<input type="checkbox" role="switch">`，原生具备 `aria-checked` 切换。
- 键盘操作：
  - Tab / Shift+Tab：进入 / 离开开关。
  - Space：切换开 / 关（Base UI 内置，无需自行绑定）。
  - 不消耗方向键。
- ARIA 属性：

| 属性                              | 取值 / 时机                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `aria-label` / 关联 `<label>`     | 无可见 label 时必备，经 `id` 关联                                  |
| `aria-checked`                    | 由 Base UI 自动维护（on/off）                                      |
| `aria-invalid`                    | 错误态为 true（由调用方传入，如表单校验失败后设置）                |
| `aria-describedby`                | 关联调用方提供的帮助文字 / 错误文案的 id                           |
| `aria-required`                   | `required` 为 true 时                                              |
| `aria-disabled` / `aria-readonly` | 对应状态为 true（Base UI 经 `data-disabled`/`data-readonly` 暴露） |

- 焦点管理：聚焦显示可见 focus ring（见状态矩阵）。
- 对比度：on 态主色轨道（#3091E1）与滑块（#F2F4F8）对比需 ≥ 3:1（图形对象，1.4.11）；暗色下 thumb `bg-background` 在深背景上的对比需实测（回写前复核）。
- 屏幕阅读器：朗读 label、必填标记与错误信息；状态变化由 `role="switch"` + `aria-checked` 自然播报。
- 减少动态效果：thumb 位移过渡应尊重 `prefers-reduced-motion`，关闭动画。

---

## 10. 响应式

| 断点    | 行为                         | 尺寸                                    | 说明           |
| ------- | ---------------------------- | --------------------------------------- | -------------- |
| < 640px | 宽度由轨道尺寸决定（非流式） | 建议 `size="large"` 提升触控目标 ≥ 44px | 移动端触控友好 |
| ≥ 640px | 随 `size` 设定               | 按设计稿                                | 桌面端         |

> Switch 为定宽控件，不随容器拉伸；响应式主要体现在触控目标尺寸建议。

---

## 11. 使用示例

### 11.1 基础（非受控）

```tsx
<Switch defaultChecked />
```

### 11.2 受控

```tsx
const [on, setOn] = React.useState(false);
<Switch checked={on} onCheckedChange={setOn} />;
```

### 11.3 尺寸

```tsx
<Switch size="small" />
<Switch size="medium" />
<Switch size="large" />
```

### 11.4 错误态（调用方设置 aria-invalid）

```tsx
<Switch aria-invalid={hasError} onCheckedChange={setOn} />
```

---

## 三、落地与回写说明（执行层面，非文档正文）

1. **新增文件**（遵循 AGENTS.md 与现有组件范式）：
   - `src/shadcn-ui-lib/ui/switch.tsx`（`Switch` 控件本体，`useRender`/`render` 组合、`data-slot`、`cn()`、React 19 普通 ref）
   - `src/shadcn-ui-lib/ui/switch.stories.tsx`（co-located，`storybook/test` 导入）
   - `src/shadcn-ui-lib/ui/__tests__/switch.test.tsx`（测试文件**必须放子目录**，避免被 `generate-registry.cjs` 误判为组件）
2. **registry 生成**：`node scripts/generate-registry.cjs` 自动扫描 `ui/` 顶层 `.tsx`，无需手改 `registry/`。
3. **回写飞书**：仅在用户明确指示后，使用 `lark-doc` 的 `+create`（新建）/ `+update`（更新区块）将本方案正文写入《组件 API 契约：Switch》wiki；**回写前必须对照 Token 映射表复核 Figma 变量名与暗色对比度**。
4. **待用户拍板的开放项**（如需扩展）：on 态语义配色 variant、thumb 图标/文字插槽、loading 态、hover 视觉定义。
