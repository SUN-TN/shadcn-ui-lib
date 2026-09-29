# 表单组件专项（《组件通用规范》第 8 章）

**版本** v1.0（草案） ｜ **最后更新** 2026-09-28

---

> **本文件是《组件通用规范》的子规范**，沿用其章节编号——本文件即该规范的第 8 章。
>
> **引用约定**：
>
> - 本文件内**不带文档名**的 `§x.y`（如 §2、§6.4）**均指《组件通用规范》对应章节**。
> - 本文件内的 `§8.x` 指本文件自身。
> - 《组件通用规范》内的 `《表单组件专项》§8.x` 指向本文件。
>
> **条款分级**（MUST / SHOULD / MAY / EXCEPTION）沿用《组件通用规范》开头的「条款分级」表；**适用范围**沿用其 §1；**例外登记表**见其 §11（与表单相关：EX-04 无描边变体焦点环、EX-05 placeholder 对比度）。
>
> **与表单相关但仍留在上级规范的条款**：§2「表单依赖边界 / 两层分工 / 校验的两条路径」· §9.4 表单库依赖声明与落点 · §9.9 断言 A16 · §10.1 / §10.3 / §10.4 / §10.6 表单文案条款。

---

## 8. 表单组件专项

> **适用层**：§8.1–§8.7 对**三层均生效**；§8.8 定义分层模型；**§8.9 只约束层 3（字段集成）**——层 1 / 层 2 不得引用 §8.9（§2「表单依赖边界」）。

| 小节 | 内容                                                            |
| ---- | --------------------------------------------------------------- |
| 8.1  | **`Field` 集成**：id / label / error / description 的归属与串联 |
| 8.2  | **辅助文本体系**：label / help / error 的组合与间距             |
| 8.3  | **`required` 的视觉与语义**                                     |
| 8.4  | **校验与错误文案规范**                                          |
| 8.5  | **受控 / 非受控口径**                                           |
| 8.6  | **IME（中文输入法）**                                           |
| 8.7  | 表单组件的尺寸与状态（引用 §3 / §4）                            |
| 8.8  | **分层模型**（三层：基础控件 / 控件内组合 / 字段集成）          |
| 8.9  | **与 TanStack Form 的集成**（层 3 接缝）                        |

### 8.1 `Field` 集成

id / label / `aria-describedby` / `aria-invalid` 的技术归属已在 **§6.1–§6.4** 定义，本节只规定**组合形态**。

- **MUST** 表单类组件以 `Field.Root` 为容器组合：`Field.Label` + `Field.Control`（组件本体）+ `Field.Description` / `Field.Error`。
- **MUST** 基础控件**只处理**值 / 状态 / 尺寸 / 变体，**MUST NOT** 接受 **label / description / error** 等字段级 props，也 **MUST NOT** 产出 `required` 的视觉标记——这些属 `*Field` 集成层的职责（§8.8）。基础控件必须保持**可独立使用**（搜索框、筛选条、工具面板）。
  > 注意区分：基础控件**仍须**透传 `required` 到原生属性（§8.3）——那是校验链路的语义来源，与「视觉标记」不同。
- **MUST `name` 挂在 `Field.Root` 上，不挂 `Field.Control`**。
  > 实证：`FieldRootProps.name` 明确「优先于 `<Field.Control>` 的 `name`」；且 `Form.errors` 的键「对应 `Field.Root` 上的 `name` 属性」——挂错位置会导致服务端错误回填失效。
- **MUST** 状态（`disabled` / `invalid` / `touched` / `dirty`）由 `Field.Root` 下发，组件不得自行维护一份平行状态。
  > 实证：`FieldRootProps.disabled` 优先于 `Field.Control` 的 `disabled`；`FieldRoot.State` 含 `disabled` / `touched` / `dirty` / `valid` / `filled` / `focused`，组件可直接消费做 `data-*` 样式。
  > **按层落点**：层 1 由使用方直接向 `Field.Root` 传状态；层 3 的状态**派生自 TanStack Form**（`field.state.meta.isTouched` / `isDirty` 等），再经同名 prop 下发（§8.9）。**两层共同不变**：控件 MUST NOT 自行维护平行状态，MUST NOT 手写 `aria-invalid` / `data-*`。

