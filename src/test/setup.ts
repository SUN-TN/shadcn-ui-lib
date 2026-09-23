import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest.config.ts 里 globals: false，RTL 不会自动注册 cleanup，必须手动执行
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// jsdom 缺失 API 补齐
// 统一用 Object.defineProperty(..., { writable: true, value }) 赋值，
// 避开宿主对象只读属性直接赋值抛错的问题。
// ---------------------------------------------------------------------------

// next-themes 的 enableSystem 必调（src/App.tsx、.storybook/preview.tsx 均开启）
if (typeof window.matchMedia !== 'function') {
  const matchMediaStub = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMediaStub });
}

// Radix Popper / Select 定位用
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverStub,
  });
}

// Radix 会直接 new DOMRect(...)
if (typeof DOMRect === 'undefined') {
  class DOMRectStub {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = y;
      this.left = x;
      this.right = x + width;
      this.bottom = y + height;
    }

    toJSON(): Record<string, number> {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left,
      };
    }
  }

  Object.defineProperty(globalThis, 'DOMRect', { writable: true, value: DOMRectStub });
}

// Radix Select / DropdownMenu 的指针事件路径会调用
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    writable: true,
    value: () => false,
  });
}

if (typeof Element.prototype.setPointerCapture !== 'function') {
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    writable: true,
    value: () => {},
  });
}

if (typeof Element.prototype.releasePointerCapture !== 'function') {
  Object.defineProperty(Element.prototype, 'releasePointerCapture', {
    writable: true,
    value: () => {},
  });
}

// Radix 打开浮层时调用
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    writable: true,
    value: () => {},
  });
}

// jsdom 不提供 PointerEvent，@testing-library/user-event v14 依赖它
if (typeof PointerEvent === 'undefined') {
  class PointerEventStub extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? '';
      this.isPrimary = params.isPrimary ?? false;
    }
  }

  Object.defineProperty(globalThis, 'PointerEvent', { writable: true, value: PointerEventStub });
}
