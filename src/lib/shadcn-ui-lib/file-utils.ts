/**
 * 文件工具集（零依赖）
 *
 * 行为契约见《组件 API 契约：Upload》§13（校验与限制策略）。
 * 复用范围：全库通用——Upload、Avatar、RichText 配图、表单附件等均可复用。
 *
 * 设计约定：
 *   - 全部为纯函数或浏览器 API 薄封装，不引入任何 npm 依赖；
 *   - 校验类函数返回结构化结果而非抛错，文案可直接渲染到列表项；
 *   - 需要 DOM（下载、图片解码、拖入提取）的函数不在 SSR 下调用。
 */

/** 文件校验结果：ok 为 false 时附带可直接展示的文案。 */
export type FileValidationResult = { ok: true } | { ok: false; message: string };

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 字节数 → 可读字符串（用于错误文案）。 */
function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, bytes)} B`;

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // 小于 10 保留一位小数（2.3 MB），否则取整（123 MB）
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${FILE_SIZE_UNITS[unit] ?? 'B'}`;
}

/**
 * 解析 accept 字符串（MIME 通配 + 扩展名）为规则列表。
 * 输入 `"image/*, .pdf"` → `["image/*", ".pdf"]`（已去重、转小写）。
 */
export function parseAccept(accept: string): string[] {
  if (!accept) return [];
  const rules = new Set<string>();
  for (const raw of accept.split(',')) {
    const rule = raw.trim().toLowerCase();
    if (rule) rules.add(rule);
  }
  return [...rules];
}

/**
 * 判断文件是否匹配 accept 规则；文件选择与拖入二次校验共用。
 *
 * 支持三种规则：`image/*`（MIME 通配）、`image/png`（精确 MIME）、`.pdf`（扩展名）。
 * 边界说明：MIME 规则依赖浏览器给出的 `file.type`；若浏览器未识别该类型
 * （`file.type === ''`，多见于罕见扩展名），MIME 规则不匹配，此时应改用扩展名规则。
 */
export function matchAccept(file: File, accept: string): boolean {
  const rules = parseAccept(accept);
  // 未声明 accept 视为不限制
  if (rules.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/**
 * 体积校验：超过 maxSize（字节）时返回失败与文案。
 * maxSize 未设置（undefined）或非正数时视为不限制。
 */
export function validateMaxSize(file: File, maxSize?: number): FileValidationResult {
  if (maxSize === undefined || maxSize <= 0) return { ok: true };
  if (file.size <= maxSize) return { ok: true };
  return { ok: false, message: `文件大小超出限制（最大 ${formatFileSize(maxSize)}）` };
}

/**
 * 数量校验：超过 maxCount 时返回失败与文案。
 * maxCount 未设置（undefined）或非正数时视为不限制。
 */
export function validateMaxCount(count: number, maxCount?: number): FileValidationResult {
  if (maxCount === undefined || maxCount <= 0) return { ok: true };
  if (count <= maxCount) return { ok: true };
  return { ok: false, message: `最多只能选择 ${maxCount} 个文件` };
}

/**
 * 探测图片尺寸（优先 createImageBitmap，回退 Image + objectURL）。
 *
 * 两条路径都按「显示方向」取值（`imageOrientation: 'from-image'`），
 * 与 `<img>` 默认行为一致，避免带 EXIF 旋转的照片出现宽高互换。
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const size = { width: bitmap.width, height: bitmap.height };
      if (typeof bitmap.close === 'function') bitmap.close();
      return size;
    } catch {
      // 部分环境 / 格式（如 SVG）不支持 createImageBitmap，回退到 <img> 解码
    }
  }

  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = (): void => {
      URL.revokeObjectURL(url);
      image.onload = null;
      image.onerror = null;
    };

    image.onload = () => {
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      cleanup();
      resolve(size);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`图片解析失败：${file.name}`));
    };

    image.src = url;
  });
}

/** FileReader 封装：按需读取为 dataURL / text / arrayBuffer。 */
export function readFileAs(file: File, as: 'dataURL'): Promise<string>;
export function readFileAs(file: File, as: 'text'): Promise<string>;
export function readFileAs(file: File, as: 'arrayBuffer'): Promise<ArrayBuffer>;
export function readFileAs(
  file: File,
  as: 'dataURL' | 'text' | 'arrayBuffer',
): Promise<string | ArrayBuffer> {
  return new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string | ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(`读取文件失败：${file.name}`));
    };

    if (as === 'dataURL') reader.readAsDataURL(file);
    else if (as === 'text') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

/**
 * 触发浏览器下载。
 *
 * 注意：若传入的是 `blob:` URL，本函数**不负责回收**——URL 的生命周期归创建方
 * （通常由 `useObjectUrl` 管理），在此 revoke 会让调用方拿到失效地址。
 */
export function downloadFile(url: string, filename?: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (filename) anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * 构造 multipart 表单体（字段名默认 file，附加业务字段一并写入）。
 *
 * 附加字段的序列化规则：`Blob` 原样写入（保留文件名），`string` 原样写入，
 * 其余（number / boolean / object / array）走 `JSON.stringify`；
 * `undefined` / `null` 跳过，避免后端收到字面量 "undefined"。
 */
export function buildFormData(file: Blob, data?: Record<string, unknown>, name = 'file'): FormData {
  const formData = new FormData();
  formData.append(name, file);

  if (!data) return formData;

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') formData.append(key, value);
    else if (value instanceof Blob) formData.append(key, value);
    else formData.append(key, JSON.stringify(value));
  }

  return formData;
}

/**
 * 从 DataTransfer 提取文件列表（过滤目录项）。
 *
 * v1 不递归展开目录：拖入文件夹时跳过该项，避免把整个目录树静默上传。
 * 优先走 `items`（可借 `webkitGetAsEntry` 识别目录）；Safari 旧版 items 为空时
 * 回退到 `files`。
 */
export function extractDroppedFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const files: File[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item || item.kind !== 'file') continue;

      const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
      if (entry?.isDirectory) continue;

      const file = item.getAsFile();
      if (file) files.push(file);
    }
    // items 可用就以它为准：即使结果为空（例如只拖入了一个目录），
    // 也不要回退到 files——浏览器会把目录本身也放进 files，回退等于放行目录。
    return files;
  }

  return Array.from(dataTransfer.files);
}