### 8.2 辅助文本体系

**层级与顺序（MUST）**

```
Field.Label          ← 字段名称（必需）
Field.Control        ← 组件本体
Field.Description    ← 帮助文本（可选）
Field.Error          ← 错误文案（校验失败时出现）
```

- **MUST** 垂直顺序固定为 Label → Control → 辅助文本区；**MUST NOT** 把帮助文本放在控件上方（会破坏 Tab 后的阅读顺序）。
- **MUST** 辅助文本区与控件的间距使用 **`spacing/sm`（4px）**；多行辅助文本之间同上。
- **MUST** 帮助文本与错误文案均走 §3.5 的语义类 `text-caption`（12px，行高 1.5）。
- **MUST** 辅助文本区**只含** `Field.Description` 与 `Field.Error` 两项；计数显示（若控件契约提供）**属控件内部**，不进辅助区（§8.8.3）。

**`Field.Error` 的渲染条件（MUST）**

> **MUST** 错误消息由 `Field.Error` 承载，且必须**条件渲染 + `match={true}`**：`{isInvalid && <Field.Error match={true}>…</Field.Error>}`。
> **MUST NOT** 传 `match={false}`——该值**不会隐藏错误**，而会落入 `Field.Error` 的默认分支，改为读取 Base UI 的**计算型 validity**（`validityData.state.valid`）。在层 3 由外部引擎接管校验后，该值与真实校验结果无关，会造成**错误消息永不显示或显示错误内容，且不报错**。
> **MUST** 该写法同时是 `aria-describedby` 串联的前提——`Field.Error` 仅在 `rendered === true` 时注册 `messageIds`（§6.3）。

> 实证：`FieldError` 渲染分支顺序为 `match === true` → 渲染；`fieldState.disabled` → 不渲染；`match` 为字符串键 → 读 `validityData.state[key]`；否则 → `hasFormError || validityData.state.valid === false`。

**错误与帮助文本共存**

> **MUST** 校验失败时 `Field.Description` 与 `Field.Error` **同时渲染**，Error 位于 Description 下方。
> **MUST NOT** 用错误文案取代帮助文本——帮助文本常含填表必需的格式要求，而那正是用户改错时最需要的信息。
> **MUST** 规避共存带来的布局跳动：辅助区**预留最小高度**（或让 Error 绝对定位），使报错时表单不发生垂直位移。
> **MUST** `Field.Description` 长度 **≤ 30 字**（辅助区最多 2 行：描述 + 错误）。
> **MUST** 错误文案自身应包含修复指引（见 8.4），不得只写「格式错误」。

依据：用错误取代帮助是**语义层的信息缺失**，无法用工程手段弥补；布局跳动则**可工程化解决**。

### 8.3 `required` 的视觉与语义

**`required` 按层拆为两半（见 §8.8）**——基础控件不渲染 label，而星号必须挂在 label 旁，故控件层无法产出视觉标记：

| 层                             | 职责                          | 落地                                                                                                |
| ------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| 基础控件 `Input` / `Textarea`… | **只透传原生属性**，不加工    | `required?: boolean` → `<input required>`；由此驱动 `ValidityState.valueMissing` 与 `aria-required` |
| 字段集成 `InputField`…         | **视觉标记** + 向内部控件透传 | 读取 `required` 渲染红色星号（`aria-hidden`）于 `Field.Label` 内；并把 `required` 透传给内部控件    |

> **MUST** 基础控件透传 `required` 到原生属性，**不得加工**——它承担校验链路的语义来源（`valueMissing` 由原生 `required` 驱动）。
> **MUST NOT** 基础控件渲染必填视觉标记——它不渲染 label，架构上做不到。
> **MUST** `*Field` 集成层接收 `required`，同时产出**星号**（视觉）并**透传 `required`** 给内部控件（语义）。
> **MUST NOT** 集成层重复实现「避免初次报错」逻辑——Base UI 的 `valueMissing` 脏值判定已内建（源码注释：`to reduce error noise`）。
> **MUST** 组件契约须**显式声明**该行为（空值 + 未修改 → 不报错），避免各组件重复实现或误加拦截逻辑。
> **MUST** `required` 与 `disabled` 同时出现时，禁用优先；且禁用态不得移除 `aria-required`（字段仍属必填，只是暂不可编辑）。
> **MUST NOT** 用 `placeholder` 里的「（必填）」代替语义标记。

