/**
 * registry 分发契约测试
 *
 * 目的：把 AGENTS.md「Registry 维护红线」里的人工约定变成可执行断言。
 * 与 CI 的 drift check 互补而非重复：
 *   - drift check 只能发现「忘了重跑 generate-registry.cjs」；
 *   - 本文件发现「脚本逻辑改错，导致源与产物一致地错」（见 A7 跨源断言）。
 *
 * 约定：只读 registry/*.json 与 src/shadcn-ui-lib/ui/*.tsx，
 * 不调用生成脚本（它有写文件副作用，且与 drift check 重复）。
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGISTRY_DIR = path.join(ROOT, 'registry');
const UI_DIR = path.join(ROOT, 'src', 'shadcn-ui-lib', 'ui');
const REGISTRY_BASE = 'https://raw.githubusercontent.com/SUN-TN/shadcn-ui-lib/main/registry';
const ITEM_URL = (name: string): string => `${REGISTRY_BASE}/${name}.json`;

const PRIMARY_OKLCH = 'oklch(0.639 0.149 247.984)';

interface RegistryFile {
  path: string;
  target: string;
  type?: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  cssVars?: { light?: Record<string, string>; dark?: Record<string, string> };
  css?: Record<string, Record<string, string>>;
}

interface RegistryIndex {
  items: { name: string }[];
}

const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(REGISTRY_DIR, file), 'utf8')) as T;

const itemFiles = fs
  .readdirSync(REGISTRY_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .sort();

const items = itemFiles.map((file) => {
  const item = readJson<RegistryItem>(file);
  return { file, name: file.replace(/\.json$/, ''), item };
});

const uiItems = items.filter((x) => x.item.type === 'registry:ui');

// 工具条目：files[].target 落在 @lib/shadcn-ui-lib/ 或 @hooks/shadcn-ui-lib/ 下
// （与 utils「@lib/utils.ts」、theme-provider「@components/theme/...」区分开）
const TOOL_TARGET_PREFIXES = ['@lib/shadcn-ui-lib/', '@hooks/shadcn-ui-lib/'];
const isToolItem = (item: RegistryItem): boolean =>
  (item.files ?? []).some((f) => TOOL_TARGET_PREFIXES.some((p) => f.target.startsWith(p)));
const toolItems = items.filter((x) => isToolItem(x.item));

const deps = (item: RegistryItem): string[] => item.registryDependencies ?? [];
const npmDeps = (item: RegistryItem): string[] => item.dependencies ?? [];
const devDeps = (item: RegistryItem): string[] => item.devDependencies ?? [];

describe('registry 分发契约', () => {
  it('A1 · index.json 与 registry/ 目录的条目集合完全一致', () => {
    const index = readJson<RegistryIndex>('index.json');
    const indexNames = new Set(index.items.map((i) => i.name));
    const diskNames = new Set(items.map((i) => i.name));
    expect(indexNames).toEqual(diskNames);
  });

  it('A2 · registry/ 下没有测试文件等污染产物', () => {
    const allFiles = fs.readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.json'));
    for (const file of allFiles) {
      expect(file, `${file} 不符合 registry 文件命名`).toMatch(/^[a-z0-9-]+\.json$/);
    }
    // 生成脚本会把 src/shadcn-ui-lib/ui/ 顶层 *.tsx 当成组件，
    // 测试文件必须放子目录，否则这里会出现 button.test.json
    expect(allFiles.filter((f) => f.includes('.test.'))).toEqual([]);
  });

  it('A3 · 每个 UI 组件的 files[].target 落在 @ui/shadcn-ui-lib/ 下', () => {
    for (const { name, item } of uiItems) {
      const file = item.files?.[0];
      expect(file, `${name} 缺少 files[0]`).toBeDefined();
      if (!file) continue;
      expect(file.path).toBe(`${name}.tsx`);
      expect(file.target).toBe(`@ui/shadcn-ui-lib/${name}.tsx`);
      expect(file.type).toBe('registry:ui');
    }
    expect(uiItems.length).toBeGreaterThan(0);
  });

  it('A4 · registryDependencies 一律写绝对 URL，禁止裸名', () => {
    for (const { name, item } of items) {
      for (const dep of deps(item)) {
        expect(dep, `${name} 的 registryDependency 不是绝对 URL: ${dep}`).toMatch(
          new RegExp(`^${REGISTRY_BASE}/.+\\.json$`),
        );
      }
    }
  });

  it('A5 · 每个 UI 组件都自动带装 utils 与 theme', () => {
    for (const { name, item } of uiItems) {
      expect(deps(item), `${name} 缺少 utils`).toContain(ITEM_URL('utils'));
      expect(deps(item), `${name} 缺少 theme`).toContain(ITEM_URL('theme'));
    }
  });

  it('A6 · dependencies 不含 react / react-dom（业务项目已自带）', () => {
    for (const { name, item } of items) {
      expect(npmDeps(item).includes('react'), `${name} 不该声明 react`).toBe(false);
      expect(npmDeps(item).includes('react-dom'), `${name} 不该声明 react-dom`).toBe(false);
    }
  });

  it('A7 · 源码用到 animate-in/out ⇔ devDependencies 含 tw-animate-css（跨源不变量）', () => {
    for (const { name, item } of uiItems) {
      const source = fs.readFileSync(path.join(UI_DIR, `${name}.tsx`), 'utf8');
      const usesAnimate = /\banimate-(in|out)\b/.test(source);
      const hasTwAnimate = devDeps(item).includes('tw-animate-css');
      expect(hasTwAnimate, `${name}: animate=${usesAnimate} tw-animate-css=${hasTwAnimate}`).toBe(
        usesAnimate,
      );
    }
  });

  it('A8 · theme.json 只写亮色 token，且主色与规范一致', () => {
    const theme = readJson<RegistryItem>('theme.json');
    expect(theme.type).toBe('registry:theme');
    expect(theme.cssVars?.light?.['primary']).toBe(PRIMARY_OKLCH);
    expect(Object.keys(theme.cssVars?.light ?? {}).length).toBeGreaterThan(0);
    // 暗色基线在 theme-dark.json，规范只定义亮色
    expect(theme.cssVars?.dark).toBeUndefined();

    const themeInline = theme.css?.['@theme inline'];
    expect(themeInline?.['--color-primary']).toBe('var(--primary)');
    expect(theme.css?.['@custom-variant dark']).toBe('(&:is(.dark *))');

    expect(devDeps(theme)).toContain('tw-animate-css');
    expect(deps(theme)).toHaveLength(0);
  });

  it('A9 · theme-dark 独立存在，且不挂到任何组件的依赖上', () => {
    const themeDark = readJson<RegistryItem>('theme-dark.json');
    expect(Object.keys(themeDark.cssVars?.dark ?? {}).length).toBeGreaterThan(0);
    expect(themeDark.cssVars?.light).toBeUndefined();

    for (const { name, item } of uiItems) {
      expect(deps(item).includes(ITEM_URL('theme-dark')), `${name} 不该自动带装 theme-dark`).toBe(
        false,
      );
    }
  });

  it('A10 · utils 与 theme-provider 的落点与依赖正确', () => {
    const utils = readJson<RegistryItem>('utils.json');
    expect(utils.type).toBe('registry:lib');
    expect(utils.files?.[0]?.target).toBe('@lib/utils.ts');
    expect(npmDeps(utils)).toContain('cn');

    const provider = readJson<RegistryItem>('theme-provider.json');
    expect(provider.files?.[0]?.target).toBe('@components/theme/theme-provider.tsx');
    expect(npmDeps(provider)).toContain('next-themes');
  });

  it('A11 · 每个条目都有非空的 title 与 description', () => {
    for (const { name, item } of items) {
      expect(typeof item.title, `${name} 缺 title`).toBe('string');
      expect((item.title ?? '').length, `${name} 的 title 为空`).toBeGreaterThan(0);
      expect((item.description ?? '').length, `${name} 的 description 为空`).toBeGreaterThan(0);
    }
  });

  it('A12 · 工具条目的 type 与落点前缀一致，且落在 shadcn-ui-lib/ 子目录', () => {
    expect(toolItems.length).toBeGreaterThan(0);
    for (const { name, item } of toolItems) {
      for (const file of item.files ?? []) {
        expect(file.path, `${name} 的 files[].path 不应含子路径`).not.toContain('/');
        expect(file.type, `${name} 的 files[].type 应与条目 type 一致`).toBe(item.type);
        if (item.type === 'registry:lib') {
          expect(file.target, `${name} 应落在 @lib/shadcn-ui-lib/`).toMatch(
            /^@lib\/shadcn-ui-lib\/.+\.ts$/,
          );
        } else if (item.type === 'registry:hook') {
          expect(file.target, `${name} 应落在 @hooks/shadcn-ui-lib/`).toMatch(
            /^@hooks\/shadcn-ui-lib\/.+\.ts$/,
          );
        } else {
          throw new Error(`${name} 的工具条目 type 只能是 registry:lib / registry:hook`);
        }
      }
    }
  });

  it('A13 · 工具条目不自动带装 utils / theme / theme-dark（与 UI 组件区分）', () => {
    for (const { name, item } of toolItems) {
      for (const forbidden of ['utils', 'theme', 'theme-dark']) {
        expect(deps(item).includes(ITEM_URL(forbidden)), `${name} 不该自动带装 ${forbidden}`).toBe(
          false,
        );
      }
    }
  });

  it('A14 · 工具条目零新增 npm 依赖（落实「原生优先」决策）', () => {
    for (const { name, item } of toolItems) {
      expect(npmDeps(item), `${name} 应为零依赖，实际：${npmDeps(item).join(', ')}`).toHaveLength(
        0,
      );
      expect(devDeps(item), `${name} 不应声明 devDependencies`).toHaveLength(0);
    }
  });

  it('A15 · 工具条目 files[].path 不得是测试文件', () => {
    for (const { name, item } of toolItems) {
      for (const file of item.files ?? []) {
        expect(file.path, `${name} 误把测试文件当条目源`).not.toContain('.test.');
      }
    }
  });
});
