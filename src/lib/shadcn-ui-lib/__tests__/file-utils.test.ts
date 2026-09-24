import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildFormData,
  downloadFile,
  extractDroppedFiles,
  getImageDimensions,
  matchAccept,
  parseAccept,
  readFileAs,
  validateMaxCount,
  validateMaxSize,
} from '../file-utils';

const makeFile = (name: string, type = '', content = 'x'): File =>
  new File([content], name, { type });

/** 构造 extractDroppedFiles 需要的 DataTransfer 子集。 */
function makeDataTransfer(options: {
  items?: { kind: string; file?: File | null; isDirectory?: boolean }[];
  files?: File[];
}): DataTransfer {
  const items = (options.items ?? []).map((item) => ({
    kind: item.kind,
    getAsFile: () => item.file ?? null,
    ...(item.isDirectory === undefined
      ? {}
      : { webkitGetAsEntry: () => ({ isDirectory: item.isDirectory }) }),
  }));

  return { items, files: options.files ?? [] } as unknown as DataTransfer;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('parseAccept', () => {
  it('拆分、去空格、转小写并去重', () => {
    expect(parseAccept('image/*, .PDF , image/*')).toEqual(['image/*', '.pdf']);
  });

  it('空字符串得到空规则表（表示不限制）', () => {
    expect(parseAccept('')).toEqual([]);
    expect(parseAccept('  ,  ')).toEqual([]);
  });
});

describe('matchAccept', () => {
  it('未声明 accept 时一律放行', () => {
    expect(matchAccept(makeFile('a.bin', ''), '')).toBe(true);
  });

  it('扩展名规则不区分大小写', () => {
    expect(matchAccept(makeFile('REPORT.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(matchAccept(makeFile('report.png', 'image/png'), '.pdf')).toBe(false);
  });

  it('MIME 通配规则按主类型匹配', () => {
    expect(matchAccept(makeFile('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchAccept(makeFile('a.txt', 'text/plain'), 'image/*')).toBe(false);
  });

  it('精确 MIME 规则要求完全一致', () => {
    expect(matchAccept(makeFile('a.png', 'image/png'), 'image/png')).toBe(true);
    expect(matchAccept(makeFile('a.jpg', 'image/jpeg'), 'image/png')).toBe(false);
  });

  it('多规则取并集', () => {
    expect(matchAccept(makeFile('a.pdf', 'application/pdf'), 'image/*,.pdf')).toBe(true);
  });

  it('浏览器未给出 file.type 时 MIME 规则不匹配（已知边界）', () => {
    expect(matchAccept(makeFile('a.weird', ''), 'image/png')).toBe(false);
    // 此时应改用扩展名规则
    expect(matchAccept(makeFile('a.weird', ''), '.weird')).toBe(true);
  });
});

describe('validateMaxSize', () => {
  it('未设置上限视为不限制', () => {
    expect(validateMaxSize(makeFile('a.txt', '', 'x'.repeat(10)))).toEqual({ ok: true });
    expect(validateMaxSize(makeFile('a.txt', '', 'x'.repeat(10)), 0)).toEqual({ ok: true });
  });

  it('刚好等于上限通过', () => {
    expect(validateMaxSize(makeFile('a.txt', '', '12345'), 5)).toEqual({ ok: true });
  });

  it('超限时给出可读文案', () => {
    const result = validateMaxSize(makeFile('a.txt', '', 'x'.repeat(2048)), 1024);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('应当校验失败');
    expect(result.message).toContain('1 KB');
  });
});

describe('validateMaxCount', () => {
  it('未设置上限视为不限制', () => {
    expect(validateMaxCount(99)).toEqual({ ok: true });
  });

  it('刚好等于上限通过，超出给出文案', () => {
    expect(validateMaxCount(3, 3)).toEqual({ ok: true });

    const result = validateMaxCount(4, 3);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('应当校验失败');
    expect(result.message).toContain('3');
  });
});

describe('getImageDimensions', () => {
  it('优先用 createImageBitmap，并在取值后释放位图', async () => {
    const close = vi.fn();
    const createImageBitmapStub = vi.fn(async () => ({ width: 800, height: 600, close }));
    vi.stubGlobal('createImageBitmap', createImageBitmapStub);

    await expect(getImageDimensions(makeFile('a.png', 'image/png'))).resolves.toEqual({
      width: 800,
      height: 600,
    });
    expect(createImageBitmapStub).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('createImageBitmap 失败时回退到 Image + objectURL，并回收 URL', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('unsupported');
      }),
    );

    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    class FakeImage {
      naturalWidth = 320;
      naturalHeight = 240;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);

    await expect(getImageDimensions(makeFile('a.png', 'image/png'))).resolves.toEqual({
      width: 320,
      height: 240,
    });
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:mock');
  });

  it('两条路径都失败时 reject', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('unsupported');
      }),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    class FailingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', FailingImage);

    await expect(getImageDimensions(makeFile('broken.png', 'image/png'))).rejects.toThrow(
      '图片解析失败：broken.png',
    );
  });
});

describe('readFileAs', () => {
  it('读取为文本', async () => {
    await expect(readFileAs(makeFile('a.txt', 'text/plain', 'hello'), 'text')).resolves.toBe(
      'hello',
    );
  });

  it('读取为 dataURL', async () => {
    const result = await readFileAs(makeFile('a.txt', 'text/plain', 'hello'), 'dataURL');
    expect(result.startsWith('data:')).toBe(true);
  });

  it('读取为 ArrayBuffer', async () => {
    const result = await readFileAs(makeFile('a.txt', 'text/plain', 'abc'), 'arrayBuffer');
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(3);
  });
});

describe('downloadFile', () => {
  it('创建临时 a[download] 触发点击后立即移除', () => {
    const captured: (HTMLAnchorElement | null)[] = [];
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      // 点击时锚点仍在文档里，这里取属性后函数会立刻 remove
      captured.push(document.querySelector('a'));
    });

    downloadFile('/files/report.pdf', 'report.pdf');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(captured[0]?.getAttribute('href')).toBe('/files/report.pdf');
    expect(captured[0]?.getAttribute('download')).toBe('report.pdf');
    expect(document.querySelector('a')).toBeNull();
  });

  it('未给 filename 时不设置 download 属性', () => {
    const captured: (HTMLAnchorElement | null)[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      captured.push(document.querySelector('a'));
    });

    downloadFile('/files/report.pdf');

    expect(captured[0]?.hasAttribute('download')).toBe(false);
  });
});

describe('buildFormData', () => {
  it('文件挂在默认字段名 file 下', () => {
    const formData = buildFormData(makeFile('a.txt', 'text/plain', 'x'));
    const value = formData.get('file');

    expect(value).toBeInstanceOf(File);
    expect((value as File).name).toBe('a.txt');
  });

  it('支持自定义字段名', () => {
    const formData = buildFormData(makeFile('a.txt'), undefined, 'avatar');
    expect(formData.has('file')).toBe(false);
    expect(formData.get('avatar')).toBeInstanceOf(File);
  });

  it('附加字段按类型序列化', () => {
    const formData = buildFormData(makeFile('a.txt'), {
      biz: 'report',
      count: 42,
      flag: true,
      nested: { a: 1 },
      list: [1, 2],
    });

    expect(formData.get('biz')).toBe('report');
    expect(formData.get('count')).toBe('42');
    expect(formData.get('flag')).toBe('true');
    expect(formData.get('nested')).toBe('{"a":1}');
    expect(formData.get('list')).toBe('[1,2]');
  });

  it('跳过 undefined / null，避免提交字面量', () => {
    const formData = buildFormData(makeFile('a.txt'), { a: undefined, b: null });
    expect(formData.has('a')).toBe(false);
    expect(formData.has('b')).toBe(false);
  });

  it('Blob 字段原样写入', () => {
    const blob = new Blob(['raw'], { type: 'text/plain' });
    const formData = buildFormData(makeFile('a.txt'), { extra: blob });
    expect(formData.get('extra')).toBeInstanceOf(Blob);
  });
});

describe('extractDroppedFiles', () => {
  it('dataTransfer 为 null 时返回空数组', () => {
    expect(extractDroppedFiles(null)).toEqual([]);
  });

  it('从 items 提取文件', () => {
    const file = makeFile('a.txt');
    const files = extractDroppedFiles(
      makeDataTransfer({ items: [{ kind: 'file', file }], files: [file] }),
    );
    expect(files).toEqual([file]);
  });

  it('跳过目录项', () => {
    const file = makeFile('a.txt');
    const directory = makeFile('folder');
    const files = extractDroppedFiles(
      makeDataTransfer({
        items: [
          { kind: 'file', file: directory, isDirectory: true },
          { kind: 'file', file },
        ],
        files: [directory, file],
      }),
    );
    expect(files).toEqual([file]);
  });

  it('只拖入目录时不回退到 files（否则会放行目录）', () => {
    const directory = makeFile('folder');
    const files = extractDroppedFiles(
      makeDataTransfer({
        items: [{ kind: 'file', file: directory, isDirectory: true }],
        files: [directory],
      }),
    );
    expect(files).toEqual([]);
  });

  it('跳过非文件类型（如拖入的文本 / 链接）', () => {
    const files = extractDroppedFiles(
      makeDataTransfer({ items: [{ kind: 'string', file: null }], files: [] }),
    );
    expect(files).toEqual([]);
  });

  it('items 为空时回退到 files（Safari 旧版）', () => {
    const file = makeFile('a.txt');
    expect(extractDroppedFiles(makeDataTransfer({ items: [], files: [file] }))).toEqual([file]);
  });
});