**「是否必填」的单一真源**

> **MUST** `required` **prop 是唯一真源**——视觉星号与语义 `aria-required` 均由它驱动；schema / validator **只承担运行时校验**，不作为星号的推导来源。
> 依据（技术排除）：Standard Schema 只暴露 `~standard.validate`，**不提供**「是否必填」的结构化元信息；函数式 validator 更无法内省。**从 schema 自动推导星号技术不可行。**
> **MUST** 业务须自行保证 `required` prop 与 schema 的必填声明一致——本规范无法机械校验二者，但可通过契约评审检查。

**视觉标记形态（红色星号）**

> **MUST** 视觉必填标记为 **红色星号 `*`**，**由 `*Field` 集成层渲染**，紧跟在 `Field.Label` 文本之后。
> **MUST** 星号颜色用 **`--destructive`**（#FD2237，实测 vs 页面 **3.49:1** ✅ 达 1.4.11 的 3:1）。
> **MUST NOT** 用 `--muted-foreground` 等弱化色——对比度虽达标但**语义不明**。
> **MUST** 星号 `aria-hidden="true"`，语义只由 `aria-required` 承载；否则屏幕阅读器会读出「星号」。
> **MUST** 防止星号单独折行（`whitespace-nowrap` 或 inline-block）。
> **MAY** 若某业务表单的必填项占比 **< 30%**，可改用「选填」反标。

> 合规注记：WCAG 1.4.1 要求「不单独用颜色传达信息」。星号的**形状与位置**本身即非颜色线索，颜色只是增强，故合规。

### 8.4 校验与错误文案规范

- **MUST** 播报口径遵循 **§6.11**（字段级 `aria-live="polite"`、表单汇总区 `role="alert"`、容器常驻 DOM）。
- **MUST** 错误文案长度 **≤ 40 字**，且**必须包含修复指引**（说清「怎么改」，不只是「格式错误」）。
- **SHOULD** 错误文案**不带图标**——文案自身已由颜色 + 描边 + 环三重指示（§4 / §5），再加图标属冗余；确需图标时图标须 `aria-hidden`。
- **MUST** 校验触发时机按层确定：**层 1** 由 `Field.Root.validationMode` 决定（`onSubmit` 默认 / `onBlur` / `onChange`）；**层 3** 由 TanStack Form 的 `validators` 键（`onChange` / `onBlur` / `onSubmit` / `onDynamic` …）与表单级 `validationLogic: revalidateLogic({ mode, modeAfterSubmission })` 决定（§8.9）。两条路径**互斥**（§2）。
- **MUST NOT**（两层通用）组件自行在 `onChange` / `onBlur` 里触发校验。
- **MUST** 有效性判定按层确定：层 1 走 §6.4（ValidityState），层 3 走 TanStack validator（§8.9）；**两层均 MUST NOT** 自建校验状态码。

**错误汇总区（独立条目交付）**

> **实证：Base UI 1.8.0 与 TanStack Form 均不提供 error summary 部件。** Base UI 的 `Form` 只有单组件（`validationMode` / `errors` / `onFormSubmit` / `actionsRef.validate`），**无** `Form.ErrorSummary`、**无** focus-first-error；TanStack Form 亦明写「**intentionally does not have insights into your markup**」，故同样无内建聚焦。自研所需数据在 TanStack 侧为 `form.state.fieldMeta` 与 `form.state.errorMap`。

