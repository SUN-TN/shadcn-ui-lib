---
name: 'feishu-component-api'
description: 'Design and author component API contracts for UI components (Feishu/Lark docs or local Markdown). Enforces three-column CSS Token mapping (figma 变量名 / tailwind 工具类 / css 值) and standard-token landing. Invoke when writing, reviewing, or iterating on API 契约文档, using the Feishu wiki template + Token reference.'
---

# 飞书组件 API 契约设计 Skill

**先有契约，再有代码**——把一个 UI 组件的 API 设计写入飞书 Wiki（或本地契约 Markdown），作为后续实现的规格文档。

本 skill 覆盖：飞书 Wiki 的契约撰写流程、铁律、设计决策点、7 阶段标准流程，以及组件 API 契约通用规范（CSS Token 三列映射、标准 token 落位、查检工作流、可累积规则）。

---

## 两种模式

| 模式                 | 触发方式                         | 顺序            | 说明                                           |
| -------------------- | -------------------------------- | --------------- | ---------------------------------------------- |
| **设计模式**（默认） | 用户提供模板 + Token 表 + 组件名 | **契约 → 代码** | 从参考库提取设计模式，从零设计 API             |
| **反推模式**         | 用户显式说"读组件源码反推契约"   | **代码 → 契约** | 基于已有源码提取 Props/事件/aria，反向填充模板 |

---

## 何时触发

- **设计模式**（默认）：用户提供 API 契约模板 + CSS Token 映射表 + 组件名，要求"完善 API 契约"；用户说"参考 AntD / Base UI / shadcn 的 X 组件设计"
- **反推模式**：用户显式要求"读源码" / "基于现有组件反推" / "参考这个组件的实现"
- **审查模式**：用户提供已有契约文档，要求"检查错漏 / 一致性 / 冲突"
- **Token 表查检**：文档涉及 CSS Token 映射表格（figma 变量名 / tailwind 工具类 / 对应的 css 值 三列）的编写或核对的规则（R1–R4）

---

## 前置资源

### 设计模式（默认）

| 资源                 | 获取方式                             | 是否必需 | 用途                                                             |
| -------------------- | ------------------------------------ | -------- | ---------------------------------------------------------------- |
| **API 契约模板**     | 飞书 Wiki URL                        | ✅       | 章节结构、表格列定义（**不要擅自改格式！**）                     |
| **CSS Token 映射表** | 飞书 Wiki URL                        | ✅       | Token 名称 ↔ HEX/OKLCH 值的**唯一真值来源**（R2）                |
| **参考库设计**       | AntD / Base UI / MUI / shadcn 等 URL | 建议提供 | 设计模式选型（variant 枚举、size 阶梯、loading/color prop 形态） |
| **需求描述**         | 用户口头/文字说明                    | 建议提供 | 组件用途、不适用场景、业务特定语义                               |

**默认不读取项目组件源码**——契约先于代码，源码只是实现，不是规格来源。

### 反推模式（需显式指定）

| 资源             | 获取方式      | 是否必需 |
| ---------------- | ------------- | -------- |
| API 契约模板     | 飞书 Wiki URL | ✅       |
| CSS Token 映射表 | 飞书 Wiki URL | ✅       |
| **组件源码**     | 仓库文件路径  | ✅       |

反推模式下从源码提取：Props 类型定义、variants/sizes 枚举、aria 属性处理、事件处理方式、默认值逻辑。

### 离线 Token 真值源

| 资源                     | 路径               | 用途                                                        |
| ------------------------ | ------------------ | ----------------------------------------------------------- |
| `references/token-v1.md` | 本 skill 目录内    | 飞书《CSS Token 映射表 V1》离线快照；三列映射的唯一离线真值 |
| `src/global.css`         | 项目根（仅本项目） | **最终权威**：所有 token 的 OKLCH 真值，改 token 以它为源   |

> 本项目 `src/global.css` 是色彩 token 的唯一真源（见 AGENTS.md）。`references/token-v1.md` 是飞书 V1 的离线快照，V2 发布或 `src/global.css` 改动后须同步更新。

---

## 铁律（不可违反）

