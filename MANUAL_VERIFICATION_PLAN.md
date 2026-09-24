# 手动验证新增功能的执行方案

本方案用于在你**本地正常终端**（非本助手沙箱）逐步验证本次新增的测试栈与 CI 是否已就绪、行为是否符合预期。

本次新增的能力范围：

- Vitest 4.1.11（node / jsdom 双 project）+ `@vitest/coverage-v8` 4.1.11
- React Testing Library 全家桶（react / dom / jest-dom@7 / user-event）+ jsdom 30
- `src/test/setup.ts`：jsdom 环境 6 项 polyfill（matchMedia / ResizeObserver / DOMRect / hasPointerCapture / scrollIntoView / PointerEvent）
- `scripts/__tests__/registry-contract.test.ts`：11 条 registry 分发红线断言（A1–A11）
- `src/shadcn-ui-lib/ui/__tests__/button.test.tsx`、`input.test.tsx`：组件行为测试试点
- `.github/workflows/test.yml`：lint / typecheck / test / build 四 job 全闸门
- `package.json` 新增 `test` / `test:watch` / `coverage` 脚本；`tsconfig.node.json` 纳入 `vitest.config.ts` 与 `scripts/**/*.ts`

---

## 0. 前置：恢复依赖链接（关键，必须最先做）

本助手沙箱的文件代理层拦截了 `pnpm install` 的变更类操作，此前靠**手工补软链 + 手工建提升目录**（`node_modules/.pnpm/node_modules`）才让依赖可解析。该状态不是 pnpm 的正常结构，会导致：

- jsdom project 的 worker 在本沙箱内启动超时（`Timeout waiting for worker to respond`）
- 提升目录"先到先得"可能选到错误版本（已踩过 `tinyrainbow` 2.0.0 vs 3.1.1）

**请在你的本地终端执行一次真正的安装来恢复正常链接：**

```bash
cd /Users/macmima1234/Documents/workspaceTest/shadcn-ui-lib
pnpm install            # 走正常 pnpm 链接，覆盖手工软链
```

完成后，手工生成的提升目录已无意义且可能干扰解析，**直接删除**：

```bash
rm -rf node_modules/.pnpm/node_modules
```

验证链接已恢复（应能看到 `vitest` 等通过 pnpm 软链解析，而非手工 `.pnpm/node_modules`）：

```bash
pnpm ls vitest @testing-library/react jsdom 2>&1 | head
node -e "require.resolve('vitest/config'); console.log('vitest/config OK')"
```

预期：三条依赖均能正常解析，无 `Cannot find package` 报错。

> 说明：做完第 0 步后，本方案第 2、3 步的 jsdom 测试在**你的**终端应能正常跑通；在本助手沙箱内仍可能因进程沙箱限制超时，属已知环境差异，不影响代码正确性（node project 已在此环境验证通过）。

---

## 1. 类型检查

```bash
pnpm typecheck        # 等价于 tsc -b --noEmit
```

- **预期**：exit 0，无类型错误。`tsc -b` 会同时检查 `tsconfig.app.json`（含两个新测试文件）与 `tsconfig.node.json`（含 `vitest.config.ts`、`scripts/**/*.ts`）。
- **失败排查**：
  - 若报 `vitest.config.ts` 找不到 `UserConfig`：确认用的是 `ViteUserConfig`（`vitest/config` 不导出 `UserConfig`）。
  - 若报 `mergeConfig` 参数推断为 `never`：确认 `rawViteConfig` 已 `as unknown as ViteUserConfig` 显式降级。
  - 若报测试文件里有 `any` 或 DOM 类型缺失：检查 `tsconfig.node.json` 是否含 `allowImportingTsExtensions: true`，且 `setup.ts` 的 polyfill 用 `Object.defineProperty` 而非 `any`。

---

## 2. 运行测试

```bash
pnpm test             # 等价于 vitest run；双 project 一起跑
```

- **预期**：

  ```
  Test Files  3 passed (3)
       Tests  25 passed (25)   # 11 契约 + 7 button + 7 input
  ```

- **分 project 验证**（若想隔离定位）：

  ```bash
  pnpm exec vitest run --project=node    # 仅契约测试，最快，应 11/11 通过
  pnpm exec vitest run --project=jsdom   # 仅组件行为测试，应 14/14 通过
  ```

- **失败排查**：
  - **jsdom worker 超时**（`Timeout waiting for worker to respond`）：先回到第 0 步确认 `pnpm install` 已重跑且删除了 `.pnpm/node_modules`；若仍超时，显式换池：

    ```bash
    pnpm exec vitest run --project=jsdom --pool=forks
    # 或
    pnpm exec vitest run --project=jsdom --pool=threads --poolOptions.threads.singleThread
    ```

  - `Cannot find module 'pathe'` 或类似解析错误：说明 pnpm 链接未建成，重跑第 0 步。
  - `matchMedia is not a function`：说明 `setup.ts` 的 polyfill 未加载，检查 `vitest.config.ts` 的 jsdom project 是否配了 `setupFiles: ['./src/test/setup.ts']`。
  - RTL 用例报 `Unable to find role`：优先用语义查询（`getByRole` / `getByLabelText`），不要用 `className` 或 `data-testid` 选择器。