> **MUST** 错误汇总区作为**独立 registry 条目**交付，条目名 **`form-error-summary`**（`registry:ui`，层 3），并在《组件库范围与 MVP 清单》§6 补登记一行（P1，**依赖 TanStack Form 的 form 实例，须后置于表单库接入**）。
> **MUST** 形态为：**常驻容器 + `role="alert"`**，内容为「N 个字段需要修改」+ 可点击的字段列表（文案规则见 §10.6）。
> **MUST** 错误**聚合口径唯一**：以 **`form.state.errorMap.onSubmit`** 为准；其余时机（`onChange` / `onBlur` / `onDynamic` / `onServer`）**仅**用于字段内联展示，不进汇总区。
> **MUST** 聚焦实现为**作用域内查询**——在表单容器 `ref` 上 `querySelector('[aria-invalid="true"]')`；**MUST NOT** 用 `document.querySelector`（官方范式为全局查询，同页多表单时会聚焦到**别的表单**）。
> **MUST** 容器常驻 DOM、只切换内容（§6.11）——不得随错误出现而挂载 / 卸载。
> **MUST** 汇总区条目本身须通过 §6 DoD 四项 a11y 检查，并作为 §6.11 汇总播报条款的**唯一承载体**。

### 8.5 受控 / 非受控口径

**受控口径（MUST）**：统一采用 Base UI 的 **`value` / `defaultValue` / `onValueChange(value: string, eventDetails)`**；**MUST NOT** 并存 `value` + 原生 `onChange(e)` 式的第二套受控入口。

- **MUST** 统一采用 Base UI 口径：**`value`**（受控）/ **`defaultValue`**（非受控）/ **`onValueChange(value: string, eventDetails)`**。
  > 理由：① `onValueChange` 是 Base UI 的受控入口，层 1 的 `Field` 校验链路依赖它驱动（`Field.Control` 内部用它触发 `validation.change`），只接原生 `onChange` 会绕过校验；② 层 3 亦以它为与 TanStack Form 的对接点。
- **MAY** 原生 `onChange` 等事件继续透传给宿主，但**不得**作为受控的唯一入口。
- **MUST** `value` 与 `defaultValue` 二选一，同时传以受控为准；组件**不得**静默吞掉其中一个。
- **MUST NOT** 用 `useImperativeHandle` 包装 `ref`（§2：ref 指向 DOM，命令式能力走独立 `actionsRef`）。

> **层 3 口径（§8.9）**：集成层控件**强制受控**——值单向来自 `field.state.value`，变更经 `field.handleChange`；**MUST NOT** 使用控件自身的 `defaultValue`，初值统一由 `useForm({ defaultValues })` 提供。

### 8.6 IME（中文输入法）

**实证（Base UI 1.8.0 源码）**：全包搜索 `compositionstart` / `compositionend` / `isComposing` **零命中**——**完全不处理组合态**；`onValueChange` 在拼音输入过程中会逐次触发。以下三条由规范兜底。

- **MUST** 组件**不得**在 composition 期间触发校验。拼音输入中途的值必然不满足格式规则，会导致「边打字边报错」。
  > 落地（**层 1**）：受控组件在 `onCompositionStart` / `onCompositionEnd` 之间跳过 `validationMode="onChange"` 的校验提交；`onSubmit` / `onBlur` 模式不受影响。
  > 落地（**层 3**）：TanStack Form **完全不处理组合态**（官方 validation 指南零提及），门控必须在集成层统一实现——composition 期间**不得调用 `field.handleChange`**（或以 `revalidateLogic` 把 `modeAfterSubmission` 降级为 `onBlur`），`onCompositionEnd` 后按上屏值一次性提交。**MUST NOT** 由各控件分别实现该校验门控（§8.9）。
- **MUST** 组件**不得**在 composition 期间做值格式化 / 截断（如自动去空格、补分隔符、按 `maxLength` 切片）——会导致拼音串被破坏、候选词上屏失败。
  > 本条约束的是**控件自身行为**（值处理），三层均适用；与表单库无关。
- **MUST** 契约须显式声明 `maxLength` 的**计数口径**：

  | 口径                   | 说明                                                  | 适用                   |
  | ---------------------- | ----------------------------------------------------- | ---------------------- |
  | **上屏字符数（推荐）** | 只统计已上屏字符，组合中的拼音字母不计入              | 中文 / 日文等 IME 场景 |
  | **原始输入长度**       | 组合中的拼音字母也计入（原生 `maxLength` 的默认行为） | 纯英文 / 数字场景      |

  **推荐「上屏字符数」**：原生 `maxLength` 会把 `zhongwen` 这 8 个拼音字母计入 20 的上限，用户实际只能上屏 12 个汉字——这是中文场景下的实质缺陷。实现上：组件在 composition 期间不施加上限，`onCompositionEnd` 后按上屏值校验。

