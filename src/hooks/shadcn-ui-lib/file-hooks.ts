/**
 * 文件相关 React hooks（零依赖）
 *
 * 契约见《组件 API 契约：Upload》§6（Ref 方法）/ §9（可访问性）/ §7.1（拖入悬停态）。
 * 复用范围：全库通用——预览 URL 生命周期、隐藏 file input、拖拽区编排均可跨组件复用。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, RefObject } from 'react';

import { extractDroppedFiles } from '@/lib/shadcn-ui-lib/file-utils';

/** useFileInput 入参。 */
export interface FileInputOptions {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

/** useFileInput 返回：隐藏 input 的 ref、属性集合与命令式打开方法。 */
export interface FileInputController {
  inputRef: RefObject<HTMLInputElement | null>;
  /** 可直接展开到 `<input type="file">` 上的属性，保证 accept / disabled 与选项同源。 */
  inputProps: {
    type: 'file';
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
  };
  openFileDialog: () => void;
}

/** useDropZone 入参。 */
export interface DropZoneOptions {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

/** useDropZone 返回：悬停态与可直接展开到容器上的事件处理器。 */
export interface DropZoneController {
  isDragOver: boolean;
  dropZoneProps: {
    onDragEnter: (event: ReactDragEvent<HTMLElement>) => void;
    onDragOver: (event: ReactDragEvent<HTMLElement>) => void;
    onDragLeave: (event: ReactDragEvent<HTMLElement>) => void;
    onDrop: (event: ReactDragEvent<HTMLElement>) => void;
  };
}

/** 拖拽内容是否携带文件（外部应用拖入文本 / 链接时不应点亮悬停态）。 */
function hasFiles(event: ReactDragEvent<HTMLElement>): boolean {
  const types = event.dataTransfer?.types;
  // 环境不提供 types（如 jsdom）时不做判断，交由后续逻辑处理
  if (!types) return true;
  return Array.from(types).includes('Files');
}

/**
 * 预览 URL 生成与自动回收，规避 `URL.createObjectURL` 的内存泄漏。
 *
 * 实现说明：URL 在渲染期派生（`useMemo`），回收放在 effect 清理里。
 * 不采用 `useState` + effect 的写法——在 effect 体内同步 setState 会触发级联渲染
 * （本项目 `react-hooks/set-state-in-effect` 按 error 拦截）。
 * 已知边界：React StrictMode 的开发态双渲染会让同一个 Blob 短暂生成两个 URL，
 * 其中被丢弃的那个要等页面卸载才回收；生产构建无此行为。
 */
export function useObjectUrl(file: Blob | null | undefined): string | undefined {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

  useEffect(() => {
    if (!url) return;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

/**
 * 隐藏 input[type=file] 的控制与属性透传。
 *
 * `inputProps` 是 accept / multiple / disabled 的唯一来源，避免调用方重复声明；
 * `openFileDialog` 会先清空 `value`，否则连续两次选择同一个文件不会触发 change。
 */
export function useFileInput(options: FileInputOptions = {}): FileInputController {
  const { accept, multiple, disabled } = options;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFileDialog = useCallback(() => {
    const input = inputRef.current;
    if (!input || disabled) return;
    input.value = '';
    input.click();
  }, [disabled]);

  const inputProps = useMemo(
    () => ({ type: 'file' as const, accept, multiple, disabled }),
    [accept, multiple, disabled],
  );

  return { inputRef, inputProps, openFileDialog };
}

/**
 * 拖拽区事件编排（含 dragover 阻止默认与 dragleave 抖动抑制）。
 *
 * 抖动抑制用「深度计数」：指针在拖拽区与子元素之间移动时，浏览器会成对抛出
 * dragleave + dragenter；只看单个 dragleave 会让悬停态闪断。计数归零才熄灭。
 * 计数放在 ref 而非 state，避免每次 enter / leave 都多渲染一次。
 */
export function useDropZone(options: DropZoneOptions): DropZoneController {
  const { onFiles, disabled = false } = options;

  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);
  const onFilesRef = useRef(onFiles);

  // 回调写进 ref：既拿到最新实现，又不让 dropZoneProps 的身份随父组件重渲染而变
  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setIsDragOver(false);
  }, []);

  const handleDragEnter = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      // 禁用态下清掉可能残留的计数（含「拖拽中途被禁用」的切换）
      if (disabled) {
        resetDrag();
        return;
      }
      if (!hasFiles(event)) return;

      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragOver(true);
    },
    [disabled, resetDrag],
  );

  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (disabled) return;
      if (!hasFiles(event)) return;

      // 不 preventDefault 则浏览器不会派发 drop
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (disabled) {
        resetDrag();
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragOver(false);
    },
    [disabled, resetDrag],
  );

  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLElement>) => {
      if (disabled) {
        resetDrag();
        return;
      }

      event.preventDefault();
      resetDrag();

      const files = extractDroppedFiles(event.dataTransfer);
      if (files.length > 0) onFilesRef.current(files);
    },
    [disabled, resetDrag],
  );

  return {
    // 禁用态直接对外报「未悬停」，不依赖内部状态是否已清干净
    isDragOver: disabled ? false : isDragOver,
    dropZoneProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
