import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toUploadPercent, xhrUpload } from '../upload-transport';

const makeFile = (name = 'a.txt', content = 'x'): File =>
  new File([content], name, { type: 'text/plain' });

/** 只保留被测代码会触碰的那部分 XHR 接口。 */
class FakeXhr {
  static last: FakeXhr | null = null;

  method = '';
  url = '';
  async = true;
  withCredentials = false;
  status = 200;
  responseText = '';
  headers: Record<string, string> = {};
  sentBody: Document | XMLHttpRequestBodyInit | null = null;
  aborted = false;

  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string, async: boolean): void {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  send(body: Document | XMLHttpRequestBodyInit | null): void {
    this.sentBody = body;
  }

  abort(): void {
    this.aborted = true;
  }
}

const progress = (loaded: number, total: number, lengthComputable = true): ProgressEvent =>
  ({ loaded, total, lengthComputable }) as ProgressEvent;

/** 取到本次调用产生的 XHR 实例；没有则直接失败。 */
function lastXhr(): FakeXhr {
  const xhr = FakeXhr.last;
  if (!xhr) throw new Error('没有创建 XMLHttpRequest');
  return xhr;
}

beforeEach(() => {
  FakeXhr.last = null;
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('toUploadPercent', () => {
  it('按已发送 / 总长度换算并取整', () => {
    expect(toUploadPercent(progress(0, 200))).toBe(0);
    expect(toUploadPercent(progress(50, 200))).toBe(25);
    expect(toUploadPercent(progress(1, 3))).toBe(33);
    expect(toUploadPercent(progress(200, 200))).toBe(100);
  });

  it('结果被夹在 0–100', () => {
    expect(toUploadPercent(progress(300, 200))).toBe(100);
    expect(toUploadPercent(progress(-5, 200))).toBe(0);
  });

  it('lengthComputable 为 false 时降级为 0', () => {
    expect(toUploadPercent(progress(50, 200, false))).toBe(0);
  });

  it('总长度缺失或为 0 时降级为 0（不产生 NaN）', () => {
    expect(toUploadPercent(progress(50, 0))).toBe(0);
    expect(toUploadPercent(progress(50, Number.NaN))).toBe(0);
  });
});

describe('xhrUpload', () => {
  it('发起 multipart POST，并把 data 与 headers 一并带上', () => {
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      headers: { 'X-Token': 't1' },
      data: { biz: 'report' },
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    const xhr = lastXhr();
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/upload');
    expect(xhr.async).toBe(true);
    expect(xhr.headers).toEqual({ 'X-Token': 't1' });
    expect(xhr.sentBody).toBeInstanceOf(FormData);
    expect((xhr.sentBody as FormData).get('biz')).toBe('report');
    expect((xhr.sentBody as FormData).get('file')).toBeInstanceOf(File);
  });

  it('不设置 Content-Type（boundary 必须由浏览器补）', () => {
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      headers: { 'X-Token': 't1' },
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    expect(lastXhr().headers).not.toHaveProperty('Content-Type');
  });

  it('支持自定义 method / 字段名 / withCredentials', () => {
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      method: 'PUT',
      name: 'avatar',
      withCredentials: true,
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    const xhr = lastXhr();
    expect(xhr.method).toBe('PUT');
    expect(xhr.withCredentials).toBe(true);
    expect((xhr.sentBody as FormData).has('avatar')).toBe(true);
  });

  it('上传进度回调归一化为 0–100', () => {
    const onProgress = vi.fn();
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      onProgress,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    lastXhr().upload.onprogress?.(progress(1, 4));

    expect(onProgress).toHaveBeenCalledWith({ percent: 25 });
  });

  it('2xx 时把 JSON 响应体解析后交给 onSuccess', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      onProgress: vi.fn(),
      onSuccess,
      onError,
    });

    const xhr = lastXhr();
    xhr.status = 201;
    xhr.responseText = '{"id":"f1"}';
    xhr.onload?.();

    expect(onSuccess).toHaveBeenCalledWith({ id: 'f1' }, xhr);
    expect(onError).not.toHaveBeenCalled();
  });

  it('非 JSON 响应体原样回传，空响应体回传 null', () => {
    const onSuccess = vi.fn();
    const send = (responseText: string): void => {
      xhrUpload({
        file: makeFile(),
        action: '/api/upload',
        onProgress: vi.fn(),
        onSuccess,
        onError: vi.fn(),
      });
      const xhr = lastXhr();
      xhr.responseText = responseText;
      xhr.onload?.();
    };

    send('<html>ok</html>');
    send('');

    expect(onSuccess).toHaveBeenNthCalledWith(1, '<html>ok</html>', expect.anything());
    expect(onSuccess).toHaveBeenNthCalledWith(2, null, expect.anything());
  });

  it('非 2xx 状态码走 onError 并带上状态码', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      onProgress: vi.fn(),
      onSuccess,
      onError,
    });

    const xhr = lastXhr();
    xhr.status = 500;
    xhr.onload?.();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0]?.[0] as Error).message).toContain('500');
  });

  it('网络错误与超时分别走 onError', () => {
    const onError = vi.fn();
    const start = (): FakeXhr => {
      xhrUpload({
        file: makeFile(),
        action: '/api/upload',
        onProgress: vi.fn(),
        onSuccess: vi.fn(),
        onError,
      });
      return lastXhr();
    };

    start().onerror?.();
    start().ontimeout?.();

    expect((onError.mock.calls[0]?.[0] as Error).message).toContain('网络错误');
    expect((onError.mock.calls[1]?.[0] as Error).message).toContain('超时');
  });

  it('缺少 action 时直接报错，不创建请求', () => {
    const onError = vi.fn();
    const handle = xhrUpload({
      file: makeFile(),
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      onError,
    });

    expect(FakeXhr.last).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(handle).toBeUndefined();
  });

  it('返回 abort 句柄，且主动取消不再回调 onError', () => {
    const onError = vi.fn();
    const handle = xhrUpload({
      file: makeFile(),
      action: '/api/upload',
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      onError,
    });

    expect(handle).toBeDefined();
    if (!handle || !handle.abort) throw new Error('xhrUpload 应返回 abort 句柄');

    handle.abort();

    expect(lastXhr().aborted).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });
});