- **SHOULD** `Textarea` 的计数显示（§8.8.3）同样按上屏字符数统计，避免组合态数字乱跳。
- **MUST** 契约须声明是否提供 `onCompositionStart` / `onCompositionEnd` 透传（供使用方自行处理）。

### 8.7 尺寸与状态

引用 §3（尺寸体系）与 §4（状态语言），本节不重复定义。表单类组件**额外**需满足：§6.10 可点击区域、§6.4 `required` 语义、§4.4 readonly 口径。

### 8.8 分层模型

#### 8.8.1 三层模型

| 层  | 组件                                                                           | 职责                                                             | 表单库依赖                     |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------ |
| 1   | **基础控件** `Input` / `Textarea` / `Select` / `Checkbox` / `Radio` / `Switch` | 值、状态、尺寸、变体。**可单独使用**（搜索框、筛选条、工具面板） | **无**（MUST，§2）             |
| 2   | **控件内组合** `InputGroup`（prefix / suffix / addon）                         | 控件**内部**布局扩展——「这个输入框长什么样」                     | **无**（MUST，§2）             |
| 3   | **字段集成** `InputField` / `TextareaField` / `SelectField` …                  | 字段**级元数据**——label / description / error / required 标记    | **TanStack Form 的 form 实例** |

> **MUST** 层 1 / 层 2 条目的 `dependencies` 不得包含 `@tanstack/react-form`——由契约断言 **A16** 机械校验（§9.4 / §9.9）。

**层 2 与层 3 的分界**：prefix / suffix 是控件**内部**结构（`¥` 前缀、`元` 后缀），属「这个输入框长什么样」；label / error 是**字段级元数据**，属「这个字段是什么」。混在一起会让 `InputField` 沦为什么都塞的容器。

#### 8.8.2 分层的连带约定

**① 组控件需第三种容器** —— 源码实证（`useFieldValidation` 注释）：「A field can own several inputs (such as a checkbox or radio group), but only the last-mounted one wins the shared `inputRef`. Validate against the registry instead so every input counts」。

| 场景                                             | 容器                                    | 理由                                   |
| ------------------------------------------------ | --------------------------------------- | -------------------------------------- |
| 单控件字段（Input / Textarea / Select / Switch） | `Field.Root` + `Field.Label`            | label 关联到唯一控件                   |
| **组控件字段**（CheckboxGroup / RadioGroup）     | **`Fieldset.Root` + `Fieldset.Legend`** | label 是**组标签**，不是某个控件的标签 |

> **MUST** 组控件字段用 `Fieldset.Root` + `Fieldset.Legend`。若误用 `Field.Label`，会关联到组内某一个 radio，**语义错误**。

**② 命名**

> **MUST** 集成层命名为 **`XxxField`**（`InputField` / `TextareaField` / …）。**MUST NOT** 使用 `FormField`——会与 shadcn 官方（基于 react-hook-form）体系混淆，且本库集成层不依赖 react-hook-form。
> **MUST** `*Field` 必须经本库导出的 **`useAppForm` + `form.AppField`** 渲染，由 `useFieldContext` 读取字段状态；**MUST NOT** 让使用方直接用 TanStack 的 `useForm`——上下文须**单例**，否则 `useFieldContext` 抛错。
> **MUST** `*Field` 注册进 `createFormHook` 的 `fieldComponents`（**键名即消费名**，与 `XxxField` 天然契合）。

**③ MVP 补登记**

