import { defineConfig, mergeConfig } from 'vitest/config';
import type { ViteUserConfig } from 'vitest/config';
// Vite 8 的 native config loader 要求显式扩展名，否则会在未来大版本失效
import rawViteConfig from './vite.config.ts';

// vite 的 defineConfig 返回重载联合类型，直接传给 mergeConfig 会推断成 never，
// 这里显式降级成 ViteUserConfig。
const baseConfig = rawViteConfig as unknown as ViteUserConfig;

// vitest.config.ts 存在时会完全覆盖 vite.config.ts，
// 必须 merge 才能继承 `@` 别名与 react / tailwind 插件。
export default mergeConfig(
  baseConfig,
  defineConfig({
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
      ],
    },
  }),
);