1. **模板格式不可擅自改**——模板的列表类型、章节顺序、标题语义保持原样。如果模板用无序列表，不要改成表格
2. **默认值列必须表达来源语义**——默认值列写硬编码但说明写"从 X 继承" → 语义自相矛盾。正确做法：默认值列写 `undefined` + 说明文本（如"未传入时由 X 决定"）
3. **Token 值唯一来自 Token 映射表**——禁止凭印象写颜色值。所有 HEX/OKLCH 必须能在 Token 表（或 `src/global.css` / `references/token-v1.md`）里找到对应项
4. **枚举值三处必须一致**——Props 表枚举值 / 变体映射表 / 组合规则引用 / 使用示例，四处的枚举值必须完全相同
5. **内部 Token 名 vs 公开 API 别名**——CSS Token 内部名（如 `--destructive`）和公开 API 枚举（如 `"danger"`）是两回事。枚举只出现**语义别名**，Token 名的别名关系在颜色映射表说明里标注
6. **预设映射表每一行必须完整**——每个 preset 的 variant 和 color 列都要有值，不能空、不能写 `"-"`。空列意味着该 preset 没有推荐值，这是设计不完备
7. **文档写入前必须 fetch 最新 revision**——block-id 在每次文档编辑后都会变；不要缓存旧 block-id 盲目写入
8. **默认不读源码**——设计模式下只从模板、Token 表、参考库、用户需求提取信息。反推模式必须用户显式指定
9. **Token 映射表最少两列**——凡涉及 CSS Token 映射的表格，优先含 `figma 变量名` / `tailwind 工具类` / `对应的 css 值` 三列（css 值以 oklch 优先，可附 hex）。若某 tailwind 工具类（如 `px-[6px]` 这类任意值）在 token 映射表中找不到对应 figma 变量，则至少须含 `tailwind 工具类` 与 `对应的 css 值` 两列
10. **间距/圆角必须落标准档**——间距仅 2/4/8/12/16/24…（无 6px 等非标）；圆角 `--radius`≈10px，sm/md/lg/xl = 4/6/8/12px；颜色用语义 token。非标值须在 figma 列显式标注
11. **契约必须产出「可拆分复用工具」清单**——设计任何组件契约时，都要显式判断该组件是否含可跨组件复用的模块（浏览器 API 封装 / 纯函数校验 / 数据模型与状态机 / 副作用 Hook / 通用交互 Hook / 对外契约类型）；有则逐项列出（工具名 / 形态 / 说明 / 复用范围），确实没有也要写明「无」。清单是契约阶段的**必需产出**，不是可选附录（详见设计决策点 7 / R7）。**若走「写入 MVP 清单」的退路，必须先确认契约存在「变更记录」章节；缺失时先补该章节，改在「元信息」的「关联文档」行留指向亦可——不要指向一个不存在的章节**
12. **设计与回写分离，决策先问用户**——设计阶段只产出**本地**文档（如 `xxx-contract-design.md`），**用户明确要求前不回写飞书**；需拍板的设计点必须先在文档 / 回复中给出「区别 / 优点 / 缺点 / 推荐方案 / 推荐理由」，再用 `AskUserQuestion` 收口，不替用户硬定。控件保持纯净，错误态 / 表单校验 / label 组合等能力优先走契约外机制，不在组件内引入 `*Field` 包装（详见 `references/feishu-writeback-sop.md` Part A）

---

## 契约通用规范（可累积规则）

> 以下为可累积的"组件契约"通用规则，适用于飞书契约与本地契约文档。

### 工作流决策树

1. 判定任务类型：
   **新建契约文档？** → 走「新建工作流」
   **编辑 / 查检已有文档？** → 走「查检工作流」
2. 新建工作流：套用 `references/contract-template.md` → 填充 Props / 状态 / 尺寸 / 样式映射 → 所有 Token 表按 R1 填三列 → 跑查检。
3. 查检工作流：逐行对照真值源核对三列 → 列出不一致项 → 给出「以哪个值为准」的方案让用户定夺 → 改另外两个值。

### 核心规则（可累积区）

