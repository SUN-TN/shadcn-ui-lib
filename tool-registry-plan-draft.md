# 工具 registry 条目规划（已落地）

> **状态：✅ 已全部落地并推送**。§8.1 工具源码 + §8.2 生成器改造 + §8.3 测试与 CI 均已完成；生成器产出 11 条目，单测 104/104 通过（含契约 15 项），typecheck / lint / drift check 全绿。
> **落地 commit**：`5d9395a` feat(tools): implement the five reusable tool items（5 个工具源码 + 5 个 registry 产物）+ `f712682` test(tools): cover the five tool items（75 个用例）。
> **上游依据**：《组件库范围与 MVP 清单》§4.7（25 项工具，已回写）+ §4.7.6 实现策略（全部原生、零新增依赖）
> **机制依据**：`scripts/generate-registry.cjs`（现生成 11 个条目）
> **日期**：2026-09-24

---

## 1. 机制现状（代码事实）

| 事实                                                                                           | 影响                                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 只扫 `src/shadcn-ui-lib/ui/*.tsx` **顶层**，每个文件 → 一个 `registry:ui` 条目                 | 工具源码必须另置目录（`src/lib/**`、`src/hooks/**`），生成器需扩展  |
| 硬编码产出 `utils`(lib) / `theme`(theme) / `theme-dark`(theme) / `theme-provider`(lib)         | 无通用「扫描 lib/hooks 目录」能力                                   |
| **无 `registry:hook` 类型**                                                                    | Hook 类工具无对应条目类型，需新增                                   |
| `registryDependencies` 只映射 `@/shadcn-ui-lib/ui/*` 与 `@/components/ui/*` 两种 `@/` import   | 工具若从 `@/lib/...`、`@/hooks/...` import，脚本不认识 → 需扩展映射 |
| 同仓库跨条目引用**必须写绝对 URL**（`ITEM_URL()`），裸名会被 CLI 解析成官方 `@shadcn` 同名条目 | 工具条目被引用时同样必须写绝对 URL                                  |
| 组件落点 `@ui/shadcn-ui-lib/<name>.tsx`（加子目录防与官方/业务同名冲突）                       | 工具建议沿用同一策略                                                |
| 一个条目 `files[]` **可含多文件**                                                              | 支持「随组件内联多文件」，是「不独立成条」的可行路径                |
| `index.json` 需登记每个条目                                                                    | 新增条目需同步登记                                                  |

**结论**：本轮规划不只是「起名字」，还包含**生成器改造**（扫描目录 + `registry:hook` + registryDependencies 映射 + index 登记 + 契约测试 A1–A11 扩展）。

---

## 2. 三层切分框架

| 层                  | 内容                             | 是否独立成条                          | 依据                                     |
| ------------------- | -------------------------------- | ------------------------------------- | ---------------------------------------- |
| **L1 公共工具条目** | 「复用范围 = 全库通用」的工具    | 是（按能力域聚合）                    | registry 条目的价值 = 被 ≥2 个消费者复用 |
| **L2 组件内联**     | 「复用范围 = Upload 专用」的工具 | 否，随 Upload 条目 `files[]` 一起分发 | 单一消费者，独立成条只增维护面           |
| **L3 组件条目**     | Upload 本体（`registry:ui`）     | 是                                    | 通过 `registryDependencies` 引用 L1      |

> **关键设计**：切分依据直接复用 §4.7 已有的「复用范围」列——当时为「标注」而加，现在正好成为「是否独立成条」的判据。

---

## 3. 建议条目清单（L1：5 个条目 / 18 项工具）

