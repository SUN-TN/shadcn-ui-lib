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

// ---- 分发地址（registry 通过 GitHub raw 对外提供）----
// 需要钉版本时把 REGISTRY_REF 改成 tag（如 'v1.2.0'）或完整 commit SHA
const REGISTRY_OWNER = 'SUN-TN';
const REGISTRY_REPO = 'shadcn-ui-lib';
const REGISTRY_REF = 'main';
const REGISTRY_BASE = `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${REGISTRY_REPO}/${REGISTRY_REF}/registry`;
const ITEM_URL = (name) => `${REGISTRY_BASE}/${name}.json`;

const AUTHOR = 'SUN-TN (https://github.com/SUN-TN/shadcn-ui-lib)';
const DOCS_URL = 'https://github.com/SUN-TN/shadcn-ui-lib';
const THEME_SOURCE_PATH = path.join(ROOT, 'src/global.css');
const THEME_PROVIDER_SOURCE_PATH = path.join(ROOT, 'src/components/theme/theme-provider.tsx');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

/**
 * 读取 src/global.css，拆成 registry:theme 需要的三段：
 *   - light  → cssVars.light（CLI 写入 :root）
 *   - dark   → cssVars.dark （CLI 写入 .dark）
 *   - theme  → css["@theme inline"]（CLI 逐字写入，不依赖 CLI 对 cssVars.theme 的 --color- 前缀推断）
 */
function parseThemeSource(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // 按选择器/at-rule 头定位块体，做花括号配对（global.css 的这三段都没有嵌套块）
  function readBlock(headerRe) {
    const m = headerRe.exec(stripped);
    if (!m) return null;
    const open = stripped.indexOf('{', m.index + m[0].length - 1);
    if (open === -1) return null;
    let depth = 0;
    for (let i = open; i < stripped.length; i += 1) {
      if (stripped[i] === '{') depth += 1;
      else if (stripped[i] === '}') {
        depth -= 1;
        if (depth === 0) return stripped.slice(open + 1, i);
      }
    }
    return null;
  }

  // 变量名保留 "--" 前缀（供 css["@theme inline"] 使用）
  function varsWithDash(block) {
    const out = {};
    if (!block) return out;
    for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
      out[m[1]] = m[2].trim();
    }
    return out;
  }

  // 变量名去掉 "--" 前缀（供 cssVars.light / cssVars.dark 使用）
  function varsBare(block) {
    const out = {};
    for (const [k, v] of Object.entries(varsWithDash(block))) {
      out[k.replace(/^--/, '')] = v;
    }
    return out;
  }

  const rootBlock = readBlock(/(^|\n):root\s*\{/);
  const darkBlock = readBlock(/(^|\n)\.dark\s*\{/);
  const themeBlock = readBlock(/(^|\n)@theme\s+inline\s*\{/);

  if (!rootBlock) throw new Error('src/global.css 里找不到 :root 块');
  if (!darkBlock) throw new Error('src/global.css 里找不到 .dark 块');
  if (!themeBlock) throw new Error('src/global.css 里找不到 @theme inline 块');

  return { light: varsBare(rootBlock), dark: varsBare(darkBlock), theme: varsWithDash(themeBlock) };
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
      // 同仓库内部依赖必须写绝对地址：裸名会被 CLI 解析成官方 @shadcn 的同名组件
      deps.add(ITEM_URL(dep));
    }
  }
  // 所有 UI 组件都依赖 utils（本项目自带，声明 cn 依赖）
  deps.add(ITEM_URL('utils'));
  // 所有 UI 组件都自动带装色彩 token，保证业务项目装上就设计规范生效
  deps.add(ITEM_URL('theme'));
  depMap[name] = [...deps];
}

// 用到 tw-animate-css 的 data-[state=...]:animate-in/out 等类
const USES_ANIMATE_RE = /\banimate-(in|out)\b/;

const items = [];
for (const name of componentNames) {
  const content = fs.readFileSync(path.join(srcDir, `${name}.tsx`), 'utf8');
  const info = meta[name] || { title: name, description: '' };
  const devDependencies = USES_ANIMATE_RE.test(content) ? ['tw-animate-css'] : [];

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:ui',
    author: AUTHOR,
    title: info.title,
    description: info.description,
    dependencies: extractNpmDeps(content),
    ...(devDependencies.length ? { devDependencies } : {}),
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
    docs: DOCS_URL,
  };

  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(item, null, 2));
  items.push({ name, ...info });
  console.log(
    `✓ ${name}.json  (deps: ${item.dependencies.join(', ') || 'none'}` +
      `${devDependencies.length ? `; devDeps: ${devDependencies.join(', ')}` : ''}` +
      `; registryDeps: ${item.registryDependencies.length})`
  );
}

