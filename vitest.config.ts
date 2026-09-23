import { defineConfig, mergeConfig } from 'vitest/config';
import type { ViteUserConfig } from 'vitest/config';
// Vite 8 的 native config loader 要求显式扩展名，否则会在未来大版本失效
import rawViteConfig from './vite.config.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

// vite 的 defineConfig 返回重载联合类型，直接传给 mergeConfig 会推断成 never，
// 这里显式降级成 ViteUserConfig。
const baseConfig = rawViteConfig as unknown as ViteUserConfig;
const dirname = path.dirname(fileURLToPath(import.meta.url));

// vitest.config.ts 存在时会完全覆盖 vite.config.ts，
// 必须 merge 才能继承 `@` 别名与 react / tailwind 插件。
export default mergeConfig(
  baseConfig,
  defineConfig({
    // pretty-format@27（@testing-library/dom 的 transitive dep）在模块顶层引用裸
    // `global`，在 browser mode（真实 Chromium）中不存在。用 Vite define 把它替换为
    // 跨环境标准的 `globalThis`。Node.js 中 globalThis === global，无副作用。
    define: {
      global: 'globalThis',
    },
    test: {
      // globals: false —— 避免往 tsconfig.app.json 塞 types: ["vitest/globals"] 污染 app 配置。
      // 代价：RTL 的自动 cleanup 不生效，已在 src/test/setup.ts 手动 afterEach(cleanup)。
      globals: false,
      // 本批还没有组件测试，jsdom project 会匹配到 0 个文件
      passWithNoTests: true,
      // coverage / reporters 只能写在根配置，放进 project 无效
      coverage: {
        provider: 'v8',
        reportsDirectory: './coverage',
        include: ['scripts/**/*.cjs', 'src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.stories.tsx', 'src/test/**', '**/*.d.ts'],
      },
      projects: [
        {
          // Vitest 4 的 inline project 默认 extends: false，必须显式打开
          extends: true,
          test: {
            name: 'node',
            environment: 'node',
            include: ['scripts/__tests__/**/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'jsdom',
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.test.{ts,tsx}'],
          },
        },
        {
          // Storybook 测试：用真实 Chromium 把 story 跑成 Vitest browser 测试。
          // `pnpm test` / `coverage` 已显式限定 node+jsdom，不会触发本项目；
          // 仅 `pnpm test-storybook` 运行（详见 package.json scripts）。
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'storybook dev --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  }),
);
