// Storybook + Vitest browser-mode setup file.
//
// addon-vitest runs stories in a REAL Chromium browser (not jsdom), so the
// Radix/DOM polyfills in `src/test/setup.ts` are not needed here. This file is
// intentionally minimal; extend it only if the storybook project needs extra
// browser-side setup (e.g. a coverage import, global mocks).
export {};