> **MUST** 《组件库范围与 MVP 清单》§6 补登记集成层条目；本规范**只要求 `InputField` 进 MVP（P0）**，其余 `*Field` 待 v0.2。
> **MUST** 同时补登记两个**前置条目**——`form-context`（`createFormHookContexts()` 的唯一调用点，导出 `fieldContext` / `formContext` / `useFieldContext` / `useFormContext`）与 `useAppForm` 条目（`createFormHook({ fieldContext, formContext, fieldComponents, formComponents })`）。没有它们，`*Field` 无法工作。
> **MUST** 两者落点为 **`registry:ui`** 且源文件置于 `src/shadcn-ui-lib/ui/`、扩展名 **`.tsx`**（推导见 §9.4 末条）。
> **MUST** `useAppForm` 条目的命名为 **`app-form`**——与导出名 `useAppForm` 呼应，且避免在下游 `components/ui/shadcn-ui-lib/` 目录里与官方 `form.tsx` 同名混淆（`form` 虽技术上一不冲突，但评审与排错成本更高）。

#### 8.8.3 字符计数的归属

**归属原则：计数归基础控件**——计数的两个输入（当前值长度、`maxLength`）**全部来自控件自身**，不需要任何字段级信息（label / error / 是否必填），与 `disabled` / `readOnly` 同类；独立使用场景（搜索框限 50 字、评论框限 200 字）同样需要计数，放进 `InputField` 会迫使这些场景也引入表单库依赖。

**单行 `Input` 不提供计数显示**

| 能力                        | 性质         | 归属                                 |
| --------------------------- | ------------ | ------------------------------------ |
| **`maxLength`**             | 输入**约束** | 所有文本控件（`Input` / `Textarea`） |
| **计数显示（`showCount`）** | 输入**反馈** | **仅 `Textarea`**                    |

依据：单行 `Input` 高度仅 24 / 32 / 40px 且宽度受布局挤压，**没有天然位置**容纳计数（否则与 `placeholder` 争抢右侧空间）；且单行输入的字数上限通常很短（姓名 20、邮箱 50），用户极少需要实时看计数，而多行文本上限较长（评论 200、简介 500），用户**需要**知道还剩多少。

**最终条款**

> **MUST** `maxLength` 为所有文本控件的能力（`Input` / `Textarea`），负责输入约束。
> **MUST** 计数显示（`showCount`）**仅由 `Textarea` 提供**，`Input` **不提供**。
> **MUST NOT** 把计数显示放进 `InputField` / `TextareaField`——集成层只做字段级元数据编排。
> **MUST** `Textarea` 的计数口径为「**上屏字符数**」（§8.6）：composition 期间冻结计数，`onCompositionEnd` 后按上屏值更新。
> **MUST** 计数**不进入辅助文本区**，不与 `Field.Error` 争位。
> **MUST** 计数显示对辅助技术**隐藏**（`aria-hidden="true"`）——约束已由原生 `maxlength` 属性传达，重复播报无增益；且计数随每次击键变化，接入 live region 会造成播报风暴。

**计数与 `maxLength` 的联动语义（须在 `Textarea` 契约中定义）**

- §8.6 的 `maxLength` 口径为「上屏字符数」→ **不能纯靠原生 `maxLength`**（原生会把拼音字母计入），须 JS 介入 → **超限态可能出现**（composition 结束后才发现超限）。
- **MUST** `Textarea` 契约须定义计数的**超限态**：超限时计数变色，颜色用 `--destructive`（#FD2237，实测 vs 页面 **3.49:1** ✅ 达 1.4.11）。
- **SHOULD** 超限时**不阻止继续输入**，而是阻止提交并给出错误文案（与 §8.4 一致）——若直接截断，用户会感觉「按键失效」。

> **扩展性**：若未来真实业务证明单行 `Input` 也需要计数，**给 `Input` 新增 `showCount` prop 是向后兼容的**，故当前方案不存在「定死 API」的风险。

### 8.9 与 TanStack Form 的集成（层 3 接缝）

**定位**：§8.1–§8.8 对**三层均生效**；本节只补充**层 3（字段集成）**接入 `@tanstack/react-form` 时的额外约定。层 1 / 层 2 **不得**引用本节（§2「表单依赖边界」）。

**接缝边界（MUST）**

