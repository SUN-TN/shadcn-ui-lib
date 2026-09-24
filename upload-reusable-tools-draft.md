# Upload 组件可复用工具提取清单（已回写）

> **状态：✅ 已回写飞书**。2026-09-24 通过 `docs +update --command block_insert_after` 追加至《组件库范围与 MVP 清单》§4.7（两次写入：工具清单 revision 16、实现策略 revision 17，warnings 均为空）。
> **来源**：《组件 API 契约：Upload》（wiki token `WbZCwgWVniWuNgkYEqCcvTd2nsc`，revision 17）
> **目标**：《组件库范围与 MVP 清单》（wiki token `HwqYwYxeliEhdYkqYTacKJgxnAf`）§4.7「工具与资源」
> **日期**：2026-09-24

---

## 1. 目的与范围

- **目的**：从 Upload 组件契约中提取「与 UI 解耦、可被多个组件复用」的逻辑点，作为 §4.7 的补充小节。
- **范围**：仅基于 Upload 契约逐条提取（§1、§2.1、§3、§4、§5、§6、§8、§9、§10、§11、§12、§13、§14、§15、决策记录）。
- **不在范围**：视觉 / 样式（Token、§7 状态矩阵）、纯展示组件（List / Table）、组件对外 API 本体。

## 2. 提取原则

| 原则    | 判定标准                                                                      |
| ------- | ----------------------------------------------------------------------------- |
| UI 解耦 | 逻辑可脱离 Upload 渲染结构独立存在                                            |
| 可复用  | 至少能被 §1.2 列出的下游复用（Avatar 头像、图片九宫格、富文本配图、表单附件） |
| 可分发  | 形态可归入本库既有资源类别（Hooks / Utils / 类型契约）                        |
| 可测试  | 纯函数优先；副作用集中且可注入                                                |

## 3. 已裁决决策

| #   | 决策项   | 结论                                                                                   |
| --- | -------- | -------------------------------------------------------------------------------------- |
| 1   | 分类维度 | **按功能域**（传输 / 校验 / 模型状态 / 读取预览 / 交互与可访问性）                     |
| 2   | 小节粒度 | **5 类**（`buildFormData` 并入「传输与 I/O」；拖拽与可访问性合并为「交互与可访问性」） |
| 3   | 范围     | **仅 Upload + 通用性标注**（表格增「复用范围」列：全库通用 / Upload 专用）             |
| 4   | 类型契约 | **纳入**（`UploadRequestOption` 等以「形态 = 类型契约」标注）                          |

---

## 4. 候选工具清单（共 25 项：★核心 18 / ○次要 7）

> **形态**：`Utils`＝纯函数 / 工具模块；`Hook`＝React 组合逻辑；`类型契约`＝TS 类型定义。
> **复用范围**：`全库通用`＝与 Upload 无强耦合、任何组件可用；`Upload 专用`＝语义绑定 Upload 契约，但可被上传类组合组件复用。
> **优先级**：`★`＝本期建议优先封装；`○`＝可延后。

### 4.1 传输与 I/O

| 编号 | 工具（建议命名）                              | 形态     | 说明                                                                                                                                                             | 来源      | 复用范围    | 优先级 |
| ---- | --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- | ------ |
| A1   | `xhrUpload(options)`                          | Utils    | **原生 XHR** 实现 `multipart/form-data` 上传；支持 `name / headers / data / method / withCredentials`，回调 `onProgress / onSuccess / onError`，返回 `{ abort }` | §12       | 全库通用    | ★      |
| A2   | `toUploadPercent(event)`                      | Utils    | XHR `ProgressEvent` → `{ percent: 0–100 }`，处理 `lengthComputable === false` 降级                                                                               | §12       | 全库通用    | ★      |
| A3   | `UploadRequestOption` / `UploadRequestReturn` | 类型契约 | `customRequest` 统一契约类型（含可选 `abort` 句柄）                                                                                                              | §12       | Upload 专用 | ★      |
| A4   | `resolveUploadRequest()`                      | Utils    | 按「有 `action` 走内置 XHR、有 `customRequest` 走自定义」分发                                                                                                    | §12       | Upload 专用 | ○      |
| A5   | `buildFormData(file, data, name)`             | Utils    | multipart 表单体构造（字段名默认 `file` + 附加业务字段）                                                                                                         | §12 / §14 | 全库通用    | ★      |

### 4.2 文件校验

