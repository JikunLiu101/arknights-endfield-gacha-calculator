import type { SimInput } from './types';

export function defaultSimInput(): SimInput {
  return {
    currentPulls: 0,
    pullsPerVersion: 50,
    arsenalPerVersion: 1000, // 每版本武库配额
    versionCount: 3,
    bannersPerVersion: 2,
    strategyId: 'S1',
    trials: 10000,
    seed: null,
  };
}
