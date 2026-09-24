import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { useKeyActivation, usePrefersReducedMotion } from '../a11y-hooks';

/** 原始的 window.matchMedia（由 src/test/setup.ts 注入的桩）。 */
const originalMatchMedia = window.matchMedia;

/** 可控的 matchMedia 桩：既能读当前值，也能手动触发 change。 */
function stubReducedMotion(initial: boolean) {
  const listeners = new Set<() => void>();
  let matches = initial;

  const query = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };

  const matchMedia = vi.fn(() => query);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMedia,
  });

  return {
    matchMedia,
    listenerCount: () => listeners.size,
    emit(next: boolean) {
      matches = next;
      for (const listener of listeners) listener();
    },
  };
}

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
  vi.restoreAllMocks();
});

describe('usePrefersReducedMotion', () => {
  it('渲染期直接读到当前媒体查询值（不是先 false 再补一次渲染）', () => {
    stubReducedMotion(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it('媒体查询变化时同步更新', () => {
    const media = stubReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => media.emit(true));
    expect(result.current).toBe(true);

    act(() => media.emit(false));
    expect(result.current).toBe(false);
  });

  it('卸载时退订', () => {
    const media = stubReducedMotion(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });

  it('无 matchMedia 支持时默认 false（SSR / 老环境）', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});

function KeyHarness({ onActivate }: { onActivate: () => void }) {
  const { onKeyDown } = useKeyActivation(onActivate);
  return (
    <div role="button" tabIndex={0} data-testid="trigger" onKeyDown={onKeyDown}>
      <span data-testid="inner">内部元素</span>
    </div>
  );
}

describe('useKeyActivation', () => {
  it('Enter 与 Space 都能激活', () => {
    const onActivate = vi.fn();
    render(<KeyHarness onActivate={onActivate} />);

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('trigger'), { key: ' ' });
    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'Spacebar' });

    expect(onActivate).toHaveBeenCalledTimes(3);
  });

  it('其他按键不激活', () => {
    const onActivate = vi.fn();
    render(<KeyHarness onActivate={onActivate} />);

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'a' });
    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'Tab' });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('长按（repeat）只激活一次', () => {
    const onActivate = vi.fn();
    render(<KeyHarness onActivate={onActivate} />);

    fireEvent.keyDown(screen.getByTestId('trigger'), { key: 'Enter', repeat: true });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('内部子元素的按键冒泡上来不激活外层', () => {
    const onActivate = vi.fn();
    render(<KeyHarness onActivate={onActivate} />);

    fireEvent.keyDown(screen.getByTestId('inner'), { key: 'Enter' });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('命中时阻止默认行为（Space 不滚页 / Enter 不二次触发 click）', () => {
    render(<KeyHarness onActivate={vi.fn()} />);

    // fireEvent 返回 false 表示事件被 preventDefault
    expect(fireEvent.keyDown(screen.getByTestId('trigger'), { key: ' ' })).toBe(false);
  });

  it('始终调用最新的回调实现', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ onActivate }) => useKeyActivation(onActivate), {
      initialProps: { onActivate: first },
    });

    rerender({ onActivate: second });

    act(() => {
      result.current.onKeyDown({
        target: null,
        currentTarget: null,
        key: 'Enter',
        repeat: false,
        preventDefault: () => {},
      } as never);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
