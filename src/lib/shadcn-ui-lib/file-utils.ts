/**
 * 文件工具集（零依赖）
 *
 * ⚠️ PLACEHOLDER：本文件当前为「模块骨架」——导出签名与类型已定稿，函数体待实现。
 * 仅用于跑通 registry 生成管线（见 tool-registry-plan-draft.md §8.1）。
 * 行为契约见《组件 API 契约：Upload》§13（校验与限制策略）。
 */

/** 文件校验结果：ok 为 false 时附带可直接展示的文案。 */
export type FileValidationResult = { ok: true } | { ok: false; message: string };

const notImplemented = (fn: string): never => {
  throw new Error(`${fn}：占位实现，尚未落地（见 tool-registry-plan-draft.md §8.1）`);
};

/** 解析 accept 字符串（MIME 通配 + 扩展名）为规则列表。 */
export function parseAccept(accept: string): string[] {
  return notImplemented(`parseAccept(${accept})`);
}

/** 判断文件是否匹配 accept 规则；文件选择与拖入二次校验共用。 */
export function matchAccept(file: File, accept: string): boolean {
  return notImplemented(`matchAccept(${file.name}, ${accept})`);
}

/** 体积校验：超过 maxSize（字节）时返回失败与文案。 */
export function validateMaxSize(file: File, maxSize?: number): FileValidationResult {
  return notImplemented(`validateMaxSize(${file.name}, ${String(maxSize)})`);
}

/** 数量校验：超过 maxCount 时返回失败与文案。 */
export function validateMaxCount(count: number, maxCount?: number): FileValidationResult {
  return notImplemented(`validateMaxCount(${count}, ${String(maxCount)})`);
}

/** 探测图片尺寸（优先 createImageBitmap，回退 Image + objectURL）。 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return notImplemented(`getImageDimensions(${file.name})`);
}

/** FileReader 封装：按需读取为 dataURL / text / arrayBuffer。 */
export function readFileAs(file: File, as: 'dataURL'): Promise<string>;
export function readFileAs(file: File, as: 'text'): Promise<string>;
export function readFileAs(file: File, as: 'arrayBuffer'): Promise<ArrayBuffer>;
export function readFileAs(
  file: File,
  as: 'dataURL' | 'text' | 'arrayBuffer',
): Promise<string | ArrayBuffer> {
  return notImplemented(`readFileAs(${file.name}, ${as})`);
}

/** 触发浏览器下载。 */
export function downloadFile(url: string, filename?: string): void {
  notImplemented(`downloadFile(${url}, ${String(filename)})`);
}

/** 构造 multipart 表单体（字段名默认 file，附加业务字段一并写入）。 */
export function buildFormData(file: Blob, data?: Record<string, unknown>, name = 'file'): FormData {
  return notImplemented(`buildFormData(${name}, ${String(Object.keys(data ?? {}).length)} fields)`);
}

/** 从 DataTransfer 提取文件列表（过滤目录项）。 */
export function extractDroppedFiles(dataTransfer: DataTransfer | null): File[] {
  return notImplemented(`extractDroppedFiles(${dataTransfer ? 'DataTransfer' : 'null'})`);
}
