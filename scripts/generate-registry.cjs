/**
 * scripts/generate-registry.cjs
 *
 * 从 src/shadcn-ui-lib/ui/*.tsx 读取组件源码，生成 registry/*.json
 * （registry-item 格式）。
 *
 * 自动处理：
 *   - files[].target: 用 @ui/shadcn-ui-lib/<name>.tsx 把组件安装到用户项目
 *     的 <aliases.ui>/shadcn-ui-lib/ 子目录，与 @shadcn 默认组件分离
 *   - dependencies: 从源码扫描裸 import 提取 npm 包名
 *   - registryDependencies: 自动追加 "utils"（所有 UI 组件）
 *   - lib/utils.ts: 单独生成一个 registry:lib 项，自动随 UI 组件安装
 *
 * 用法: node scripts/generate-registry.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const srcDir = path.join(ROOT, 'src/shadcn-ui-lib/ui');
const utilsSourcePath = path.join(ROOT, 'src/lib/utils.ts');
const outDir = path.join(ROOT, 'registry');

const meta = {
  button: { title: 'Button', description: 'Displays a button or a component that looks like a button.' },
  input: { title: 'Input', description: 'A native HTML input element, styled with Tailwind CSS.' },
  card: { title: 'Card', description: 'Displays a card with header, content, and footer.' },
  dialog: { title: 'Dialog', description: 'A window overlaid on the primary content.' },
  sheet: { title: 'Sheet', description: 'A side panel that slides in from the edge of the screen.' },
  'dropdown-menu': { title: 'Dropdown Menu', description: 'Displays a menu to the user — such as a set of actions or functions.' },
  tabs: { title: 'Tabs', description: 'A set of layered sections of content — known as tab panels.' },
  select: { title: 'Select', description: 'Displays a list of options for the user to pick from.' },
  avatar: { title: 'Avatar', description: 'An image element with a fallback for loading and error states.' },
  sonner: { title: 'Sonner (Toaster)', description: 'A toast notification component built on top of sonner.' },
};

// 用户项目通常已经安装的运行时包，不作为 dependencies
const KNOWN_PEERS = new Set(['react', 'react-dom']);

// 正则：从源码扫描所有裸 import（不含相对路径与 @/ 别名）
const BARE_IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const componentNames = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace('.tsx', ''));

function extractNpmDeps(content) {
  const deps = new Set();
  for (const match of content.matchAll(BARE_IMPORT_RE)) {
    const spec = match[1];
    // 跳过相对路径
    if (spec.startsWith('.') || spec.startsWith('/')) continue;
    // 跳过 @/ 别名（项目内部路径）
    if (spec.startsWith('@/')) continue;
    // 包名：scoped (@org/pkg) 或裸 (pkg)；子路径取第一段
    const pkg = spec.startsWith('@')
      ? spec.split('/').slice(0, 2).join('/')
      : spec.split('/')[0];
    if (!pkg) continue;
    if (KNOWN_PEERS.has(pkg)) continue;
    deps.add(pkg);
  }
  return [...deps];
}

// 构建 registryDependency 映射（同 registry 内跨组件依赖）
const depMap = {};
for (const name of componentNames) {
  const content = fs.readFileSync(path.join(srcDir, `${name}.tsx`), 'utf8');
  const deps = new Set();
  for (const m of content.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)) {
    const dep = m[1]
      .replace('@/shadcn-ui-lib/ui/', '')
      .replace('@/components/ui/', '');
    if (dep && dep !== name && componentNames.includes(dep)) {
      deps.add(dep);
    }
  }
  // 所有 UI 组件都依赖 utils
  deps.add('utils');
  depMap[name] = [...deps];
}

const items = [];
for (const name of componentNames) {
  const content = fs.readFileSync(path.join(srcDir, `${name}.tsx`), 'utf8');
  const info = meta[name] || { title: name, description: '' };

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:ui',
    author: 'SUN-TN (https://github.com/SUN-TN/shadcn-ui-lib)',
    title: info.title,
    description: info.description,
    dependencies: extractNpmDeps(content),
    registryDependencies: depMap[name],
    files: [
      {
        path: `${name}.tsx`,
        target: `@ui/shadcn-ui-lib/${name}.tsx`,
        content,
        type: 'registry:ui',
      },
    ],
    categories: ['components'],
    docs: 'https://github.com/SUN-TN/shadcn-ui-lib',
  };

  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(item, null, 2));
  items.push({ name, ...info });
  console.log(`✓ ${name}.json  (deps: ${item.dependencies.join(', ') || 'none'}; registryDeps: ${item.registryDependencies.join(', ') || 'none'})`);
}

// ---- utils 注册表项（lib 工具）----
const utilsContent = fs.readFileSync(utilsSourcePath, 'utf8');
const utilsItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'utils',
  type: 'registry:lib',
  author: 'SUN-TN (https://github.com/SUN-TN/shadcn-ui-lib)',
  title: 'cn utility',
  description: 'Class name merge utility (clsx + tailwind-merge).',
  dependencies: ['clsx', 'tailwind-merge'],
  registryDependencies: [],
  files: [
    {
      path: 'utils.ts',
      target: '@lib/utils.ts',
      content: utilsContent,
      type: 'registry:lib',
    },
  ],
  docs: 'https://github.com/SUN-TN/shadcn-ui-lib',
};
fs.writeFileSync(path.join(outDir, 'utils.json'), JSON.stringify(utilsItem, null, 2));
items.unshift({ name: 'utils', title: 'cn utility', description: utilsItem.description });
console.log(`✓ utils.json  (deps: clsx, tailwind-merge)`);

// ---- index.json ----
const index = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: '@shadcn-ui-lib',
  homepage: 'https://github.com/SUN-TN/shadcn-ui-lib',
  items,
};
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`\n✓ index.json  (${items.length} items)`);