> **R0 元规则（组织方式）**：按「产物 / 领域」归集规则，不按「规则条数」归集。同产物（组件契约）的规则都攒进本 skill 的 R1~Rn；用 `references/` 下沉长清单防止 SKILL.md 膨胀。出现以下信号才拆分出新 skill：① 触发域发散（规则服务的不再是组件契约文档）；② 某规则需被多个 skill 复用（如 Markdown 风格，可提升为独立 `doc-style` skill 被本 skill 引用）；③ SKILL.md 正文超过 ~150 行或规则彼此正交且过长。新增规则直接在此追加编号，并在 references 中补充依据。

- **R1 三列优先，最少两列**：凡涉及 CSS Token 映射的表格，优先含 `figma 变量名` / `tailwind 工具类` / `对应的 css 值` 三列，css 值以 oklch 优先，可附 hex。若某 tailwind 工具类（如 `px-[6px]`、`w-[120px]` 等任意值，或间距/尺寸的非标档位）在 token 映射表中找不到对应 figma 变量，则该行至少须含 `tailwind 工具类` 与 `对应的 css 值` 两列，并在说明列标注"非标"或来源。
- **R2 真值源唯一**：飞书《CSS Token 映射表 V1》为唯一真值源；三列必须两两对应且都落在 V1 标准 token 上。离线时用 `references/token-v1.md` 快照；本项目改 token 以 `src/global.css` 为最终权威。
- **R3 落标准 token**：间距档位仅 2/4/8/12/16/24…（无 6px 等非标）；圆角 `--radius`≈10px，sm/md/lg/xl = 4/6/8/12px；颜色用 V1 主色 / 危险 / 成功等语义 token。
- **R4 不一致先给方案**：发现三列不对应，先列出不一致项并给出「以哪个值为准」的若干方案，让用户决策后再改另外两个值。
- **R5 Markdown 风格**：沿用 `Markdown 实用手册.md`（`#` 顶级 + `###` 子章节、列表项间空行、代码块标注语言、引用块提示、FAQ + 总结）。
- **R6 契约章节结构**：建议含 概述 / Props(API) 表 / 状态与变体 / 尺寸表(三列) / 样式映射表(三列) / 可访问性 / 使用示例 / FAQ / 变更记录。这是**建议基线**；含事件 / Slots / Ref / 组合规则 / 响应式 / 附录的**完整章节清单**见 `references/feishu-writeback-sop.md` A.1。
- **R7 必产「可拆分复用工具」清单**：设计契约时必须显式判断组件是否含可跨组件复用的模块（浏览器 API 封装 / 纯函数校验 / 数据模型与状态机 / 副作用 Hook / 通用交互 Hook / 对外契约类型）；有则逐项列出 `工具名 / 形态 / 说明 / 复用范围`，无则写「无」。「复用范围」列（`全库通用` / `本组件专用`）是后续「是否独立成 registry 条目」的判据——全库通用独立成条，组件专用随组件内联分发。详见设计决策点 7。

### 标准 Token 速查

见 `references/token-v1.md`（关键值：主色 `--primary` oklch(0.639 0.149 247.984)#3091E1；危险 `--destructive` oklch(0.636 0.244 24.335)#FD2237；信息 `--info` oklch(0.682 0 0)**#999999**；基础圆角 10px、md 6px 等）。

> ⚠️ 易错点（2026-09-22 更新）：`--info` 现为 **#999999（灰）**，与 `--subtle-foreground` **同值**。飞书《CSS Token 映射表 V1》已同步改值，`references/token-v1.md` 快照中的 `color/status/info` 同样是 #999999。
> 旧值 **#00B2F8（信息蓝）已作废**：历史契约文档、旧版快照、记忆里若出现 #00B2F8，一律视为过期值并按 #999999 纠正；反之，不要因为印象里的"信息蓝"就判定 #999999 写错。

---

## 设计决策点（填表格之前必须回答）

在动手填任何表格之前，先根据组件类型回答以下问题。不同组件的答案不同。

### 1. 组件属于哪类？

| 类型         | 特征             | 典型组件                              | 参考库                                   |
| ------------ | ---------------- | ------------------------------------- | ---------------------------------------- |
| 原子交互元素 | 单一动作触发     | Button、Checkbox、Radio、Switch       | AntD Button、Base UI                     |
| 输入框类     | 表单数据接收     | Input、Select、Textarea、DatePicker   | AntD Form、Base UI Select                |
| 反馈/通知类  | 信息展示         | Alert、Toast、Message、Tooltip        | AntD Feedback、Sonner                    |
| 容器类       | 包裹内容管理状态 | Dialog、DropdownMenu、Tabs、Accordion | AntD Feedback/DataEntry、Base UI Overlay |
| 数据展示类   | 列表/表格/卡片   | Table、List、Card、Timeline           | AntD DataDisplay                         |

