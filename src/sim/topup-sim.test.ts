import { describe, it, expect } from 'vitest';
import { runTopUpSimulation } from './engine';

describe('runTopUpSimulation (0+1 top-up)', () => {
  it('requires zero top-up when resources are abundant', () => {
    const out = runTopUpSimulation({
      currentPulls: 100000,
      currentArsenal: 100000000,
      pullsPerVersion: 0,
      arsenalPerVersion: 0,
      versionCount: 1,
      bannersPerVersion: 1,
      excludeFirstVersionResources: false,
      strategyId: 'S1',
      trials: 200,
      seed: 'fixed-seed',
    });

    expect(out.medianTopUpPulls).toBe(0);
    expect(out.medianTopUpArsenal).toBe(0);
    expect(out.avgTopUpPulls).toBe(0);
    expect(out.avgTopUpArsenal).toBe(0);
  });

  it('excludes version-1 welfare from totalPullsNoTopUp when enabled', () => {
    const base = {
      currentPulls: 0,
      currentArsenal: 0,
      pullsPerVersion: 100,
      arsenalPerVersion: 0,
      versionCount: 2,
      bannersPerVersion: 1,
      strategyId: 'S1' as const,
      trials: 10,
      seed: 'fixed-seed',
    };

    const outInclude = runTopUpSimulation({
      ...base,
      excludeFirstVersionResources: false,
    });
    const outExclude = runTopUpSimulation({
      ...base,
      excludeFirstVersionResources: true,
    });

    // totalPullsNoTopUp = initial + welfare + banner bonus
    // welfare: 2*100 vs 1*100
    expect(outInclude.totalPullsNoTopUp - outExclude.totalPullsNoTopUp).toBe(100);
  });
});
