/**
 * 文件相关 React hooks（零依赖）
 *
 * ⚠️ PLACEHOLDER：本文件当前为「模块骨架」——导出签名与类型已定稿，函数体待实现。
 * 仅用于跑通 registry 生成管线（见 tool-registry-plan-draft.md §8.1）。
 * 契约见《组件 API 契约：Upload》§6（Ref 方法）/ §9（可访问性）。
 */
import type { RefObject } from 'react';

/** useFileInput 入参。 */
export interface FileInputOptions {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

/** useFileInput 返回：隐藏 input 的 ref 与命令式打开方法。 */
export interface FileInputController {
  inputRef: RefObject<HTMLInputElement | null>;
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
    onDragEnter: (event: DragEvent) => void;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
}

const notImplemented = (fn: string): never => {
  throw new Error(`${fn}：占位实现，尚未落地（见 tool-registry-plan-draft.md §8.1）`);
};

/** 预览 URL 生成与自动回收，规避 URL.createObjectURL 的内存泄漏。 */
export function useObjectUrl(file: Blob | null | undefined): string | undefined {
  return notImplemented(`useObjectUrl(${file ? 'blob' : 'null'})`);
}

/** 隐藏 input[type=file] 的控制与属性透传。 */
export function useFileInput(options: FileInputOptions = {}): FileInputController {
  return notImplemented(`useFileInput(${options.accept ?? 'any'})`);
}

/** 拖拽区事件编排（含 dragover 阻止默认与 dragleave 抖动抑制）。 */
export function useDropZone(options: DropZoneOptions): DropZoneController {
  return notImplemented(`useDropZone(${options.disabled ? 'disabled' : 'enabled'})`);
}
