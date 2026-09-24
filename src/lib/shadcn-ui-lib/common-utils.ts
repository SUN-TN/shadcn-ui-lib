/**
 * 通用工具（零依赖）
 *
 * 复用范围：全库通用——任何需要稳定 key / 列表项 id 的组件都可复用。
 */

let uidCounter = 0;

/**
 * 唯一标识：secure context（https / localhost）用 `crypto.randomUUID`，
 * 否则走内置回退（时间戳 + 自增序号 + 随机串）。
 *
 * 回退是必需的：`crypto.randomUUID` 只在 secure context 暴露，
 * 内网 http 部署下直接调用会抛 `TypeError`。
 * 该标识用于 React key / 列表项 id，不用于安全用途。
 */
export function genUid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  uidCounter += 1;
  const time = Date.now().toString(36);
  const seq = uidCounter.toString(36);
  // 随机段只负责打散，唯一性由「毫秒时间戳 + 自增序号」保证；
  // padEnd 是为了在 Math.random() 恰好给出短小数时保持格式稳定。
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `uid-${time}-${seq}-${random}`;
}