| #   | 条目名             | type            | 落点 target                              | 含工具                                                                                                                                                          | 数量 |
| --- | ------------------ | --------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | `file-utils`       | `registry:lib`  | `@lib/shadcn-ui-lib/file-utils.ts`       | `parseAccept`、`matchAccept`、`validateMaxSize`、`validateMaxCount`、`getImageDimensions`、`readFileAs`、`downloadFile`、`buildFormData`、`extractDroppedFiles` | 9    |
| 2   | `upload-transport` | `registry:lib`  | `@lib/shadcn-ui-lib/upload-transport.ts` | `xhrUpload`、`toUploadPercent`、`UploadRequestOption` / `UploadRequestReturn`（类型契约）                                                                       | 3    |
| 3   | `file-hooks`       | `registry:hook` | `@hooks/shadcn-ui-lib/file-hooks.ts`     | `useObjectUrl`、`useFileInput`、`useDropZone`                                                                                                                   | 3    |
| 4   | `a11y-hooks`       | `registry:hook` | `@hooks/shadcn-ui-lib/a11y-hooks.ts`     | `usePrefersReducedMotion`、`useKeyActivation`                                                                                                                   | 2    |
| 5   | `common-utils`     | `registry:lib`  | `@lib/shadcn-ui-lib/common-utils.ts`     | `genUid`                                                                                                                                                        | 1    |

**依赖**：以上 5 条 `dependencies` 均为 `[]`（纯原生、零 npm 依赖）；`registryDependencies` 均为 `[]`（互不依赖，也不依赖 `utils`/`theme`，因为它们不产出 UI）。

**注**：`UploadRequestOption` 类型契约从「Upload 专用」上移为公共——因为公共条目 `xhrUpload` 需要它，否则类型不可用。

## 4. L2：随 Upload 内联（7 项）

`resolveUploadRequest`、`runBeforeUpload`、`createUploadFile` / `normalizeFile`、`fileStatusReducer`、`useControllableFileList`、`emitUploadChange`、`ImagePreview`

> `ImagePreview` 复用范围标为「全库通用」，但实现仅为「Base UI Dialog + Image」的薄封装，当前唯一消费者是 Upload——建议先内联，待出现第二个消费者（如商品图墙）再抽为 `registry:ui` 条目。

## 5. L3：Upload 与工具的依赖方向

**建议**：Upload 条目（`registry:ui`）的 `registryDependencies` 写绝对 URL，引用 L1 的 5 个条目 → `shadcn add @shadcn-ui-lib/upload` 一次装齐「组件 + 依赖工具」。

```
upload.json
  registryDependencies: [
    "<ITEM_URL>/utils.json",
    "<ITEM_URL>/theme.json",
    "<ITEM_URL>/file-utils.json",
    "<ITEM_URL>/upload-transport.json",
    "<ITEM_URL>/file-hooks.json",
  ]
```

> 反向（工具独立、Upload 内联全部实现）会让 Upload 与公共工具**代码重复**，不推荐。

## 6. 需要的工程改造（落地前置）

1. 新增扫描目录：`src/lib/shadcn-ui-lib/**`（lib）与 `src/hooks/shadcn-ui-lib/**`（hook）——或改为「配置驱动的条目清单」，避免再写死。
2. 支持 `registry:hook` 类型（`files[].type` 与 item `type`）。
3. 扩展 `registryDependencies` 映射：新增 `@/lib/shadcn-ui-lib/*`、`@/hooks/shadcn-ui-lib/*` 两类。
4. `index.json` 登记新条目；`categories` 增加 `utils` / `hooks`。
5. `scripts/__tests__/registry-contract.test.ts` 的 A1–A11 断言需覆盖新条目类型（尤其「测试文件不得进 ui/ 顶层」同类风险：工具目录也需防止把 `*.test.ts` 当条目）。
6. CI `regen-registry.yml` 触发路径需加入新的源码目录。

## 7. 决策记录（已决议）

| #   | 决策项   | 结论                                                                                |
| --- | -------- | ----------------------------------------------------------------------------------- |
| 1   | 切分依据 | **按复用范围**：全库通用 18 项独立成条；Upload 专用 7 项随 Upload 的 `files[]` 内联 |
| 2   | 聚合粒度 | **按能力域聚合为 5 条**（见 §3）                                                    |
| 3   | 安装落点 | **加 `shadcn-ui-lib/` 子目录**：`@lib/shadcn-ui-lib/`、`@hooks/shadcn-ui-lib/`      |
| 4   | 本期范围 | **落地 5 个公共条目 + 改造 `generate-registry.cjs`**                                |