### 2. 有没有"三层优先级链"？

当组件的某类属性有**多层决策来源**时（例如"形状由 variant + preset + 独立默认值共同决定"），必须画出优先级链。常见情况：

| 情况                               | 是否需要  | 示例                              |
| ---------------------------------- | --------- | --------------------------------- |
| variant 仅为形状 + 独立 color prop | ✅ 需要   | Button（形状/颜色分离设计）       |
| variant 同时决定形状+颜色          | ❌ 不需要 | Alert（variant 直接决定整体外观） |
| size 独立无覆盖                    | ❌ 不需要 | 大多数组件 size 是单值枚举        |
| 有 preset 作为推荐组合             | ✅ 需要   | Button preset、Card variant       |

### 3. 受控还是非受控？

| 模式       | 特征                           | 典型                                             |
| ---------- | ------------------------------ | ------------------------------------------------ |
| **纯展示** | 无内部状态                     | Button、Card、Alert                              |
| **非受控** | 内部 state + defaultValue      | Input、Checkbox、Dialog open                     |
| **受控**   | 外部 value + onChange          | Input value/onChange、Tabs activeKey             |
| **双模式** | 支持受控 + defaultValue 非受控 | Select、Dialog（open 受控 / defaultOpen 非受控） |

### 4. loading / disabled 如何设计？

| 设计                        | 适用场景                          | 参考                |
| --------------------------- | --------------------------------- | ------------------- |
| 仅 `disabled`               | 静态禁用态，不需要 loading        | 大多数组件          |
| `disabled` + `loading` 分离 | 独立加载态，loading 自动 disabled | Button（AntD 参考） |
| `loading` 含 spinner prop   | loading 时显示旋转图标            | Button、Button-like |
| `loading` 仅视觉覆盖        | 灰显遮罩 + loading 文案           | Dialog loading 态   |

### 5. size 枚举粒度？

| 粒度         | 枚举                                 | 适用                       |
| ------------ | ------------------------------------ | -------------------------- |
| 3 档         | `small / medium / large`             | 大多数基础组件             |
| 4 档         | `xs / sm / default / lg`             | 按钮、输入框等             |
| 含 icon 系列 | `default / icon / icon-sm / icon-lg` | Button、IconButton         |
| 响应式尺寸   | Tailwind 断点前缀类                  | 由业务层处理，组件自身不做 |

### 6. 参考库选择哪些？

| 参考库         | 适合                                                        |
| -------------- | ----------------------------------------------------------- |
| **Ant Design** | 完整 API 设计、loading、color prop、受控/非受控             |
| **Base UI**    | Primitive 设计、语义化 a11y、render prop + slots 组合式 API |
| **shadcn/ui**  | CVA variants、Tailwind-first、无 forwardRef 模式            |
| **MUI**        | variant / color / size 三元组设计                           |

### 7. 有没有可拆分为通用复用工具的模块？

**组件契约不只描述「这个组件怎么用」，还要识别「哪些能力不该被这个组件私有」。** 凡是与 UI 渲染解耦、可被其他组件复用的逻辑，都应在契约阶段提取出来并列表。

判定标准（满足任一条即候选）：

| 信号                             | 例子（来自 Upload 契约）                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| 纯浏览器 API 封装、零 React 依赖 | `xhrUpload`（原生 XHR + 进度 / 取消）、`readFileAs`、`downloadFile`、`getImageDimensions`           |
| 纯函数解析 / 校验                | `parseAccept` / `matchAccept`、`validateMaxSize`、`validateMaxCount`                                |
| 数据模型归一化 + 状态机          | `createUploadFile`（File → 组件模型）、`fileStatusReducer`（selected→uploading→done/error→removed） |
| 副作用 / 生命周期 Hook           | `useObjectUrl`（objectURL 自动回收）、`useDropZone`（dragleave 抖动抑制）、`useFileInput`           |
| 通用交互 / a11y Hook             | `usePrefersReducedMotion`、`useKeyActivation`                                                       |
| 对外契约类型                     | `UploadRequestOption`、`UploadRequestReturn`（`customRequest` 无类型不可用）                        |
| 无状态工具函数                   | `genUid`、`buildFormData`                                                                           |