| 编号 | 工具（建议命名）                   | 形态          | 说明                                                                                   | 来源     | 复用范围    | 优先级 |
| ---- | ---------------------------------- | ------------- | -------------------------------------------------------------------------------------- | -------- | ----------- | ------ |
| B1   | `parseAccept(accept)`              | Utils         | 解析 `"image/*,.pdf"` 为 MIME 通配 + 扩展名规则集                                      | §13      | 全库通用    | ★      |
| B2   | `matchAccept(file, accept)`        | Utils         | 文件与 `accept` 匹配；**选择与拖入二次校验共用**                                       | §13 / §8 | 全库通用    | ★      |
| B3   | `validateMaxSize(file, maxSize)`   | Utils         | 体积（字节）校验，返回布尔 + 错误文案                                                  | §13      | 全库通用    | ★      |
| B4   | `validateMaxCount(list, maxCount)` | Utils         | 数量校验；含「单文件模式选新替旧」策略                                                 | §13 / §8 | 全库通用    | ★      |
| B5   | `getImageDimensions(file)`         | Utils（异步） | 图片尺寸探测，服务「图片尺寸」等复杂规则                                               | §13      | 全库通用    | ○      |
| B6   | `runBeforeUpload(fn, file, list)`  | Utils（异步） | 统一 `beforeUpload` 语义：`boolean` / `Promise<boolean>` / 返回 `Blob·File` 替换源文件 | §13 / §3 | Upload 专用 | ★      |

### 4.3 文件模型与状态

| 编号 | 工具（建议命名）                             | 形态  | 说明                                                                                                | 来源     | 复用范围    | 优先级 |
| ---- | -------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- | -------- | ----------- | ------ |
| C1   | `createUploadFile(file)` / `normalizeFile()` | Utils | 原生 `File` → `UploadFile`（`uid / name / size / type / originFile / status / percent / response`） | §3 / §14 | Upload 专用 | ★      |
| C2   | `genUid()`                                   | Utils | 稳定唯一标识（列表 key + 操作定位）                                                                 | §3       | 全库通用    | ★      |
| C3   | `fileStatusReducer`                          | Utils | 状态流转 `selected → uploading → done / error → removed`，含 `retry` / `abort` 分支                 | §11      | Upload 专用 | ★      |
| C4   | `useControllableFileList()`                  | Hook  | 受控（`fileList`）/ 非受控（`defaultFileList`）+ `onChange` 回流 + 上传态内部托管                   | §14      | Upload 专用 | ★      |
| C5   | `emitUploadChange(info)`                     | Utils | 统一变更通道：由 `onChange` 派生 `onSuccess / onError / onProgress`，避免重复派发                   | §4       | Upload 专用 | ○      |

### 4.4 文件读取与预览

| 编号 | 工具（建议命名）                                         | 形态          | 说明                                                                      | 来源        | 复用范围 | 优先级 |
| ---- | -------------------------------------------------------- | ------------- | ------------------------------------------------------------------------- | ----------- | -------- | ------ |
| D1   | `useObjectUrl(file)`（含 `createPreviewUrl` / `revoke`） | Hook + Utils  | 缩略图 / 预览 URL 生成与**自动回收**，规避 `URL.createObjectURL` 内存泄漏 | §2.1 / §7.3 | 全库通用 | ★      |
| D2   | `readFileAs(file, 'dataURL' \| 'text' \| 'arrayBuffer')` | Utils（异步） | `FileReader` 统一封装                                                     | §3          | 全库通用 | ○      |
| D3   | `downloadFile(url, filename)`                            | Utils         | 触发浏览器下载（支撑 `onDownload`）                                       | §4 / §5     | 全库通用 | ○      |

### 4.5 交互与可访问性

| 编号 | 工具（建议命名）                      | 形态        | 说明                                                                                        | 来源        | 复用范围 | 优先级 |
| ---- | ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- | ----------- | -------- | ------ |
| E1   | `useDropZone(options)`                | Hook        | `dragenter / dragover / dragleave / drop` 编排 + `dragover` 阻止默认 + `dragleave` 抖动抑制 | §2.1 / §7.1 | 全库通用 | ★      |
| E2   | `extractDroppedFiles(dataTransfer)`   | Utils       | `DataTransfer` → `File[]`（含目录项过滤）                                                   | §13 / §8    | 全库通用 | ★      |
| F1   | `useFileInput()` / `openFileDialog()` | Hook        | 隐藏 `input[type=file]` 控制 + `accept / disabled / multiple` 透传 + `label` 关联           | §6 / §9     | 全库通用 | ★      |
| F2   | `usePrefersReducedMotion()`           | Hook        | 检测 `prefers-reduced-motion`，关闭进度动画                                                 | §9          | 全库通用 | ★      |
| F3   | `useKeyActivation()`                  | Hook        | `Enter / Space` 键盘激活（非按钮触发区）                                                    | §9          | 全库通用 | ○      |
| F4   | `ImagePreview`（Dialog 封装）         | 组件 / 工具 | 图片大图预览（Base UI Dialog + 焦点陷阱），`onPreview` 可覆盖                               | §1.1 / §5   | 全库通用 | ○      |