> 备选方案与利弊对比保留于 §7 附录，供回溯。

---

## 8. 实施清单

### 8.0 实施进度（2026-09-24）

| 项              | 状态      | 说明                                                                                                                            |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| §8.2 生成器改造 | ✅ 已完成 | `TOOL_ITEMS` 配置表 + `registry:hook` + `internalDeps()` 映射 + index 登记 + 测试文件防护                                       |
| §8.3 测试与 CI  | ✅ 已完成 | 契约测试新增 A12–A15；`regen-registry.yml` 加入 `src/hooks/**`                                                                  |
| §8.1 工具源码   | ✅ 已完成 | 5 个文件的真实实现全部落地（`notImplemented` 占位已清除），并新增 5 个单测文件共 75 个用例                                      |
| §8.4 验收       | ✅ 已通过 | 生成器产出 **11 条目**；`tsc -b --noEmit` 通过；lint 0 error；单测 **104/104**（契约 15 + 工具 75 + 既有 14）；drift check 为空 |

> **落地后的两处偏差（相对本稿 §3 与 §8.1 的原表述）**：
>
> 1. **`upload-transport` 与 `file-hooks` 各带 1 个 `registryDependencies`（指向 `file-utils`）**，不再是「五条全为空」。原因：二者复用 `file-utils` 的 `buildFormData` / `extractDroppedFiles`，保证 multipart 构造与拖入提取只有一份实现（内置上传与 `customRequest` 两条路径不会序列化不一致）。契约测试 A13 只禁 `utils` / `theme` / `theme-dark`，故断言不受影响。**若要求五条零依赖，需改为各自私有实现。**
> 2. **`useFileInput` 的返回值新增 `inputProps` 字段**（`{ type: 'file', accept, multiple, disabled }`），使 `accept` / `multiple` / `disabled` 三个选项有唯一来源、调用方可一次展开。属**追加字段**，不破坏原接口。
>
> **实现期新增的硬约束（见 `.workbuddy-ai/memory/MEMORY.md`）**：`eslint-plugin-react-hooks@7` 的 `recommended` 已含 React Compiler 规则集且全为 error，`set-state-in-effect` 会拦截「effect 体内同步 setState」——hook 必须改用 `useMemo`+清理、`useSyncExternalStore` 或「effect 内写 ref」三种模式之一。

### 8.1 新增源码文件（5 个）

