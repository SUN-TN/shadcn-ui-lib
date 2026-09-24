/**
 * 可访问性 hooks（零依赖）
 *
 * 契约见《组件 API 契约：Upload》§9（可访问性：减少动态、Enter/Space 键盘激活）。
 * 复用范围：全库通用——任何带过渡动画或自定义触发区的组件都可复用。
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { KeyboardEvent } from 'react';

/** useKeyActivation 返回：可直接展开到触发元素上的键盘处理器。 */
export interface KeyActivationHandlers {
  onKeyDown: (event: KeyboardEvent) => void;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (!canMatchMedia()) return () => {};

  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onStoreChange);
  return () => {
    query.removeEventListener('change', onStoreChange);
  };
}

function getReducedMotionSnapshot(): boolean {
  if (!canMatchMedia()) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** SSR / 无 matchMedia 环境下的快照：默认「不减少动态」。 */
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * 检测 prefers-reduced-motion（SSR 安全，默认 false）。
 *
 * 用 `useSyncExternalStore` 订阅媒体查询：它同时满足三件事——渲染期就能读到当前值
 * （不是先 false 再补一次渲染）、订阅回调里 setState 不违反
 * `react-hooks/set-state-in-effect`、SSR 有独立快照。
 * 浏览器要求：`MediaQueryList.addEventListener`（Safari 14+）。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Enter / Space 键盘激活（用于非按钮触发区，如 dropzone）。
 *
 * 三条守卫：
 *   - `target !== currentTarget` 时不响应，避免内部子元素（如列表项删除按钮）的
 *     按键冒泡上来把整个区域激活一次；
 *   - `repeat` 时不响应，长按 Space 只激活一次；
 *   - 命中时 `preventDefault`：Space 的默认行为是滚动页面，Enter 在原生 button 上
 *     还会再触发一次 click（会变成双击激活）。
 */
export function useKeyActivation(onActivate: () => void): KeyActivationHandlers {
  const activateRef = useRef(onActivate);

  useEffect(() => {
    activateRef.current = onActivate;
  }, [onActivate]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;

    event.preventDefault();
    activateRef.current();
  }, []);

  return { onKeyDown };
}