**产出要求**：

1. 列出 `工具名 / 形态（纯函数 / Hook / 类型契约）/ 说明 / 复用范围` 四列。
2. **「复用范围」是必需列**——取值 `全库通用` 或 `本组件专用`；它是后续「是否独立成 registry 条目」的判据（全库通用 → 独立成条；组件专用 → 随组件内联分发）。
3. 判为「本组件专用」的也要列出并标注——不要因为「不外发」就省略；出现第二个消费者时可直接升级。
4. 无候选工具时写「本节无（原因：…）」，不留空节、不省略该节。

**产出位置**：优先作为契约文档的一节（放在 Props 之后）；若上游模板不允许增章节（铁律 1），则写入项目的组件范围 / MVP 清单（如《组件库范围与 MVP 清单》§4.7 工具与资源），并在契约文档的「变更记录」留一条指向（该章节缺失时的处理见铁律 11）。

> 参考案例：Upload 契约经此步骤提取出 **25 项**候选工具（全库通用 18 / 组件专用 7），最终落地为 5 个 registry 条目（`file-utils` / `upload-transport` / `file-hooks` / `a11y-hooks` / `common-utils`）。

---

## 标准流程（设计模式，7 阶段 + 2 检查点）

### 阶段 1：获取模板与 Token

```bash
export PATH="<lark-cli-bin>:$PATH"
lark-cli docs +fetch --doc "<模板URL>" --detail with-ids --as user
lark-cli docs +fetch --doc "<TokenURL>" --detail with-ids --as user
```

从 Token 映射表提取：

- 完整 Token ↔ HEX/OKLCH 值列表（主色、成功、警告、危险、信息、背景、表面、边框、文字）
- 语义锚定规则（默认颜色用哪个 Token、背景/前景配对规则）
- 圆角、间距、字号、阴影阶梯

同时从参考库获取设计模式（阶段 2 的决策点 2-6）。

> 离线或本地优先：先对照 `src/global.css`（真源）与 `references/token-v1.md`（飞书快照），所有颜色/间距/圆角取值必须落在其列。

### 阶段 2：设计决策（填表格之前）

**根据上面的 7 个决策点，产出设计草案**：

1. 组件类型归类 → 决定哪些章节是重点
2. 画出完整优先级链（如果需要三层决策）
3. 确定受控/非受控模式 → 决定 value / defaultValue / onChange 设计
4. 确定 loading / disabled 设计 → 决定 loading icon prop 是否需要
5. 确定 size 枚举粒度
6. 确定参考库 → 决定命名风格和设计模式
7. 识别可拆分为通用复用工具的模块 → 产出「可拆分复用工具」清单（铁律 11 / R7）

**产出形式**：5-8 行文字描述 + 1 个场景推导表（用于验证设计自洽性）+ 1 张可拆分复用工具清单表（工具名 / 形态 / 说明 / 复用范围；无候选时写「无」）。

### 阶段 3：填充 Props 表

Props 表列顺序（从模板继承，**不要改**）：

| 名称 | 类型 | 默认值 | 必填 | 受控 | 枚举/范围 | 说明 |
| ---- | ---- | ------ | ---- | ---- | --------- | ---- |

**默认值列的三种正确写法**：

| 情况                    | 写法                   | 示例                                        |
| ----------------------- | ---------------------- | ------------------------------------------- |
| prop 有独立硬编码默认值 | `"值"` 或 `boolean`    | `loading: false`、`disabled: false`         |
| prop 依赖其他 prop 继承 | `undefined` + 说明文本 | `variant: undefined 未传入时由 preset 决定` |
| prop 是纯占位符         | `—` 或 `undefined`     | `icon: —`                                   |

**枚举值规范**：

- 公开 API 只用**语义名**，不用内部 Token 名
- 自定义值类型用 `string`，说明写"可传任意 CSS 值"
- 受控列只在 value/open/activeKey 这类"外部控制状态"的 prop 上写"是"

### 阶段 4：填充映射表

