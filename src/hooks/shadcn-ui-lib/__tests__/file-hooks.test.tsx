import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { useDropZone, useFileInput, useObjectUrl } from '../file-hooks';
import type { DropZoneOptions, FileInputOptions } from '../file-hooks';

const makeFile = (name = 'a.txt', type = 'text/plain'): File => new File(['x'], name, { type });

const dragDataTransfer = (files: File[] = []) =>
  ({
    types: ['Files'],
    items: files.map((file) => ({ kind: 'file', getAsFile: () => file })),
    files,
  }) as unknown as DataTransfer;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useObjectUrl', () => {
  it('为 Blob 生成预览 URL，并在卸载时回收', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-1');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const file = makeFile();
    const { result, unmount } = renderHook(() => useObjectUrl(file));

    expect(result.current).toBe('blob:mock-1');
    expect(createObjectUrl).toHaveBeenCalledWith(file);
    expect(revokeObjectUrl).not.toHaveBeenCalled();

    unmount();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:mock-1');
  });

  it('未传文件时不创建 URL', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const { result } = renderHook(() => useObjectUrl(null));

    expect(result.current).toBeUndefined();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('文件变化时回收上一个 URL', () => {
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:1')
      .mockReturnValueOnce('blob:2');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const first = makeFile('a.txt');
    const second = makeFile('b.txt');
    const { result, rerender } = renderHook(({ file }) => useObjectUrl(file), {
      initialProps: { file: first },
    });

    expect(result.current).toBe('blob:1');

    rerender({ file: second });

    expect(result.current).toBe('blob:2');
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:1');
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
  });
});

function FileInputHarness({ options }: { options: FileInputOptions }) {
  const { inputRef, inputProps, openFileDialog } = useFileInput(options);
  return (
    <div>
      <button type="button" onClick={openFileDialog}>
        选择文件
      </button>
      <input ref={inputRef} {...inputProps} />
    </div>
  );
}

describe('useFileInput', () => {
  it('inputProps 与选项同源', () => {
    const { result } = renderHook(() =>
      useFileInput({ accept: 'image/*', multiple: true, disabled: false }),
    );

    expect(result.current.inputProps).toEqual({
      type: 'file',
      accept: 'image/*',
      multiple: true,
      disabled: false,
    });
  });

  it('openFileDialog 触发隐藏 input 的 click', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<FileInputHarness options={{ accept: 'image/*' }} />);

    fireEvent.click(screen.getByRole('button', { name: '选择文件' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('openFileDialog 先清空 value，保证连续选择同一文件也会触发 change', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<FileInputHarness options={{}} />);

    const input = document.querySelector('input');
    if (!input) throw new Error('未渲染 input');
    Object.defineProperty(input, 'value', { value: 'stale.txt', writable: true });

    fireEvent.click(screen.getByRole('button', { name: '选择文件' }));

    expect(input.value).toBe('');
  });

  it('disabled 时不打开选择框', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<FileInputHarness options={{ disabled: true }} />);

    fireEvent.click(screen.getByRole('button', { name: '选择文件' }));

    expect(click).not.toHaveBeenCalled();
  });
});

function DropZoneHarness({ options }: { options: DropZoneOptions }) {
  const { isDragOver, dropZoneProps } = useDropZone(options);
  return (
    <div data-testid="zone" data-drag-over={isDragOver} {...dropZoneProps}>
      <span data-testid="child">子元素</span>
    </div>
  );
}

const zone = () => screen.getByTestId('zone');
const child = () => screen.getByTestId('child');
const isOver = () => zone().getAttribute('data-drag-over') === 'true';

