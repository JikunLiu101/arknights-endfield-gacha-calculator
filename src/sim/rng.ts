// 简单、可复现的 PRNG（xorshift32）
// 说明：这不是加密 RNG；仅用于模拟复现。

export type Rng = {
  nextFloat: () => number; // [0, 1)
};

function hashStringToUint32(seed: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: string | null): Rng {
  let state = seed ? hashStringToUint32(seed) : (Date.now() >>> 0);

  const nextUint32 = () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };

  return {
    nextFloat: () => nextUint32() / 2 ** 32,
  };
}