根据决策点产出的设计，逐个填充变体/颜色/预设/尺寸映射表。通用规则：

- 每张表的每一行**必须完整**（没有空列）
- variant 映射表如果有"仅 variant 模式"的统一规则，用 `callout` 前置说明
- 颜色映射表标注 Token 内部名 ↔ 公开别名的关系
- 预设映射表的 color 列如果对应 preset 的 color 值，不要空
- **尺寸表、样式映射表必须按 R1 填写**：优先三列（`figma 变量名` / `tailwind 工具类` / `对应的 css 值`）；无 figma 对应项的任意值工具类，至少两列（`tailwind 工具类` + `对应的 css 值`）

### 阶段 5：填充组合规则

组合规则是把优先级链从"设计意图"变成"开发者看得见的规则"。结构建议：

```
1. 覆盖类规则：preset + 显式 prop → prop 覆盖（最高优先级）
2. 继承类规则：prop 未显式 → 从 preset 或默认值继承
3. 互斥类规则：多个互斥 prop 同时传入时的行为
4. 跨 preset 等价规则：variant + color 显式组合 ≡ 某个 preset
5. 常用组合示例：列出 2-3 个典型跨 preset 用法
6. 状态叠加规则：prop + disabled / loading / aria-invalid 的叠加行为
7. 警告类规则：有风险的边界条件（如 render prop / slots 自定义非原生元素需额外处理 ref 与事件透传）
```

**每条规则必须附示例**（`preset="X" + variant="Y" → 视觉描述`）。

### 阶段 6：填充使用示例

按"递进层次"组织代码块（从最简单入口到最复杂覆盖）：

```
1. 最简单入口（只用 preset / 只用默认值）
2. 叠加覆盖（preset + 显式 prop）
3. 完全自定义（不依赖 preset 的独立用法）
4. size 系列
5. icon + loading（如果有）
6. 状态：disabled / loading / aria-invalid
7. 自定义值（color=string 等）
```

### 阶段 7：文档写入

```bash
# Step 1: fetch 最新
lark-cli docs +fetch --doc "<URL>" --detail with-ids --as user

# Step 2: 生成 XML（HTML 子集）
# callout: <callout emoji="🎯" background-color="light-blue" border-color="blue"><p>...</p></callout>
# table:   <table><colgroup/><tbody><tr><td>...</td></tr></tbody></table>

# Step 3: 写入
lark-cli docs +update --doc "<URL>" \
  --command block_replace --block-id "<BLOCK_ID>" \
  --content "@./content.xml" --as user

# Step 4: 验证
lark-cli docs +fetch --doc "<URL>" --detail with-ids --as user
# 确认 revision 递增 + block-id 变化
```

> **覆盖式回写（整篇替换）与 `<tag>` 剥离坑**见 `references/feishu-writeback-sop.md` Part B：命令形态、裸文本 `\<x\>` / 反引号内去反引号 / 占位符改 `{}` / 代码块不动的转义对照表、以及「`warnings` 不穷尽，必须 `fetch --format pretty` 回读」的核验清单。

**常见错误**：

- ❌ callout + table 作为一个整体做 `block_replace`（飞书把它们当独立 block）
- ❌ 缓存旧 revision 的 block-id → block_id not found
- ❌ 没 fetch 就写入 → 内容被静默忽略

### 检查点 A：枚举值四处一致性

| 检查       | 方法                          |
| ---------- | ----------------------------- |
| Props 表   | 搜索 prop 行的类型定义列      |
| 变体映射表 | 搜索所有 `<code>"xxx"</code>` |
| 组合规则   | 搜索 `prop="xxx"` 形式的引用  |
| 使用示例   | 搜索代码块里的 prop 值        |

**发现不一致 → 回退阶段 2 重新设计，不要硬填表格**。

### 检查点 B：Token 值正确性（R1/R2/R3/R4）

用 Token 真值清单（`src/global.css` + `references/token-v1.md`）比对文档里出现的所有颜色/间距/圆角值：

```python
for token, expected_oklch in token_truth.items():
    if expected_oklch in document_content:
        print(f"✅ {token}: {expected_oklch}")
    else:
        print(f"⚠️ {token}: {expected_oklch} 未出现或不符")
```

额外查检：

