/**
 * scripts/generate-registry.js
 *
 * 从 src/shadcn-ui-lib/ui/*.tsx 读取组件源码，
 * 生成 registry/*.json（registry-item 格式）。
 *
 * 用法: node scripts/generate-registry.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/shadcn-ui-lib/ui');
const outDir = path.join(__dirname, '../registry');

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

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const componentNames = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace('.tsx', ''));

// Build registryDependency map from source
const depMap = {};
for (const name of componentNames) {
  const content = fs.readFileSync(path.join(srcDir, `${name}.tsx`), 'utf8');
  const depImports = [
    ...content.matchAll(/from ['"](@\/[^'"]+)['"]/g),
  ]
    .map((m) => m[1])
    .filter((p) => p.startsWith('@/shadcn-ui-lib/ui/') || p.startsWith('@/components/ui/'))
    .map((p) => p.replace('@/shadcn-ui-lib/ui/', '').replace('@/components/ui/', ''))
    .filter((n) => n !== name && componentNames.includes(n));
  depMap[name] = [...new Set(depImports)];
}

const items = [];
for (const name of componentNames) {
  const filePath = path.join(srcDir, `${name}.tsx`);
  const content = fs.readFileSync(filePath, 'utf8');
  const info = meta[name] || { title: name, description: '' };

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:ui',
    author: 'SUN-TN (https://github.com/SUN-TN/shadcn-ui-lib)',
    title: info.title,
    description: info.description,
    dependencies: [],
    registryDependencies: depMap[name],
    files: [{ path: `${name}.tsx`, content, type: 'registry:ui' }],
    categories: ['components'],
    docs: 'https://github.com/SUN-TN/shadcn-ui-lib',
  };

  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(item, null, 2));
  items.push({ name, ...info });
  console.log(`✓ ${name}.json  (deps: ${depMap[name].join(', ') || 'none'})`);
}

const index = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: '@shadcn-ui-lib',
  homepage: 'https://github.com/SUN-TN/shadcn-ui-lib',
  items,
};
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`\n✓ index.json  (${items.length} components)`);
