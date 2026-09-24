/**
 * 上传传输层（原生 XHR，零依赖）
 *
 * ⚠️ PLACEHOLDER：本文件当前为「模块骨架」——契约类型已定稿，函数体待实现。
 * 仅用于跑通 registry 生成管线（见 tool-registry-plan-draft.md §8.1）。
 * 契约见《组件 API 契约：Upload》§12（上传策略与 customRequest 契约）。
 */

/** customRequest 统一入参契约。 */
export interface UploadRequestOption {
  file: File | Blob;
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, unknown>;
  name?: string;
  method?: string;
  withCredentials?: boolean;
  onProgress: (event: { percent: number }) => void;
  onSuccess: (body: unknown, xhr?: XMLHttpRequest) => void;
  onError: (error: Error, xhr?: XMLHttpRequest) => void;
}

/** customRequest 返回值：可返回 abort 句柄以支持取消。 */
export type UploadRequestReturn = { abort?: () => void } | void;

const notImplemented = (fn: string): never => {
  throw new Error(`${fn}：占位实现，尚未落地（见 tool-registry-plan-draft.md §8.1）`);
};

/** XHR ProgressEvent → 0–100；lengthComputable 为 false 时降级。 */
export function toUploadPercent(event: ProgressEvent): number {
  return notImplemented(`toUploadPercent(${event.type})`);
}

/** 原生 XHR multipart/form-data 上传器，返回 abort 句柄。 */
export function xhrUpload(option: UploadRequestOption): UploadRequestReturn {
  return notImplemented(`xhrUpload(${option.action ?? 'no-action'})`);
}