- 凡 CSS Token 映射表，**三列（figma 变量名 / tailwind 工具类 / css 值）是否齐全**；无 figma 对应项的任意值工具类是否至少两列（R1）
- 间距是否落在 2/4/8/12/16/24…；圆角是否落在 4/6/8/12px 阶梯；非标值是否在 figma 列标注（R3）
- 三列中任一列与真值源不符 → 先给「以哪个值为准」方案，用户定夺后再改另两列（R4）

---

## 设计检查清单（交付前逐项打勾）

- [ ] 模板章节/格式未改动（无序列表没改成表格、标题顺序保持）
- [ ] 默认值列表达来源语义，无硬编码值与说明矛盾
- [ ] 所有映射表每一行完整，无空列、无 "-" 占位
- [ ] 公开 API 枚举与 Token 内部名的别名关系明确标注
- [ ] 枚举值在 Props ↔ 映射表 ↔ 组合规则 ↔ 示例 四处完全一致
- [ ] Token 值引用与 Token 映射表真值完全一致
- [ ] **所有 CSS Token 映射表含三列；无 figma 对应项时至少两列（tailwind 工具类 + css 值）**（R1）
- [ ] **间距/圆角落标准档；非标值已标注**（R3）
- [ ] **三列不一致时已先给方案让用户定夺**（R4）
- [ ] 优先级链在设计决策阶段已画清，组合规则里明确写出
- [ ] 边界条件（如仅 variant 显式 + color 隐式）在组合规则里有独立规则 + 示例
- [ ] 使用示例按递进层次组织，覆盖所有主要组合
- [ ] **已产出「可拆分复用工具」清单（工具名 / 形态 / 说明 / 复用范围）；无候选时已写明「无」**（铁律 11 / R7）
- [ ] 文档写入后 fetch 确认 revision 递增 + block-id 变化

---

## 参考案例

以下是一个完整的 Button 组件 API 契约设计案例，展示上述通用流程如何落地。

### 组件基本信息

| 项       | 值                                                 |
| -------- | -------------------------------------------------- |
| 组件     | Button（原子交互元素）                             |
| 类型归类 | 原子交互元素                                       |
| 参考库   | AntD Button 5.x、Base UI、shadcn/ui                |
| 设计模式 | 形状/颜色分离 + preset 推荐组合 + 纯展示无内部状态 |

### 设计决策点产出

**6 种预设**：`default / primary / success / warning / danger / info`

- preset="default" → outlined + info（灰色描边，中性按钮）
- 其余 5 种 → solid + 对应 color（实心彩色按钮）

**三层优先级链**：

```
① prop 显式传入（variant / color）    → 最高优先级
② preset 推荐值（preset 默认 "default"） → 同时决定形状和颜色
③ variant 自带默认色（锚定 --primary）  → color 的兜底路径
```

**variant 枚举（6 种形状，无颜色含义）**：

| variant  | 语义 | 仅 variant 模式下默认色              | hover                   |
| -------- | ---- | ------------------------------------ | ----------------------- |
| solid    | 实心 | bg-primary + text-primary-foreground | opacity 70%             |
| outlined | 描边 | border-primary + text-primary        | opacity 70%             |
| dashed   | 虚线 | border-primary-dashed + text-primary | opacity 70%             |
| ghost    | 幽灵 | text-primary + transparent bg        | opacity 70%             |
| link     | 链接 | text-primary                         | underline（透明度不变） |
| text     | 文字 | text-primary + transparent bg        | opacity 70%             |

**边界条件显式写入**："仅 variant 显式传入（preset/color 均隐式）时，variant 决定形状，color 走该 variant 的映射表默认色（锚定 --primary）"

**loading 设计**：`loading: boolean` + `icon: React.ReactNode`（普通状态作前缀图标，loading=true 时自动作为加载图标，未传时内置旋转 loader）

### Props 表关键行摘录