| 文件                                        | 条目               | 导出（已落地）                                                                                                                                                  |
| ------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/shadcn-ui-lib/file-utils.ts`       | `file-utils`       | `parseAccept`、`matchAccept`、`validateMaxSize`、`validateMaxCount`、`getImageDimensions`、`readFileAs`、`downloadFile`、`buildFormData`、`extractDroppedFiles` |
| `src/lib/shadcn-ui-lib/upload-transport.ts` | `upload-transport` | `xhrUpload`、`toUploadPercent`、`type UploadRequestOption`、`type UploadRequestReturn`                                                                          |
| `src/hooks/shadcn-ui-lib/file-hooks.ts`     | `file-hooks`       | `useObjectUrl`、`useFileInput`、`useDropZone`                                                                                                                   |
| `src/hooks/shadcn-ui-lib/a11y-hooks.ts`     | `a11y-hooks`       | `usePrefersReducedMotion`、`useKeyActivation`                                                                                                                   |
| `src/lib/shadcn-ui-lib/common-utils.ts`     | `common-utils`     | `genUid`                                                                                                                                                        |

### 8.2 生成器改造（`scripts/generate-registry.cjs`）

1. 新增 `TOOL_ITEMS` 配置表（条目名 / `type` / 源文件 / `target` / title / description），替代散落的硬编码。
2. 支持 `registry:hook`（item `type` 与 `files[].type`）。
3. 扩展 `registryDependencies` 映射：新增 `@/lib/shadcn-ui-lib/*`、`@/hooks/shadcn-ui-lib/*` 两类 `@/` import → 绝对 URL。
4. `index.json` 登记 5 个新条目；`categories` 增加 `utils` / `hooks`。
5. 防误扫：工具目录不得含 `*.test.ts`（与 `ui/` 顶层同一风险，需断言拦截）。

### 8.3 测试与 CI

- `scripts/__tests__/registry-contract.test.ts` 扩展断言：新条目 `type` 正确、`target` 落在 `shadcn-ui-lib/` 子目录、`dependencies` 为空、`index.json` 已登记。
- `.github/workflows/regen-registry.yml` 触发路径加入 `src/lib/shadcn-ui-lib/**`、`src/hooks/shadcn-ui-lib/**`。

### 8.4 验收标准

- `node scripts/generate-registry.cjs` 产出 **11 个条目**（现有 6 + 新增 5）。
- `pnpm typecheck` 通过；CI registry drift check 不报。

---

## 9. 执行确认点

18 项工具当前**无消费者**——Upload 组件本体尚未实现（`src/shadcn-ui-lib/ui/` 目前仅 `button.tsx` / `input.tsx`）。因此「先实现 18 项工具、再实现 Upload」的顺序意味着：先写一批无调用方的代码，其行为只能靠单测而非真实集成验证。

三种可行顺序见文末提问；若确认立即执行，建议先做 §8.2 生成器改造（低风险、可独立验证），再写 §8.1 工具源码。

---

## 附录：备选方案与利弊（决策 1–4 回溯）

### 决策 1：切分依据

| 方案                         | 条目数          | 优点                                       | 缺点                                                   |
| ---------------------------- | --------------- | ------------------------------------------ | ------------------------------------------------------ |
| **按复用范围切分（已采纳）** | 5 公共 + 7 内联 | 只为有真实复用价值的工具建条目；维护面最小 | 需判断复用范围（已由 §4.7 标注完成）                   |
| 全部独立成条                 | 18–25           | 粒度最细，按需安装                         | 条目爆炸、`index.json` 冗长、类型契约被迫单独成条      |
| 全部随 Upload 内联           | 0               | 最简单                                     | 业务方与其他组件无法单独复用；与「工具与资源」定位矛盾 |

### 决策 2：聚合粒度

| 方案                       | 条目数             | 优点                           | 缺点                                   |
| -------------------------- | ------------------ | ------------------------------ | -------------------------------------- |
| **按能力域聚合（已采纳）** | 5                  | 与 §4.7 分类同构，装一次拿一组 | 粒度略粗，可能装上用不到的函数         |
| 一工具一条                 | 18                 | 最精确                         | 条目爆炸，跨工具引用（类型契约）难处理 |
| 按形态聚合                 | 2（utils / hooks） | 条目最少                       | 语义混杂，一个条目背 15 个函数         |

### 决策 3：安装落点

| 方案                                     | 优点                                      | 缺点                                             |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| **加 `shadcn-ui-lib/` 子目录（已采纳）** | 与组件策略一致；不覆盖业务方/官方同名文件 | import 路径略长                                  |
| 直接落 `@lib/`、`@hooks/` 根             | 路径短                                    | 与业务方既有 `lib/*.ts`、`hooks/*.ts` 有覆盖风险 |

### 决策 4：本期落地范围

| 方案                                | 优点                    | 缺点                                  |
| ----------------------------------- | ----------------------- | ------------------------------------- |
| **公共条目 + 改造生成器（已采纳）** | 一次到位，Upload 可引用 | 生成器改造量不小（见 §6）             |
| 只落规划，实现延后                  | 零风险                  | 规划易过期；Upload 需先内联，后续再迁 |
| 全部内联、不做公共条目              | 最快                    | 放弃跨组件复用价值                    |
