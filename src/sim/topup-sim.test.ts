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
      strategyId: 'S1',
      trials: 200,
      seed: 'fixed-seed',
    });

    expect(out.medianTopUpPulls).toBe(0);
    expect(out.medianTopUpArsenal).toBe(0);
    expect(out.avgTopUpPulls).toBe(0);
    expect(out.avgTopUpArsenal).toBe(0);
  });
});