| 名称    | 类型                                      | 默认值      | 受控 | 说明                                                             |
| ------- | ----------------------------------------- | ----------- | ---- | ---------------------------------------------------------------- |
| preset  | `"default" \| "primary" \| ...`           | `"default"` | —    | 预设主题，提供 variant + color 推荐组合                          |
| variant | `"solid" \| "outlined" \| ...`            | `undefined` | —    | 按钮形状。未传入时由 preset 决定。显式传入覆盖 preset            |
| color   | `"primary" \| "success" \| ... \| string` | `undefined` | —    | 语义颜色。未传入时由 preset 或 variant 默认值决定                |
| icon    | `React.ReactNode`                         | `—`         | —    | 独立图标 prop。普通状态前缀图标，loading=true 时自动作为加载图标 |
| loading | `boolean`                                 | `false`     | ✅   | 加载态。true 时自动 disabled + 阻止点击                          |

### 迭代历史（9 轮）

| 轮次  | 问题                                                       | 修复                                                                                           |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1 → 2 | 模板无序列表擅自改成表格                                   | 改回 `<ul>`                                                                                    |
| 3     | variant 默认值硬编码 `"solid"` 与说明"从 preset 继承"矛盾  | 默认值列改 `undefined`                                                                         |
| 4     | preset="default" color 列空                                | 补 `"info"`                                                                                    |
| 5     | variant 枚举 Props(5) ≠ 映射表(6) ≠ 示例                   | 三处对齐                                                                                       |
| 6     | color prop 枚举缺别名说明                                  | 公开只用 `"danger"`，Token 名 `--destructive` 在映射表说明                                     |
| 7     | 当时 `--info` 为 #00B2F8，却误写成 `#999999`（弱化文字值） | 对照真值源改 `#00B2F8`（⚠️ 2026-09-22 起本项目 `--info` 已正式改为 #999999，此条仅作历史留档） |
| 8     | 未显式增加 `text` variant                                  | 新增并区分 link（underline）vs text（opacity 70%）hover                                        |
| 9     | 边界条件"仅 variant 显式"未写进组合规则                    | 补一行规则 + 示例                                                                              |

### Token 真值清单（以 src/global.css / token-v1.md 为准）

| Token                  | OKLCH                         | HEX     | 说明                                                       |
| ---------------------- | ----------------------------- | ------- | ---------------------------------------------------------- |
| `--primary`            | oklch(0.639 0.149 247.984)    | #3091E1 | 品牌主色                                                   |
| `--primary-foreground` | oklch(0.985 0 0)              | #FCFCFC | 主色反白                                                   |
| `--destructive`        | oklch(0.636 0.244 24.335)     | #FD2237 | 危险红（公开别名 `"danger"`）                              |
| `--success`            | oklch(0.7735 0.2095 146.6446) | #3AD75C | 成功绿                                                     |
| `--warning`            | oklch(0.6945 0.2026 43.1038)  | #FE660A | 警告橙                                                     |
| `--info`               | oklch(0.682 0 0)              | #999999 | 信息灰（与 --subtle-foreground 同值；旧值 #00B2F8 已作废） |
| `--subtle-foreground`  | oklch(0.682 0 0)              | #999999 | 弱化文字（与 --info 同值）                                 |
| `--background`         | oklch(0.967 0.006 264.532)    | #F2F4F8 | 页面背景                                                   |
| `--secondary`          | oklch(0.955 0 0)              | #F0F0F0 | 交互面                                                     |
| `--border`             | oklch(0.885 0 0)              | #D9D9D9 | 描边                                                       |

---

## 参考资源 / Resources

- `references/token-v1.md`：飞书《CSS Token 映射表 V1》离线快照（figma / tailwind / css 三列），离线可用；以 `src/global.css` 为最终权威，V2 发布或改 token 时更新。
- `references/contract-template.md`：组件契约 Markdown 本地模板（含三列尺寸表 / 样式映射表骨架），用于新建本地契约文档。
- `references/feishu-writeback-sop.md`：飞书回写 SOP（命令形态 / `<tag>` 剥离坑与转义对照表 / 回读核验清单）＋ 原 `feishu-design-contract` skill 并入的设计方法论补充（完整章节骨架 A.1 / 视觉表标准列 / 决策先问用户 / 控件边界 / 流程纪律）。**2026-09-24 起本 skill 为该领域唯一正本，本地 `feishu-design-contract` 已废弃。**
- 飞书《CSS Token 映射表 V1》在线真值源（设计模式下通过 `lark-cli docs +fetch` 获取最新）。
- 项目 `src/global.css`：本项目色彩/间距/圆角 token 的唯一真源（见 AGENTS.md）。
