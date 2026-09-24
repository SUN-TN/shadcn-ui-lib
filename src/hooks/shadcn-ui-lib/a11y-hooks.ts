/**
 * 可访问性 hooks（零依赖）
 *
 * ⚠️ PLACEHOLDER：本文件当前为「模块骨架」——导出签名已定稿，函数体待实现。
 * 仅用于跑通 registry 生成管线（见 tool-registry-plan-draft.md §8.1）。
 * 契约见《组件 API 契约：Upload》§9（可访问性）。
 */
import type { KeyboardEvent } from 'react';

/** useKeyActivation 返回：可直接展开到触发元素上的键盘处理器。 */
export interface KeyActivationHandlers {
  onKeyDown: (event: KeyboardEvent) => void;
}

const notImplemented = (fn: string): never => {
  throw new Error(`${fn}：占位实现，尚未落地（见 tool-registry-plan-draft.md §8.1）`);
};

/** 检测 prefers-reduced-motion（SSR 安全，默认 false）。 */
export function usePrefersReducedMotion(): boolean {
  return notImplemented('usePrefersReducedMotion()');
}

/** Enter / Space 键盘激活（用于非按钮触发区，如 dropzone）。 */
export function useKeyActivation(onActivate: () => void): KeyActivationHandlers {
  return notImplemented(`useKeyActivation(${onActivate.name || 'anonymous'})`);
}