**统计**：全库通用 18 项 / Upload 专用 7 项；★核心 18 项 / ○次要 7 项。

---

## 5. 拟回写内容（精确 Markdown，落至 §4.7 之后）

### 4.7 工具与资源

Icon、Hooks、Utils、Token、主题切换、Storybook 装饰器、测试工具。

> **可复用工具（自 Upload 组件契约提取）**：以下为从《组件 API 契约：Upload》反推、可封装为跨组件复用的工具候选。`形态` 区分 Utils / Hook / 类型契约，`复用范围` 区分「全库通用 / Upload 专用」，`★` 为本期建议优先封装项。

#### 4.7.1 传输与 I/O

| 工具                                            | 形态     | 说明                                                                 | 复用范围    |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------- | ----------- |
| `xhrUpload` ★                                   | Utils    | 原生 XHR 实现 multipart/form-data 上传（进度 / 取消 / 请求头与凭证） | 全库通用    |
| `toUploadPercent` ★                             | Utils    | XHR 进度事件 → 0–100 归一化                                          | 全库通用    |
| `UploadRequestOption` / `UploadRequestReturn` ★ | 类型契约 | customRequest 统一契约类型                                           | Upload 专用 |
| `resolveUploadRequest` ○                        | Utils    | action / customRequest 分发                                          | Upload 专用 |
| `buildFormData` ★                               | Utils    | multipart 表单体构造                                                 | 全库通用    |

#### 4.7.2 文件校验

| 工具                   | 形态  | 说明                                          | 复用范围    |
| ---------------------- | ----- | --------------------------------------------- | ----------- |
| `parseAccept` ★        | Utils | accept 字符串解析为 MIME / 扩展名规则         | 全库通用    |
| `matchAccept` ★        | Utils | 文件与 accept 匹配（选择 + 拖入二次校验共用） | 全库通用    |
| `validateMaxSize` ★    | Utils | 体积校验                                      | 全库通用    |
| `validateMaxCount` ★   | Utils | 数量校验 + 单文件选新替旧                     | 全库通用    |
| `getImageDimensions` ○ | Utils | 图片尺寸探测                                  | 全库通用    |
| `runBeforeUpload` ★    | Utils | beforeUpload 同步 / 异步 / 替换源文件统一语义 | Upload 专用 |

#### 4.7.3 文件模型与状态

| 工具                                   | 形态  | 说明                                                        | 复用范围    |
| -------------------------------------- | ----- | ----------------------------------------------------------- | ----------- |
| `createUploadFile` / `normalizeFile` ★ | Utils | 原生 File → UploadFile 归一化                               | Upload 专用 |
| `genUid` ★                             | Utils | 稳定唯一标识                                                | 全库通用    |
| `fileStatusReducer` ★                  | Utils | 文件状态机（selected → uploading → done / error → removed） | Upload 专用 |
| `useControllableFileList` ★            | Hook  | 受控 / 非受控列表 + onChange 回流 + 上传态托管              | Upload 专用 |
| `emitUploadChange` ○                   | Utils | 统一变更通道与便捷回调派生                                  | Upload 专用 |

#### 4.7.4 文件读取与预览

| 工具             | 形态         | 说明                                  | 复用范围 |
| ---------------- | ------------ | ------------------------------------- | -------- |
| `useObjectUrl` ★ | Hook + Utils | 预览 URL 生成与自动回收（防内存泄漏） | 全库通用 |
| `readFileAs` ○   | Utils        | FileReader 统一封装                   | 全库通用 |
| `downloadFile` ○ | Utils        | 触发浏览器下载                        | 全库通用 |

#### 4.7.5 交互与可访问性