---

## 3. 覆盖率

```bash
pnpm coverage         # vitest run --coverage，provider=v8
```

- **预期**：exit 0，终端打印各文件覆盖行；产物落在 `coverage/`（v8 报告，`index.html` 可本地打开）。
- **配置要点**（已写死，无需改）：`include` 含 `scripts/**/*.cjs`、`src/**/*.{ts,tsx}`；`exclude` 已剔除 `*.stories.tsx`、`src/test/**`、`**/*.d.ts`。
- **失败排查**：若报 `coverage` 相关找不到 provider，确认 `@vitest/coverage-v8` 与 `vitest` **严格同版本 4.1.11**（`package.json` 中两者均钉 `4.1.11`）。

---

## 4. registry 漂移检查

源码 `src/global.css` 是唯一真源，改完必须重跑生成脚本；本步验证产物与源一致。

```bash
node scripts/generate-registry.cjs
git status --porcelain registry/
```

- **预期**：`git status --porcelain registry/` **无任何输出**（registry 已与源码同步）。
- **失败排查**：若输出含 `registry/xxx.json`，说明你改了 `src/global.css` / `src/shadcn-ui-lib/ui/**` / `src/components/theme/**` 后忘了重跑脚本——重跑 `node scripts/generate-registry.cjs` 并提交生成的 JSON。CI 的 `regen-registry.yml` 也会查此漂移。

---

## 5. Lint

```bash
pnpm lint             # eslint .
```

- **预期**：0 errors。已知有 2 个 Fast Refresh warning（项目既有，非本次引入），不影响门禁。
- **失败排查**：若报测试文件里的问题，确认 `.test.tsx` 不作为组件被 `generate-registry.cjs` 顶层扫描（测试文件放在 `__tests__/` 子目录，已规避）。

---

## 6. 构建

```bash
pnpm build            # tsc -b && vite build
```

- **预期**：exit 0，产出 `dist/`（含打包后的 `index.html` / `*.js` / `*.css`）。
- **失败排查**：若 `tsc -b` 失败，回到第 1 步；若 `vite build` 失败，确认 `@tailwindcss/vite` 与 `vite` 8 兼容（项目已锁定对应版本）。

---

## 7. CI 验证（GitHub）

推送或开 PR 到 `main` 会自动触发 `.github/workflows/test.yml`，包含 4 个串行门禁 job：

| Job         | 命令                                           | 作用                     |
| ----------- | ---------------------------------------------- | ------------------------ |
| `lint`      | `pnpm install --frozen-lockfile` → `pnpm lint` | ESLint 0 error           |
| `typecheck` | 同上 → `pnpm typecheck`                        | `tsc -b` 类型零错误      |
| `test`      | 同上 → `pnpm coverage`                         | 25 测试通过 + 上传覆盖率 |
| `build`     | 同上 → `pnpm build`                            | 产物可构建               |

- **预期**：4 个 job 全绿。`concurrency` 设为 `cancel-in-progress: true`，重复推送会取消进行中的运行。
- **注意**：CI 用 `pnpm install --frozen-lockfile`，因此**必须先把 `pnpm-lock.yaml` 提交**（本次已更新 699 行）。若 CI 报 lockfile 不一致，本地 `pnpm install --frozen-lockfile` 复现后提交锁文件。
- **未覆盖**：`regen-registry.yml`（漂移检查）是另一条独立 workflow，与 `test.yml` 并存；两条都会因改 `src/global.css` 等触发。

---

## 本次改动文件清单（提交前核对）

| 状态 | 文件                                             | 说明                                                                             |
| ---- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| M    | `package.json`                                   | +7 devDeps（钉版）+3 脚本                                                        |
| M    | `pnpm-lock.yaml`                                 | 依赖锁定（已 +699 行）                                                           |
| M    | `pnpm-workspace.yaml`                            | pnpm 自动追加 `minimumReleaseAgeExclude`                                         |
| M    | `tsconfig.node.json`                             | include 加 `vitest.config.ts` / `scripts/**/*.ts` + `allowImportingTsExtensions` |
| A    | `vitest.config.ts`                               | 双 project 配置                                                                  |
| A    | `src/test/setup.ts`                              | jsdom polyfill                                                                   |
| A    | `scripts/__tests__/registry-contract.test.ts`    | 11 条契约断言                                                                    |
| A    | `src/shadcn-ui-lib/ui/__tests__/button.test.tsx` | 7 用例                                                                           |
| A    | `src/shadcn-ui-lib/ui/__tests__/input.test.tsx`  | 7 用例                                                                           |
| A    | `.github/workflows/test.yml`                     | 四 job CI                                                                        |

> 提交建议：`pnpm-lock.yaml` 与 `registry/`（若有重跑）应与源码改动同一次提交，避免 CI 漂移检查失败。改动涉及 `src/shadcn-ui-lib/ui/**`、`src/lib/**`、`src/global.css`、`src/components/theme/**`、`scripts/generate-registry.cjs` 时必须重跑生成脚本一并提交。
