/**
 * 上传传输层（原生 XHR，零依赖）
 *
 * 契约见《组件 API 契约：Upload》§12（上传策略与 customRequest 契约）。
 * 复用范围：全库通用——Upload 内置上传、Avatar 头像上传、RichText 配图上传共用。
 *
 * 为什么是 XHR 而不是 fetch：`fetch` 没有上传进度事件（无法拿到已发送字节数），
 * XHR 的 `upload.onprogress` 是唯一能上报 0–100 进度的标准 API。
 * 这不是技术债，是契约 §12 的既定选择。
 */
import { buildFormData } from '@/lib/shadcn-ui-lib/file-utils';

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

/**
 * XHR ProgressEvent → 0–100。
 *
 * `lengthComputable` 为 false（服务端未给出总长度）时无法推算百分比，
 * 按契约降级为 0（契约要求必须回传 0–100，不接受 undefined）。
 */
export function toUploadPercent(event: ProgressEvent): number {
  const { loaded, total, lengthComputable } = event;
  if (!lengthComputable || !total || total <= 0) return 0;

  const percent = (loaded / total) * 100;
  if (!Number.isFinite(percent)) return 0;

  return Math.min(100, Math.max(0, Math.round(percent)));
}

/** 响应体解析：能解析成 JSON 就给对象，否则给原始文本（空体给 null）。 */
function parseResponseBody(xhr: XMLHttpRequest): unknown {
  const text = xhr.responseText;
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * 原生 XHR multipart/form-data 上传器，返回 abort 句柄。
 *
 * 行为约定：
 *   - 不设置 Content-Type——必须由浏览器补 `multipart/form-data; boundary=...`，
 *     手动设置会丢掉 boundary 导致后端解析失败；
 *   - 2xx 视为成功，其余状态码与网络错误、超时走 `onError`；
 *   - **主动取消不回调 onError**：abort 由调用方发起，它已经知道结果，
 *     再回调错误会误报一个「上传失败」态。
 */
export function xhrUpload(option: UploadRequestOption): UploadRequestReturn {
  const {
    file,
    action,
    headers,
    data,
    name = 'file',
    method = 'POST',
    withCredentials = false,
    onProgress,
    onSuccess,
    onError,
  } = option;

  if (!action) {
    onError(new Error('缺少 action：内置上传需要提供上传地址'));
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open(method, action, true);
  if (withCredentials) xhr.withCredentials = true;

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
  }

  xhr.upload.onprogress = (event: ProgressEvent) => {
    onProgress({ percent: toUploadPercent(event) });
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      onSuccess(parseResponseBody(xhr), xhr);
    } else {
      onError(new Error(`上传失败：HTTP ${xhr.status}`), xhr);
    }
  };
  xhr.onerror = () => {
    onError(new Error('上传失败：网络错误'), xhr);
  };
  xhr.ontimeout = () => {
    onError(new Error('上传超时'), xhr);
  };

  xhr.send(buildFormData(file, data, name));

  return {
    abort: () => {
      xhr.abort();
    },
  };
}