| 工具                                | 形态        | 说明                                                  | 复用范围 |
| ----------------------------------- | ----------- | ----------------------------------------------------- | -------- |
| `useDropZone` ★                     | Hook        | 拖拽事件编排 + dragover 阻止默认 + dragleave 抖动抑制 | 全库通用 |
| `extractDroppedFiles` ★             | Utils       | DataTransfer → File[]                                 | 全库通用 |
| `useFileInput` / `openFileDialog` ★ | Hook        | 隐藏 file input 控制与属性透传                        | 全库通用 |
| `usePrefersReducedMotion` ★         | Hook        | prefers-reduced-motion 检测                           | 全库通用 |
| `useKeyActivation` ○                | Hook        | Enter / Space 键盘激活                                | 全库通用 |
| `ImagePreview` ○                    | 组件 / 工具 | 大图预览（Dialog 封装）                               | 全库通用 |

---

## 6. 回写记录

上述 §5 内容已于 2026-09-24 追加至《组件库范围与 MVP 清单》§4.7 之下（`block_insert_after`，保留原文首行与结尾 `hr`），并新增 §4.7.6「实现策略」小节。

---

## 7. 实现策略：原生优先（已决议 · 已回写为 §4.7.6）

**结论**：25 项工具全部**在库中原生实现**，不引入成熟三方库。

**决定性依据**：本库为 registry 分发型，`scripts/generate-registry.cjs` 会**从源码裸 import 自动提取 npm 包名写入 `dependencies`**（仅 `react`/`react-dom` 排除）。因此任一工具文件中的三方 import 都会**自动成为所有下游项目的强制安装项**，无法由业务方回避，直接侵蚀「零依赖、源码即交付」的分发定位。

| 处置            | 数量 | 工具 / 依据                                                                                                                                                   |
| --------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 纯原生 · 零依赖 | 23   | 依赖浏览器原生能力：XHR、FormData、`URL.createObjectURL`、`File.text()/arrayBuffer()`、`createImageBitmap`、`crypto.randomUUID`、`matchMedia`、`DataTransfer` |
| 原生 + 单测     | 1    | `useDropZone`：DnD 边界多（`dragleave` 抖动、目录拖入、`DataTransfer.items` 遍历），需单测覆盖                                                                |
| 复用既有依赖    | 1    | `ImagePreview`：使用已在依赖中的 Base UI Dialog，不新增                                                                                                       |
| 需新增三方      | 0    | 仅未来「EXIF 方向纠正（exifr）/ 按内容嗅探 MIME（file-type）」等**原生无等价 API** 的能力才考虑，且不在 v1 范围                                               |

**原生 vs 三方 对比（决策依据）**

| 维度         | 原生自研                                                             | 引入三方库                                                                        |
| ------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 下游安装成本 | 0（纯源码）                                                          | 每个 import 自动进 `dependencies`，全量下游强制安装                               |
| 契约贴合度   | 完全贴合（`UploadRequestOption` / `abort` / 状态机按本项目契约设计） | API 形状不同，需额外包适配层                                                      |
| 可读可改     | 源码即交付物，符合 shadcn「own your code」                           | 黑盒，业务方改不了                                                                |
| 体积         | 数百字节级                                                           | tree-shake 后仍常带冗余 + 传递依赖                                                |
| 维护与供应链 | 自维护，随契约演进                                                   | 受上游破坏性变更、安全公告、版本冲突牵制                                          |
| 工程摩擦     | 无                                                                   | 本库 pnpm 沙箱受限，新增依赖需人工 `pnpm install`；TS 6 strict 下类型适配另有成本 |
| 边界正确性   | 需自己覆盖（**唯一劣势**，用单测兜）                                 | 成熟库已被大量真实场景验证                                                        |

**技术要点（须落到实现）**

1. `xhrUpload` 用 XHR 而非 `fetch` —— `fetch` 无法上报上传进度（无 upload progress 事件），XHR 是唯一提供 `progress` 事件的标准 API。契约 §12 的选择成立，非技术债。
2. `genUid` 若用 `crypto.randomUUID()` **必须内置回退**（时间戳 + 随机数）—— 该 API 仅在 secure context（https / localhost）可用。
3. 若未来确需三方，须**先改造 `generate-registry.cjs` 支持可选依赖**（`optionalDependencies` 白名单，或把适配器拆为独立 registry 项由用户显式安装）；否则裸 import 仍会变成硬依赖。
4. `getImageDimensions` 优先 `createImageBitmap(file)`（零依赖）；如需更宽兼容可回退 `Image` + `URL.createObjectURL`。
