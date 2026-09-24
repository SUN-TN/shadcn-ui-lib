import { afterEach, describe, expect, it, vi } from 'vitest';

import { genUid } from '../common-utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('genUid', () => {
  it('crypto.randomUUID 可用时直接采用其返回值', () => {
    const randomUUID = vi.fn(() => '3f0c2b1a-0000-4000-8000-000000000000');
    vi.stubGlobal('crypto', { randomUUID });

    expect(genUid()).toBe('3f0c2b1a-0000-4000-8000-000000000000');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('非 secure context（无 randomUUID）时走内置回退', () => {
    // http 部署下 crypto.randomUUID 不存在，此时必须不抛错
    vi.stubGlobal('crypto', {});

    const uid = genUid();
    expect(uid).toMatch(/^uid-[0-9a-z]+-[0-9a-z]+-[0-9a-z]{8}$/);
  });

  it('回退实现连续调用不重复', () => {
    vi.stubGlobal('crypto', {});

    const uids = new Set(Array.from({ length: 200 }, () => genUid()));
    expect(uids.size).toBe(200);
  });
});
