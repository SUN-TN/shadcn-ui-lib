/**
 * 通用工具（零依赖）
 *
 * ⚠️ PLACEHOLDER：本文件当前为「模块骨架」——导出签名已定稿，函数体待实现。
 * 仅用于跑通 registry 生成管线（见 tool-registry-plan-draft.md §8.1）。
 */

const notImplemented = (fn: string): never => {
  throw new Error(`${fn}：占位实现，尚未落地（见 tool-registry-plan-draft.md §8.1）`);
};

/** 稳定唯一标识：secure context 用 crypto.randomUUID，否则内置回退。 */
export function genUid(): string {
  return notImplemented('genUid()');
}