describe('useDropZone', () => {
  it('拖入文件时点亮悬停态，拖出后熄灭', () => {
    render(<DropZoneHarness options={{ onFiles: vi.fn() }} />);
    expect(isOver()).toBe(false);

    fireEvent.dragEnter(zone(), { dataTransfer: dragDataTransfer() });
    expect(isOver()).toBe(true);

    fireEvent.dragLeave(zone(), { dataTransfer: dragDataTransfer() });
    expect(isOver()).toBe(false);
  });

  it('指针在子元素之间移动时悬停态不闪断（dragleave 抖动抑制）', () => {
    render(<DropZoneHarness options={{ onFiles: vi.fn() }} />);

    // 进入拖拽区 → 进入子元素 → 离开子元素回到拖拽区，
    // 计数应始终 > 0，悬停态保持
    fireEvent.dragEnter(zone(), { dataTransfer: dragDataTransfer() });
    fireEvent.dragEnter(child(), { dataTransfer: dragDataTransfer() });
    fireEvent.dragLeave(zone(), { dataTransfer: dragDataTransfer() });
    expect(isOver()).toBe(true);

    fireEvent.dragLeave(child(), { dataTransfer: dragDataTransfer() });
    expect(isOver()).toBe(false);
  });

  it('拖拽内容不含文件时不点亮悬停态', () => {
    render(<DropZoneHarness options={{ onFiles: vi.fn() }} />);

    fireEvent.dragEnter(zone(), {
      dataTransfer: { types: ['text/plain'] } as unknown as DataTransfer,
    });

    expect(isOver()).toBe(false);
  });

  it('drop 时提取文件回调，并熄灭悬停态', () => {
    const onFiles = vi.fn();
    render(<DropZoneHarness options={{ onFiles }} />);
    const file = makeFile();

    fireEvent.dragEnter(zone(), { dataTransfer: dragDataTransfer() });
    fireEvent.drop(zone(), { dataTransfer: dragDataTransfer([file]) });

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(isOver()).toBe(false);
  });

  it('drop 未取到文件时不回调', () => {
    const onFiles = vi.fn();
    render(<DropZoneHarness options={{ onFiles }} />);

    fireEvent.drop(zone(), { dataTransfer: dragDataTransfer() });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('disabled 时不点亮悬停态、不接受 drop', () => {
    const onFiles = vi.fn();
    render(<DropZoneHarness options={{ onFiles, disabled: true }} />);
    const file = makeFile();

    fireEvent.dragEnter(zone(), { dataTransfer: dragDataTransfer() });
    fireEvent.drop(zone(), { dataTransfer: dragDataTransfer([file]) });

    expect(isOver()).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('拖拽中途被禁用时悬停态立即熄灭，重新启用后不残留', () => {
    const onFiles = vi.fn();
    const { rerender } = render(<DropZoneHarness options={{ onFiles }} />);

    fireEvent.dragEnter(zone(), { dataTransfer: dragDataTransfer() });
    expect(isOver()).toBe(true);

    rerender(<DropZoneHarness options={{ onFiles, disabled: true }} />);
    expect(isOver()).toBe(false);

    // 禁用期间浏览器补发的 dragleave 会把计数清干净
    fireEvent.dragLeave(zone(), { dataTransfer: dragDataTransfer() });

    rerender(<DropZoneHarness options={{ onFiles, disabled: false }} />);
    expect(isOver()).toBe(false);
  });

  it('onFiles 变化不会改变 dropZoneProps 的处理函数身份', () => {
    const { result, rerender } = renderHook(({ onFiles }) => useDropZone({ onFiles }), {
      initialProps: { onFiles: vi.fn() },
    });
    const before = result.current.dropZoneProps;

    rerender({ onFiles: vi.fn() });

    expect(result.current.dropZoneProps.onDrop).toBe(before.onDrop);
    expect(result.current.dropZoneProps.onDragEnter).toBe(before.onDragEnter);
  });

  it('onFiles 始终指向最新的回调实现', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ onFiles }) => useDropZone({ onFiles }), {
      initialProps: { onFiles: first },
    });

    rerender({ onFiles: second });

    const file = makeFile();
    act(() => {
      result.current.dropZoneProps.onDrop({
        preventDefault: () => {},
        dataTransfer: dragDataTransfer([file]),
      } as never);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith([file]);
  });
});
