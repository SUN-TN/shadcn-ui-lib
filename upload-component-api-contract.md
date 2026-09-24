# 组件 API 契约：Upload

> 本文档定义 Upload（文件上传）组件的对外 API 契约与设计要点，供设计、前端、测试三方对齐实现。所有接口条目为必须遵循的契约；标注「建议 / 推荐」的条目为设计取舍说明，不强制实现。

---

## 0. 元信息

- 组件名：Upload
- 分类：表单 / 数据录入（文件上传）
- 版本：v1.0.0
- 状态：评审中
- 负责人：（待填）
- 设计负责人：（待填）
- 评审人：（待填）
- 最后更新：2026-09-24
- 飞书文档：https://kcnq8ppkkxh2.feishu.cn/wiki/WbZCwgWVniWuNgkYEqCvcTd2nsc（v1 契约已回写）
- 关联文档：[CSS Token 映射表 V1](https://kcnq8ppkkxh2.feishu.cn/wiki/N8CUw90lViYpmPkbuVrc8675nsf)、[Textarea 组件契约（参考）](https://kcnq8ppkkxh2.feishu.cn/wiki/TWSuwCnk5igwIskXlwMcIteRnve)、Input 组件契约（参考）、Base UI 文档
- 依赖基座：Base UI（`@base-ui/react`，交互原语）+ Tailwind CSS v4（样式）+ 原生 File API / XHR（文件 I/O 编排）
- **主题说明**：暂不做暗色模式，与 Token 映射表 V1 第十二节结论一致（仅实现亮色）。

---

## 1. 概述

- 用途：将本地文件（图片 / 文档 / 媒体等）上传至服务端，并管理「选择 → 上传中 → 完成 / 失败 → 预览 / 删除」全生命周期。
- 使用场景：头像 / 封面上传、富文本配图、表单附件、批量图片（九宫格）、文档导入、拖拽上传区。
- 不适用场景：
  - 纯展示已有文件列表 → 用 List / Table；
  - 大文件分片 / 断点续传等复杂协议 → 由 `customRequest` 自行实现，组件不内置；
  - 实时音视频录制上传 → 超出 v1。

### 1.1 依赖组件（上游）

Upload 自身不重复造轮子，基础交互能力由以下组件 / 运行时 API 提供：

| 依赖项                                   | 用途                                        | 说明                                                                         |
| ---------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Base UI `Button`                         | 默认上传触发器（主色按钮）                  | 无 `children` 时渲染；`bg-primary text-primary-foreground`                   |
| Base UI `Progress`                       | 文件项 / 卡片的上传进度指示                 | track `bg-muted` / indicator `bg-primary`；含 `aria-valuenow` 等可访问性属性 |
| Base UI `Dialog`                         | 图片点击后的大图预览                        | 焦点陷阱 + 遮罩（`bg-ink/60`）                                               |
| Base UI `DropdownMenu` / `Menu`          | 单文件操作菜单（预览 / 下载 / 删除 / 重试） | 列表项操作聚合，避免图标过载                                                 |
| Base UI `Tooltip`                        | 操作图标的悬停提示                          | 如「删除」「预览」语义说明                                                   |
| 原生 `input[type=file]` + File API + XHR | 文件选择与上传编排                          | 非组件依赖，属浏览器运行时 API；隐藏 input 关联 `label` / `aria`             |
| `Form` / `Form.Item`（可选）             | 受控集成时的表单字段包装                    | v1 不内置适配，由业务层组合；通过 `name` 字段透传                            |

### 1.2 被依赖组件（下游 / 组合封装）

Upload 作为通用上传基座，预期被以下组合封装或业务组件复用，而非独立堆砌功能：

| 被依赖方                            | 组合方式                                        | 说明                                                                |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `Form.Item`                         | 表单字段包装                                    | 以 `name` 走原生 form 提交；受控模式由 `fileList` + `onChange` 回流 |
| 头像上传（`Avatar` 封装）           | `Upload` + `picture-card` + `maxCount={1}`      | 单文件、选新替旧、圆形裁切由封装层处理                              |
| 图片九宫格（`ImageUploader` 封装）  | `Upload` + `picture-card` + `drag` + `multiple` | 通用图片选择器，封装 `maxCount` / 校验                              |
| 富文本配图（`RichText` / `Editor`） | 插入图片时调用上传入口                          | 由编辑器回调触发 `customRequest` 或 `action`                        |
| 业务上传区块（附件区 / 封面区）     | 各业务页面基于 `Upload` 组合                    | 拖拽区、限制类型 / 体积等由业务层配置                               |

---

## 2. 设计变体映射

Upload 的「变体」体现为**列表视觉形态 + 交互模式**的组合，统一映射到 Props。

| 设计变体           | Props 取值                | 说明                                             |
| ------------------ | ------------------------- | ------------------------------------------------ |
| 文字列表（默认）   | `listType="text"`         | 文件名 + 进度条 + 操作图标，纵向排列             |
| 图片列表           | `listType="picture"`      | 文字列表左侧附加缩略图                           |
| 图片卡片（九宫格） | `listType="picture-card"` | 卡片网格，末位为「+」上传入口                    |
| 拖拽区             | `drag={true}`             | 触发区变为虚线 dropzone，可叠加于任一 `listType` |
| 单文件模式         | `maxCount={1}`            | 选择新文件替换旧文件（强约束）                   |
| 禁用               | `disabled`                | 不可选择 / 拖拽 / 操作                           |
| 手动上传           | `autoUpload={false}`      | 选完不自动上传，调用 `ref.upload()` 触发         |
| 自定义触发         | `children`                | 以任意元素作为触发器，覆盖默认上传按钮           |

### 2.1 picture-card 详细规格（推荐方案）

`listType="picture-card"` 以**正方形卡片网格**呈现，末位为「+」上传入口，对齐九宫格心智模型。以下为推荐落地规格（默认即此；如需固定列数可经 `className` / `style` 覆盖）。

**布局模型**

- 容器：`display: grid`；列数采用自适应 `grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))`。
  - `minmax(80px, 1fr)`：每张卡最小 80px、最大均分剩余空间；`auto-fill`：列数随容器宽度自动增减（手机约 3 列、平板 4–5 列、宽桌面更多）。
- 间距：`gap-2`（8px，8px 栅格），与九宫格密度一致。
- 卡片比例：正方形 `aspect-square`（缩略图以方图为主），高度随列宽自动等高，网格整齐。
- 圆角：`rounded-md`（6px，Token 基础圆角）。

**「+」上传入口**

- 位于网格**末位**（第 N+1 格），虚线浅底：`border-2 border-dashed border-input bg-muted/40 hover:border-primary`，居中加号图标，`aria-label="上传文件"`。
- 达 `maxCount` 后该卡**隐藏**（非禁用），避免误导。

**卡片状态表现**（对齐 §7.3 视觉表）

- 默认：缩略图 `object-cover` 占满；hover 遮罩 `absolute inset-0 bg-ink/60`，其上居中操作图标（`text-primary-foreground`，预览 / 删除）。
- 上传中：遮罩 `bg-ink/60` + 居中进度环（Base UI Progress `indicator bg-primary`），可取消。
- 完成：缩略图 + hover 操作（预览 / 删除）。
- 错误：缩略图灰（`bg-muted` 叠层）+ 危险图标 `text-destructive` + 重试 / 删除。

**拖拽叠加（`drag=true`）**

- 整个网格容器（含「+」卡）成为 dropzone：外套 `border-2 border-dashed border-input bg-background`；拖入悬停变 `border-primary bg-primary/10 ring-2 ring-ring/50`（对齐 §7.1 dragover）。
- 松手落地受 `accept` / `maxCount` / `maxSize` 校验。

**与 `maxCount` 关系**

- 限制文件卡总数；`maxCount=9` → 最多 9 张文件卡 + 1 张「+」入口（满后隐藏「+」）。

**响应式**（对齐 §10）

- < 640px：自适应降列，卡片最小 80px 保证可点（触控目标 ≥ 44px 由卡尺寸保证）；触发按钮字号 ≥ 16px。
- ≥ 640px：`auto-fill` 随容器增列，不写死。

**可访问性**（对齐 §9）

- 每张卡 `role="listitem"`；「+」卡与操作图标为可聚焦按钮并带 `aria-label`；进度由 Base UI Progress 提供 `aria-valuenow`。

**为何默认自适应而非固定 4 列**

1. 移动端优先：手机宽 ~320–390px，固定 4 列 → 每列 ~70–85px（扣 gap 更小），缩略图与操作图标拥挤，触控目标 < 44px，不符可达性。
2. 容器宽度不固定：Upload 常嵌套表单列 / 弹窗 / 侧栏，固定 4 列在窄容器溢出或留白。
3. `auto-fill` + `minmax` 为 CSS 原生响应式，零 JS、零断点硬编码，维护成本低。
4. 九宫格为常见形态非硬约束；业务强需 4 列可经 `grid-cols-4` 覆盖，不影响默认。

---

## 3. Props

| 名称              | 类型                                                           | 默认值               | 必填 | 受控 | 枚举 / 范围   | 说明                                                                                                               |
| ----------------- | -------------------------------------------------------------- | -------------------- | ---- | ---- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `fileList`        | `UploadFile[]`                                                 | —                    | 否   | 是   | —             | 受控文件列表；传入后为受控模式                                                                                     |
| `defaultFileList` | `UploadFile[]`                                                 | `[]`                 | 否   | 否   | —             | 非受控初始列表                                                                                                     |
| `onChange`        | `(info: UploadChangeParam) => void`                            | —                    | 否   | —    | —             | 文件状态变化统一回调（选择 / 进度 / 成功 / 失败 / 删除），受控模式唯一更新入口                                     |
| `listType`        | `'text' \| 'picture' \| 'picture-card'`                        | `'text'`             | 否   | —    | —             | 列表视觉形态                                                                                                       |
| `drag`            | `boolean`                                                      | `false`              | 否   | —    | —             | 启用拖拽区（dropzone），可与任一 `listType` 叠加                                                                   |
| `multiple`        | `boolean`                                                      | `false`              | 否   | —    | —             | 是否允许一次选择多个文件（单文件模式忽略）                                                                         |
| `accept`          | `string`                                                       | —                    | 否   | —    | MIME / 扩展名 | 原生 `accept`，如 `"image/*,.pdf"`；拖入时二次校验                                                                 |
| `maxCount`        | `number`                                                       | —                    | 否   | —    | ≥1            | 最大文件数；超出拦截并反馈 warning                                                                                 |
| `disabled`        | `boolean`                                                      | `false`              | 否   | —    | —             | 禁用全部交互                                                                                                       |
| `showUploadList`  | `boolean \| ShowUploadList`                                    | `true`               | 否   | —    | —             | 是否渲染文件列表；对象形式控制各操作图标显隐（见 §5）                                                              |
| `action`          | `string`                                                       | —                    | 否   | —    | —             | 内置默认上传地址（`customRequest` 缺省时生效）                                                                     |
| `headers`         | `Record<string, string>`                                       | —                    | 否   | —    | —             | 内置上传请求头                                                                                                     |
| `data`            | `Record<string, any> \| (file) => Record<string, any>`         | —                    | 否   | —    | —             | 附加表单字段（如 token / 业务参数）                                                                                |
| `name`            | `string`                                                       | `'file'`             | 否   | —    | —             | multipart 表单字段名                                                                                               |
| `method`          | `string`                                                       | `'POST'`             | 否   | —    | —             | HTTP 方法                                                                                                          |
| `withCredentials` | `boolean`                                                      | `false`              | 否   | —    | —             | 跨域请求是否带凭证                                                                                                 |
| `customRequest`   | `(opt: UploadRequestOption) => UploadRequestReturn`            | —                    | 否   | —    | —             | 自定义上传实现；缺省则用 `action` 内置 XHR                                                                         |
| `beforeUpload`    | `(file, fileList) => boolean \| Promise<void \| Blob \| File>` | —                    | 否   | —    | —             | 上传前校验 / 拦截 / 转换；`false` 阻止，返回 `Blob/File` 替换源文件                                                |
| `beforeRemove`    | `(file) => boolean \| Promise<boolean>`                        | —                    | 否   | —    | —             | 删除前确认；`false` 阻止删除                                                                                       |
| `onRemove`        | `(file) => void`                                               | —                    | 否   | —    | —             | 删除完成回调                                                                                                       |
| `onPreview`       | `(file) => void`                                               | —                    | 否   | —    | —             | 预览回调（图片默认打开 Dialog 大图）                                                                               |
| `onDownload`      | `(file) => void`                                               | —                    | 否   | —    | —             | 下载回调                                                                                                           |
| `onSuccess`       | `(file, response) => void`                                     | —                    | 否   | —    | —             | 便捷成功回调                                                                                                       |
| `onError`         | `(file, error) => void`                                        | —                    | 否   | —    | —             | 便捷失败回调                                                                                                       |
| `onProgress`      | `(file, percent) => void`                                      | —                    | 否   | —    | —             | 便捷进度回调                                                                                                       |
| `progress`        | `{ strokeWidth?: number; showInfo?: boolean }`                 | `{ showInfo: true }` | 否   | —    | —             | 进度条视觉（基于 Base UI Progress）                                                                                |
| `autoUpload`      | `boolean`                                                      | `true`               | 否   | —    | —             | `false` 时选中不自动上传，需 `ref.upload()` 触发（手动上传）                                                       |
| `maxSize`         | `number`                                                       | —                    | 否   | —    | ≥0（字节）    | 便捷体积上限，超限自动标记该文件 `status="error"` 并附错误文案；复杂规则（图片尺寸 / 异步校验）仍用 `beforeUpload` |
| `directory`       | `boolean`                                                      | `false`              | 否   | —    | —             | 文件夹上传（webkitdirectory）                                                                                      |
| `capture`         | `string`                                                       | —                    | 否   | —    | —             | 调用摄像头 / 麦克风（`"user"` / `"environment"`）                                                                  |
| `id`              | `string`                                                       | 自动生成             | 否   | —    | —             | 关联 label / aria                                                                                                  |
| `className`       | `string`                                                       | —                    | 否   | —    | —             | 样式扩展                                                                                                           |
| `style`           | `CSSProperties`                                                | —                    | 否   | —    | —             | 内联样式扩展                                                                                                       |
| `children`        | `ReactNode`                                                    | —                    | 否   | —    | —             | 自定义触发元素；无 `children` 时渲染默认上传按钮                                                                   |

### 关键类型

```ts
interface UploadFile {
  uid: string; // 唯一标识（内部生成）
  name: string;
  status?: 'uploading' | 'done' | 'error'; // 见 §11 状态机
  url?: string; // 已上传地址 / 远程预览地址
  thumbUrl?: string; // 图片本地 / 远程缩略图
  percent?: number; // 0–100
  size?: number;
  type?: string;
  originFile?: File; // 原始 File（非受控态保留）
  response?: unknown; // 服务端响应
  error?: unknown;
}

interface UploadChangeParam {
  file: UploadFile; // 本次变化的目标文件
  fileList: UploadFile[]; // 变化后的完整列表
  event?: ProgressEvent; // 进度事件（可选）
}
```

---

## 4. 事件

| 名称           | 触发时机           | 参数                        | 是否可取消         | disabled 时触发 | 说明                               |
| -------------- | ------------------ | --------------------------- | ------------------ | --------------- | ---------------------------------- |
| `onChange`     | 任一文件状态变化   | `(info: UploadChangeParam)` | 否                 | 否              | 统一状态通道；受控模式唯一更新入口 |
| `beforeUpload` | 上传前（每个文件） | `(file, fileList)`          | 是（`false` 阻止） | 否              | 校验 / 拦截 / 异步校验 / 文件转换  |
| `beforeRemove` | 删除前             | `(file)`                    | 是（`false` 阻止） | 否              | 删除确认                           |
| `onSuccess`    | 单文件上传成功     | `(file, response)`          | 否                 | 否              | 便捷回调                           |
| `onError`      | 单文件失败         | `(file, error)`             | 否                 | 否              | 便捷回调                           |
| `onProgress`   | 进度更新           | `(file, percent)`           | 否                 | 否              | 便捷回调                           |
| `onRemove`     | 删除完成           | `(file)`                    | 否                 | 否              | —                                  |
| `onPreview`    | 点击预览           | `(file)`                    | 否                 | 否              | 图片默认打开 Dialog 大图           |
| `onDownload`   | 点击下载           | `(file)`                    | 否                 | 否              | —                                  |

> 约定：`onChange.file.status` 依次经历 `uploading → done / error`；`onSuccess / onError / onProgress` 为 `onChange` 之上的便利封装，二者来源一致，不重复派发。

---

## 5. Slots / Children

Upload 为**组合式**组件，不通过 `prefix/suffix` 等形式 props 注入装饰：

| 名称                 | 类型        | 是否必需      | 说明                                                                                             |
| -------------------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `children`（触发器） | `ReactNode` | 否            | 自定义触发元素；`drag` 模式下整个 dropzone 即为触发区                                            |
| 默认触发             | 内置按钮    | 否            | 无 `children` 时渲染「上传文件」主按钮（Base UI Button，`bg-primary`）                           |
| 列表项操作           | 内置图标    | 否            | 由 `showUploadList` 控制显隐；默认含预览 / 删除（错误态含重试）                                  |
| 预览大图             | 内置 Dialog | 否            | 图片点击默认打开 Base UI Dialog 大图；`onPreview` 可覆盖                                         |
| 高级列表项自定义     | —           | 否（v1 不做） | v1 不内置 `itemRender`；复杂列表项通过 `showUploadList={false}` + 受控 `fileList` + 自行渲染实现 |

> **为何 v1 不内置 `itemRender`（已确认不与受控语义冲突）**：
>
> - 纯渲染属性 `itemRender(file, actions) => ReactNode` 与受控模式**并不冲突**：`file` 来自受控 `fileList`，`actions`（预览 / 删除 / 重试 / 取消）由组件注入，数据流仍是单一源、逻辑仍在组件内部。
> - v1 不内置的理由是**冗余与一致性**，而非冲突：
>   1. **组合式约定**：本库表单组件（Textarea / Input）的自定义走组合（如 TextareaGroup），而非 render-prop；`itemRender` 是另一种定制风格。
>   2. **已有等价逃生通道**：`showUploadList={false}` 后组件**完全不渲染任何列表项**（含第一个），业务用受控 `fileList` 自行 `.map()` 渲染整张列表，配合 `ref` 命令式 API 驱动动作。该路径**严格包含** `itemRender` 的能力（可复刻任意单条目皮肤，还能自定义布局 / 重排 / 分组），`itemRender` 只是「只换单条目内肤」的窄通道。
>   3. **维护成本**：内置列表 + `itemRender` 两条渲染路径，需为后者再维护一份 token / 样式契约。
> - 因此：复杂列表项通过「`showUploadList={false}` + 受控 `fileList` + 业务自行渲染 + `ref` 驱动」实现，不引入 `itemRender`。

`showUploadList` 对象形态：

```ts
type ShowUploadList = {
  showPreviewIcon?: boolean; // 默认 true（图片）
  showRemoveIcon?: boolean; // 默认 true
  showDownloadIcon?: boolean; // 默认 false
  showProgress?: boolean; // 默认 true
};
```

---

## 6. Ref 方法

React 19 起 `ref` 作为普通 prop 传入，不再使用 `forwardRef`：

- Ref 类型：`React.Ref<UploadRef>`
- 实现方式：ref 作为普通 prop 接收 + `useImperativeHandle` 暴露

```tsx
const ref = useRef<UploadRef>(null);
<Upload ref={ref} autoUpload={false} />;
ref.current?.upload(); // 触发上传
ref.current?.abort(); // 取消进行中上传
ref.current?.clear(); // 清空列表
ref.current?.openFileDialog(); // 程序化打开文件选择框
```

| 名称             | 类型                          | 说明                                                            |
| ---------------- | ----------------------------- | --------------------------------------------------------------- |
| `upload`         | `(file?: UploadFile) => void` | 手动触发上传（`autoUpload=false` 时用）；不传则上传全部未传文件 |
| `abort`          | `(file?: UploadFile) => void` | 取消上传；不传取消全部进行中                                    |
| `clear`          | `() => void`                  | 清空 `fileList`（受控模式需配合 `onChange` 回流）               |
| `openFileDialog` | `() => void`                  | 程序化打开文件选择框（命令式触发）                              |

---

## 7. 状态矩阵（视觉 / Figma 变量 / Tailwind 工具类）

> 颜色以 OKLCH 为权威值，参考 HEX 见 Token 映射表 V1。透明度档（如 `bg-primary/10`）复用 Tailwind 修饰符，不新增 token。

### 7.1 容器 / 触发器

| 状态                 | 是否支持 | 视觉表现                                               | Figma 变量名                                            | Tailwind 工具类                                                                 | 交互行为               | 设计稿 |
| -------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------- | ------ |
| 默认（按钮触发）     | 是       | 主色填充按钮 + 主色前景文字                            | `color/brand/primary`, `color/brand/primary-foreground` | `bg-primary text-primary-foreground rounded-md`                                 | 点击打开选择框         | 待补充 |
| 默认（拖拽区）       | 是       | 虚线边框 + 浅底 + 居中图标与「点击或拖拽文件到此区域」 | `color/border/input`, `color/bg/default`                | `border-2 border-dashed border-input bg-background text-muted-foreground`       | 可点击 / 可拖入        | 待补充 |
| 拖入悬停（dragover） | 是       | 主色虚线 + 主色浅底 + 聚焦环                           | `color/brand/primary`, `color/border/ring`              | `border-2 border-dashed border-primary bg-primary/10 ring-2 ring-ring/50`       | 指针反馈，松手触发选择 | 待补充 |
| focus                | 是       | 蓝色聚焦描边 + 3px 光环（透明度 50%）                  | `color/border/ring`                                     | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` | 键盘 / 点击可达        | 待补充 |
| disabled             | 是       | 灰底 + 灰字 + 不可点光标                               | `color/status/disabled`                                 | `bg-disabled text-disabled cursor-not-allowed pointer-events-none`              | 不可选择 / 拖拽 / 操作 | 待补充 |

### 7.2 文件项（text / picture 列表行）

| 状态   | 是否支持 | 视觉表现                                                          | Figma 变量名                                                                      | Tailwind 工具类                                                                                        | 交互行为         | 设计稿 |
| ------ | -------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------- | ------ |
| 默认项 | 是       | 卡片 / 行背景 + 边框 + 文件名（前景）+ 副信息（弱化）             | `color/bg/card`, `color/border/default`, `color/text/default`, `color/text/muted` | `bg-card border border-border rounded-md text-foreground`（副信息 `text-muted-foreground`）            | 可预览 / 删除    | 待补充 |
| 上传中 | 是       | 进度条（弱化底 + 主色指示）+ 百分比（辅助字号）+ 状态文字（弱化） | `color/bg/muted`（轨道）, `color/brand/primary`（指示）, `color/text/muted`       | Base UI Progress：`track bg-muted` / `indicator bg-primary`；文字 `text-caption text-muted-foreground` | 显示进度，可取消 | 待补充 |
| 完成   | 是       | 成功图标（成功色）+ 文件名（前景）                                | `color/status/success`                                                            | `text-success`（图标） + `text-foreground`（文件名）                                                   | 可预览 / 删除    | 待补充 |
| 错误   | 是       | 危险边框 + 危险图标 + 文件名（危险色）+ 错误文案（危险色）        | `color/status/destructive`                                                        | `border-destructive text-destructive`（图标 / 文件名 / 文案同色）                                      | 可重试 / 删除    | 待补充 |
| 删除后 | 是       | 不渲染                                                            | —                                                                                 | —                                                                                                      | 从列表移除       | 不适用 |

### 7.3 图片卡片（picture-card 网格）

| 状态          | 是否支持 | 视觉表现                                     | Figma 变量名                           | Tailwind 工具类                                                        | 交互行为            | 设计稿 |
| ------------- | -------- | -------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- | ------------------- | ------ |
| 默认卡片      | 是       | 缩略图占满卡片 + hover 遮罩显示操作图标      | `color/ink`（遮罩）                    | `hover:bg-ink/60`（遮罩），图标 `text-primary-foreground`              | 悬停显示预览 / 删除 | 待补充 |
| 上传中卡片    | 是       | 缩略图变暗 + 居中进度环（主色）              | `color/brand/primary`                  | 遮罩 `bg-ink/60` + 进度环 `text-primary`                               | 显示进度，可取消    | 待补充 |
| 完成卡片      | 是       | 缩略图 + hover 操作（预览 / 删除）           | `color/ink`                            | 同默认卡片                                                             | 预览 / 删除         | 待补充 |
| 错误卡片      | 是       | 缩略图灰 + 危险图标 + 重试 / 删除            | `color/status/destructive`             | `text-destructive`（图标）                                             | 重试 / 删除         | 待补充 |
| 「+」上传入口 | 是       | 虚线 / 浅底 + 加号图标；达 `maxCount` 后隐藏 | `color/border/input`, `color/bg/muted` | `border-2 border-dashed border-input bg-muted/40 hover:border-primary` | 点击 / 拖入新增     | 待补充 |

---

## 8. 组合规则

| 组合                               | 是否允许   | 视觉规则                                | 说明             |
| ---------------------------------- | ---------- | --------------------------------------- | ---------------- |
| `listType="picture-card"` + `drag` | 是         | dropzone 包裹卡片网格，新增入口在网格内 | 拖拽落地到卡片区 |
| `maxCount={1}` + `multiple`        | 否（冲突） | 单文件模式强制忽略 `multiple`           | 选新替旧         |
| `showUploadList={false}` + `drag`  | 是         | 仅 dropzone，无列表                     | 纯拖拽上传       |
| `disabled` + 操作图标              | 否         | 禁用态隐藏全部操作                      | —                |
| `accept` + 拖入不符类型            | 否（拦截） | 拖入非 `accept` 文件被拒绝并 warning    | —                |
| `beforeUpload` 返回 `false` + 列表 | 是         | 该文件不进入列表（或不传）              | 校验拦截         |

---

## 9. 可访问性

- **触发器**：按钮语义 `role="button"` + `aria-label="上传文件"`；dropzone 用 `<button>` 或带 `role` + `tabindex` + 键盘支持 `Enter/Space` 打开选择框。
- **原生 input**：`input[type=file]` 视觉隐藏但存在，关联 `label` / `aria`；`accept` / `disabled` 同步透传。
- **列表项**：每项有可访问名称（文件名）；操作按钮有 `aria-label`（删除 / 预览 / 重试）。
- **进度**：`aria-valuenow / aria-valuemin / aria-valuemax` + `aria-live="polite"`（由 Base UI Progress 提供）。
- **状态**：错误项关联 `aria-describedby` 错误信息；语义化 `status="error"`。
- **键盘**：`Tab` 遍历触发区与操作；`Enter/Space` 激活；预览 Dialog 遵循 Base UI 焦点陷阱。
- **对比度**：文件名（`text-foreground` #333）vs 卡片底（#F5F5F5）达标正文标准；占位 / 副信息（`text-subtle-foreground` #999）≥ 3:1（按 1.4.11 图形对象折中）。
- **减少动态**：进度动画尊重 `prefers-reduced-motion`，关闭过渡。

---

## 10. 响应式

| 断点    | 行为                    | 尺寸                | 说明                                                                                       |
| ------- | ----------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| < 640px | 列表 / 卡片宽度撑满容器 | 触发按钮字号 ≥ 16px | 防止 iOS Safari 聚焦自动放大；`picture-card` 列数 `grid auto-fill minmax(80px,1fr)` 自适应 |
| ≥ 640px | 随容器宽度自适应        | 按设计稿            | 桌面端                                                                                     |

---

## 11. 文件状态机

每个文件经历以下生命周期（`status` 字段）：

```
        ┌─────────────┐
        │  selected   │  (加入 fileList，originFile 就绪)
        └──────┬──────┘
               │ beforeUpload 通过
               ▼
        ┌─────────────┐   onProgress    ┌──────────────┐
        │  uploading  │ ───────────────► │  percent 0→100│
        └──────┬──────┘                 └──────┬───────┘
               │ onSuccess                      │ onError
               ▼                                ▼
        ┌─────────────┐                 ┌──────────────┐
        │    done     │                 │    error     │
        └──────┬──────┘                 └──────┬───────┘
               │ remove                         │ retry → uploading
               ▼                                │ remove
        ┌─────────────┐                 ┌───────┴──────┘
        │  removed    │                 │  (removed)
        └─────────────┘                 └──────────────┘

  beforeUpload 返回 false → 不进入列表（拦截）
  uploading 中 abort → 取消并标记 removed（或保留为 selected 待重传，待定）
```

- `uploading` 可通过 `ref.abort()` 取消；`done` / `error` 可通过 `beforeRemove` 守卫后删除。
- `error` 支持重试（`ref.upload(file)` 重新进入 `uploading`）。

---

## 12. 上传策略与 customRequest 契约

**双轨上传**：

1. **内置默认**：未提供 `customRequest` 且提供 `action` 时，组件用 XHR 实现标准 `multipart/form-data` 上传（字段名 `name`，附加 `data / headers / withCredentials / method`）。开箱即用，覆盖最常见后端。
2. **自定义**：提供 `customRequest` 时完全接管上传，适配分片、STS/OSS、WebSocket 进度、字段名差异等任意协议。

```ts
interface UploadRequestOption {
  file: File | UploadFile;
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  name?: string;
  method?: string;
  withCredentials?: boolean;
  onProgress: (event: { percent: number }) => void; // 必须回传 0–100
  onSuccess: (body: unknown, xhr?: XMLHttpRequest) => void;
  onError: (error: Error, xhr?: XMLHttpRequest) => void;
}

type UploadRequestReturn = { abort?: () => void } | void; // 可返回 abort 句柄
```

- `onChange` 为统一回流通道；受控模式 `fileList` 由 `onChange` 维护（组件回写带 `status / percent / response` 的对象）。
- 并发：v1 默认并行上传，不限制并发数；`maxParallel`（并发上传上限）**纳入后续版本开发**，本期不做。

---

## 13. 校验与限制策略

- **类型**：`accept` 原生过滤 + 拖入时二次校验，不符类型直接拒绝并 `onChange` 以 warning 反馈。
- **数量**：`maxCount` 超出拦截；单文件模式（`maxCount={1}`）选新替旧。
- **体积**：便捷 `maxSize`（字节）prop，超限自动标记该文件 `status="error"` 并附错误文案；复杂规则（图片尺寸、异步校验）仍用 `beforeUpload`（`Promise` 支持）。
- **拦截语义**：`beforeUpload` 返回 `false` / `Promise<false>` → 该文件不进入列表（或仅不传，由实现决定）；返回 `Blob / File` → 替换源文件后继续上传。

---

## 14. 数据策略

- **受控模式**：`fileList` + `onChange`，组件不持有内部列表，所有变更经 `onChange` 回流，便于校验 / 拦截 / 联动。
- **非受控模式**：`defaultFileList` 内部维护；`ref.upload / clear / abort` 操作内部列表。
- **上传态始终内部托管**：即便受控 `fileList`，组件在 `onChange` 回写带 `status / percent` 的对象，业务无需自行维护上传进度。
- **表单集成**：可配合 `name` 字段走原生 form 提交；v1 不内置 `Form.Item` 适配，遵循 shadcn 组合式理念由业务层组装。

---

## 15. 使用示例

```tsx
// 1) 开箱即用：内置 action 上传（文字列表）
<Upload action="https://api.example.com/upload" accept="image/*" multiple />
```

```tsx
// 2) 九宫格图片卡片 + 拖拽区
<Upload listType="picture-card" drag action="/api/upload" maxCount={9} multiple />
```

```tsx
// 3) 自定义协议（OSS / 分片 / STS）
<Upload
  customRequest={async ({ file, onProgress, onSuccess, onError }) => {
    const url = await getStsUrl();
    const xhr = putObject(url, file, (p) => onProgress({ percent: p }));
    xhr.onload = () => onSuccess(xhr.response);
    xhr.onerror = () => onError(new Error('upload failed'));
    return { abort: () => xhr.abort() };
  }}
/>
```

```tsx
// 4) 手动上传（先选后传）
const ref = useRef<UploadRef>(null);
<Upload ref={ref} autoUpload={false} action="/api/upload" multiple />
<Button onClick={() => ref.current?.upload()}>开始上传</Button>
```

```tsx
// 5) 受控 + 校验
const [list, setList] = useState<UploadFile[]>([]);
<Upload
  fileList={list}
  onChange={({ fileList }) => setList(fileList)}
  beforeUpload={(f) => f.size < 5 * 1024 * 1024 || Promise.reject()}
  accept=".pdf,.docx"
  maxCount={3}
/>;
```

---

## 决策记录

### 已决议（v1 契约确定）

1. **`multiple` 默认值 = `false`**：显式开启更可控，与 antd 一致；批量场景由业务显式传 `true`。
2. **`maxSize` 纳入 v1**：已提升为正式 Props（§3）与校验策略（§13）；超限标记 `status="error"` 并附文案，复杂规则仍走 `beforeUpload`。
3. **`itemRender` v1 不做**：§5 论证已修正——不与受控语义冲突，理由为「组合式约定一致 + `showUploadList={false}` 逃生通道严格包含其能力 + 少维护一条渲染路径」；复杂列表项走「`showUploadList={false}` + 受控 `fileList` + 业务自行渲染 + `ref` 驱动」。
4. **`maxParallel` 本期不做**：默认并行、不限制并发数；`maxParallel`（并发上限）记入后续版本开发路线。
5. **`picture-card` 网格列数 = 自适应**：`repeat(auto-fill, minmax(80px, 1fr))`，列数随容器宽度增减；移动端可达性优于固定 4 列，且 Upload 常嵌不定宽容器；业务强需 4 列可经 `grid-cols-4` 覆盖（详见 §2.1）。

### 仍待裁决（无）

> 所有 v1 契约决策已确定。后续若需新增（如 `maxParallel`、头像裁切、文件夹树）将另立版本规划。