// ---- utils 注册表项（lib 工具）----
const utilsContent = fs.readFileSync(utilsSourcePath, 'utf8');
const utilsItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'utils',
  type: 'registry:lib',
  author: AUTHOR,
  title: 'cn utility',
  description: 'Class name merge utility (clsx + tailwind-merge).',
  dependencies: ['cn'],
  registryDependencies: [],
  files: [
    {
      path: 'utils.ts',
      target: '@lib/utils.ts',
      content: utilsContent,
      type: 'registry:lib',
    },
  ],
  docs: DOCS_URL,
};
fs.writeFileSync(path.join(outDir, 'utils.json'), JSON.stringify(utilsItem, null, 2));
items.unshift({ name: 'utils', title: 'cn utility', description: utilsItem.description });
console.log(`✓ utils.json  (deps: cn)`);

// ---- theme 注册表项（色彩 token，由 src/global.css 生成）----
// CLI 行为（Tailwind v4 管线）：
//   cssVars.light → 写入 :root；cssVars.dark → 写入 .dark
//   css["@theme inline"] → 逐字写入 @theme inline
//   registry:theme 会置 overwriteCssVars=true，即覆盖业务项目已有的同名变量
const cssSource = fs.readFileSync(THEME_SOURCE_PATH, 'utf8');
const themeVars = parseThemeSource(cssSource);
const themeItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'theme',
  type: 'registry:theme',
  author: AUTHOR,
  title: 'Design Tokens',
  description:
    'UI/UX 颜色设计规范落地到 shadcn 语义 token（OKLCH）：主色蓝 #3091E1、字体灰阶、状态色与 4 个补充 token（success/warning/info/ink）。',
  dependencies: [],
  devDependencies: ['tw-animate-css'],
  registryDependencies: [],
  cssVars: {
    light: themeVars.light,
  },
  css: {
    '@theme inline': themeVars.theme,
    '@custom-variant dark': '(&:is(.dark *))',
  },
  categories: ['theme'],
  docs: [
    '安装后 CLI 会把变量写入 components.json 里 tailwind.css 指向的 CSS 文件。',
    '要求：Tailwind v4（v3 项目不会写 @theme，需改用已废弃的 tailwind.config 字段）。',
    '安装后请确认生成的是 `@theme inline`，且 `--color-primary` 等映射存在；',
    '构建产物里应能搜到 .bg-primary，且 --primary 解析为 oklch(0.639 0.149 247.984)（#3091E1）。',
    '该 item 为 overwriteCssVars=true，会覆盖业务项目 :root 里的同名 token。',
    '本项**不含** .dark 变量（那是中性基线，不是设计规范），需要请单独装 theme-dark。',
  ].join('\n'),
};
fs.writeFileSync(path.join(outDir, 'theme.json'), JSON.stringify(themeItem, null, 2));
items.unshift({ name: 'theme', title: themeItem.title, description: themeItem.description });
console.log(
  `✓ theme.json  (light: ${Object.keys(themeVars.light).length} vars; @theme inline: ${Object.keys(themeVars.theme).length} vars)`
);

// ---- theme-dark 注册表项（中性暗色基线，需显式安装）----
// 不挂到组件的 registryDependencies 上：避免业务项目装个 button 就把自定义暗色冲掉
const themeDarkItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'theme-dark',
  type: 'registry:theme',
  author: AUTHOR,
  title: 'Dark Baseline',
  description: '中性暗色基线（.dark 变量）。设计规范只定义亮色，本项按需单独安装。',
  dependencies: [],
  registryDependencies: [],
  cssVars: {
    dark: themeVars.dark,
  },
  categories: ['theme'],
  docs: [
    '与 theme 分开安装：theme 只写 :root，本项只写 .dark。',
    '本项同样会覆盖业务项目 .dark 里的同名变量——已有自定义暗色时不要装。',
  ].join('\n'),
};
fs.writeFileSync(path.join(outDir, 'theme-dark.json'), JSON.stringify(themeDarkItem, null, 2));
items.push({ name: 'theme-dark', title: themeDarkItem.title, description: themeDarkItem.description });
console.log(`✓ theme-dark.json  (dark: ${Object.keys(themeVars.dark).length} vars)`);

// ---- theme-provider 注册表项（next-themes 包装）----
const themeProviderContent = fs.readFileSync(THEME_PROVIDER_SOURCE_PATH, 'utf8');
const themeProviderItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'theme-provider',
  type: 'registry:lib',
  author: AUTHOR,
  title: 'Theme Provider',
  description: 'next-themes 包装，提供 light / dark / system 切换（默认 attribute="class"）。',
  dependencies: extractNpmDeps(themeProviderContent),
  registryDependencies: [],
  files: [
    {
      path: 'theme-provider.tsx',
      target: '@components/theme/theme-provider.tsx',
      content: themeProviderContent,
      type: 'registry:lib',
    },
  ],
  categories: ['theme'],
  docs: DOCS_URL,
};
fs.writeFileSync(path.join(outDir, 'theme-provider.json'), JSON.stringify(themeProviderItem, null, 2));
items.unshift({
  name: 'theme-provider',
  title: themeProviderItem.title,
  description: themeProviderItem.description,
});
console.log(`✓ theme-provider.json  (deps: ${themeProviderItem.dependencies.join(', ') || 'none'})`);

// ---- index.json ----
const index = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: '@shadcn-ui-lib',
  homepage: 'https://github.com/SUN-TN/shadcn-ui-lib',
  items,
};
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`\n✓ index.json  (${items.length} items)`);