> **MUST** 分工为 **Base UI `Field` 管 DOM / ARIA、TanStack Form 管状态 / 校验**；二者**唯一**的接缝是 `Field.Root` 的 `invalid` / `touched` / `dirty` 三个 prop。
> **MUST** 状态派生自 TanStack 字段状态——`touched={field.state.meta.isTouched}`、`dirty={field.state.meta.isDirty}`、`invalid` 取字段校验失败态。
> **MUST** `invalid` 与 `disabled` **相与**：`invalid={isInvalid && !disabled}`——禁用态不得被错误态样式覆盖（§4.3）。
> **MUST NOT** 在同一 `Field.Root` 上再传 `validate` prop（与外部 `invalid` 互斥，§2）。
> **MUST NOT** 手写 `id` / `htmlFor` / `aria-invalid`——三者均由 Base UI 接管（§6.1 / §6.2 / §6.4）。**shadcn 官方的 TanStack 范式在这一点上与本规范冲突，不得照搬**（它手写三者并改用原生 `onChange`）。

**受控口径（MUST）**

> **MUST** 集成层控件**强制受控**：值单向来自 `field.state.value`，变更经 `field.handleChange`（对接控件的 `onValueChange`）。
> **MUST NOT** 使用控件自身的 `defaultValue`——初值统一由 `useForm({ defaultValues })` 提供，避免「表单库值」与「DOM 值」两个真源。

**错误展示（MUST）**

> **MUST** 错误消息经 `Field.Error` 承载，并遵守 §8.2 的「条件渲染 + `match={true}`」。
> **MUST** 非字符串型错误（对象 / Standard Schema issue 数组）到展示字符串的**归一化由 `*Field` 承担**；业务侧不得依赖 `errors` 的原始形态（§10.4）。
> **MUST** 错误展示以 `field.state.meta.isTouched`（或等价的提交尝试计数）门控，避免初次渲染即报错；**MUST NOT** 集成层重复实现「避免初次报错」逻辑（§8.3）。

**错误优先级（MUST）**

> **MUST** **字段级 validator 优先于表单级 validator**——与 TanStack Form 的实际行为一致，不与之对抗。表单级校验仅作补充；其通用错误（如「两次密码不一致」）应挂到相关字段上，而非依赖表单级错误单独展示。

**异步校验（MUST，只锁边界）**

> **MUST** 异步校验**不得在控件层实现**（§2），只能经集成层的 async validator（`onChangeAsync` / `onBlurAsync` / `onDynamicAsync`）承担。
> **未定（留 v0.2 专项）**：防抖下限、竞态丢弃策略、与提交的交互——须**先实测再写条款**，不得凭印象。

**数组字段（MUST，v0.2 + 锁边界）**

> **MUST** 数组字段（`mode="array"` / `pushValue` / `removeValue`）须有**独立容器组件**，**MUST NOT** 让单值 `*Field` 兼顾——否则其 props 分叉，违反「层 3 是层 1 的超集、同名 prop 语义不偏移」（见下方「跨层一致性」）。
> **未定（留 v0.2）**：容器组件的形态与布局约定。

**提交生命周期映射（MUST）**

> **MUST** 表单提交场景下，§4.6 的 loading 态由 TanStack Form 的 `isSubmitting` 驱动。
> **注**：该映射写在此处而非 §4.6——§4.6 只定义**表达手段**，触发来源属本节的实现细节。

**跨层一致性（MUST）**

> **MUST** 层 3 的 props 是**层 1 的超集**：同名 prop（`disabled` / `invalid` / `required` / `name` …）语义**不得偏移**——使用者把 `<Input>` 换成 `<InputField>` 时，行为只应「只多不少」。
> **MUST NOT** 为便利而重定义同名 prop 的语义，**MUST NOT** 另起 prop 名替代（如用 `showInvalid` 表示「强制显示错误」）。

**脱上下文行为（MUST）**

> **MUST** `*Field` 脱离 form 上下文时**硬抛错**，并给出**可读的错误信息**——须指明「该组件必须在 `useAppForm` 的 `form.AppField` 内使用」。
> **MUST NOT** 降级为层 1 用法——降级会产生一个**半功能状态**（label / error 等字段级 props 无来源），却仍占用同名 API。

**依赖声明与落点（MUST）**：见 §9.4（含版本策略与 A16 断言）。
