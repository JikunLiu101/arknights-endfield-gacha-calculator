/**
 * 核心抽卡引擎测试
 *
 * 测试保底、井、加急招募等核心机制
 */

import {
  simulateSinglePull,
  simulateFastTrack,
  createInitialGlobalState,
  createInitialBannerState,
} from './gacha-core';
import { createRng } from './rng';

// ============ 测试工具函数 ============

/**
 * 模拟多次抽卡直到满足条件或达到上限
 */
function pullUntil(
  globalState: ReturnType<typeof createInitialGlobalState>,
  bannerState: ReturnType<typeof createInitialBannerState>,
  rng: ReturnType<typeof createRng>,
  maxPulls: number,
  condition: (result: ReturnType<typeof simulateSinglePull>['result']) => boolean
): {
  pullCount: number;
  results: ReturnType<typeof simulateSinglePull>['result'][];
  finalGlobalState: ReturnType<typeof createInitialGlobalState>;
  finalBannerState: ReturnType<typeof createInitialBannerState>;
} {
  let currentGlobal = globalState;
  let currentBanner = bannerState;
  const results: ReturnType<typeof simulateSinglePull>['result'][] = [];

  for (let i = 0; i < maxPulls; i++) {
    const { result, newGlobalState, newBannerState } = simulateSinglePull(
      currentGlobal,
      currentBanner,
      rng
    );

    results.push(result);
    currentGlobal = newGlobalState;
    currentBanner = newBannerState;

    if (condition(result)) {
      break;
    }
  }

  return {
    pullCount: results.length,
    results,
    finalGlobalState: currentGlobal,
    finalBannerState: currentBanner,
  };
}

// ============ 测试用例 ============

describe('核心抽卡引擎测试', () => {
  describe('保底机制', () => {
    it('65抽后触发保底', () => {
      const rng = createRng('test-pity');
      let globalState = createInitialGlobalState();
      const bannerState = createInitialBannerState();

      // 手动设置保底计数器为65（已经触发保底）
      globalState.pityCounter = 65;

      // 下一次抽卡应该有5.8%的概率出6星
      const { result, newGlobalState } = simulateSinglePull(globalState, bannerState, rng);

      expect(result.triggeredPity).toBe(true);
      expect(globalState.pityCounter).toBe(65);
      expect(newGlobalState.pityCounter).toBeGreaterThanOrEqual(0);
    });

    it('获得6星后重置保底', () => {
      const rng = createRng('test-pity-reset');
      let globalState = createInitialGlobalState();
      let bannerState = createInitialBannerState();

      // 模拟抽到6星前的保底计数
      globalState.pityCounter = 70;

      // 执行多次抽卡直到出6星
      const { finalGlobalState, results } = pullUntil(
        globalState,
        bannerState,
        rng,
        200,
        (result) => result.rarity === 6
      );

      const got6Star = results.some((r) => r.rarity === 6);

      expect(got6Star).toBe(true);
      expect(finalGlobalState.pityCounter).toBe(0);
    });

    it('第80抽强制给出6星', () => {
      const rng = createRng('test-hard-pity');

      // 测试80抽硬保底
      let globalState = createInitialGlobalState();
      let bannerState = createInitialBannerState();

      // 设置保底计数器为80（硬保底触发点）
      globalState.pityCounter = 80;

      // 第80抽应该100%给6星
      const { result } = simulateSinglePull(globalState, bannerState, rng);

      expect(result.rarity).toBe(6);
      expect(result.triggeredPity).toBe(true);

      // 测试多次验证100%概率
      let successCount = 0;
      for (let i = 0; i < 100; i++) {
        const testRng = createRng(`hard-pity-${i}`);
        const testGlobal = createInitialGlobalState();
        testGlobal.pityCounter = 80;
        const testBanner = createInitialBannerState();

        const { result: testResult } = simulateSinglePull(testGlobal, testBanner, testRng);
        if (testResult.rarity === 6) {
          successCount++;
        }
      }

      expect(successCount).toBe(100);
    });
  });

  describe('井机制', () => {
    it('第120抽强制给出UP', () => {
      const rng = createRng('test-spark');
      let globalState = createInitialGlobalState();
      let bannerState = createInitialBannerState();

      // 模拟前119抽都没出UP
      bannerState.sparkCounter = 119;
      bannerState.gotRateUpInThisBanner = false;

      // 第120抽应该强制给UP
      const { result } = simulateSinglePull(globalState, bannerState, rng);

      expect(result.triggeredSpark).toBe(true);
      expect(result.rarity).toBe(6);
      expect(result.isRateUp).toBe(true);
    });
  });

  describe('加急招募', () => {
    it('10连必得5星或以上', () => {
      const rng = createRng('test-fast-track');
      let globalState = createInitialGlobalState();

      // 设置初始保底计数
      globalState.pityCounter = 30;
      const initialPity = globalState.pityCounter;

      // 执行加急招募
      const { result, newGlobalState } = simulateFastTrack(globalState, rng);

      const has5StarOrAbove = result.pullResults.some((r) => r.rarity >= 5);
      const pityUnchanged = newGlobalState.pityCounter === initialPity;

      expect(result.pullResults.length).toBe(10);
      expect(has5StarOrAbove).toBe(true);
      expect(pityUnchanged).toBe(true);
    });
  });

  describe('武库配额累计', () => {
    it('根据稀有度正确计算配额', () => {
      const rng = createRng('test-arsenal');
      let globalState = createInitialGlobalState();
      const bannerState = createInitialBannerState();

      // 抽一次
      const { result, newGlobalState } = simulateSinglePull(globalState, bannerState, rng);

      const expectedPoints = result.rarity === 6 ? 2000 : result.rarity === 5 ? 200 : 20;

      expect(result.arsenalPoints).toBe(expectedPoints);
      expect(newGlobalState.arsenalPoints).toBe(expectedPoints);
    });
  });

  describe('概率统计验证', () => {
    it('大样本测试概率分布', () => {
      const rng = createRng('test-probability');
      const globalState = createInitialGlobalState();
      const bannerState = createInitialBannerState();

      const sampleSize = 10000;
      let count6Star = 0;
      let count5Star = 0;
      let count4Star = 0;

      for (let i = 0; i < sampleSize; i++) {
        const { result } = simulateSinglePull(globalState, bannerState, rng);
        if (result.rarity === 6) count6Star++;
        if (result.rarity === 5) count5Star++;
        if (result.rarity === 4) count4Star++;
      }

      const rate6 = count6Star / sampleSize;
      const rate5 = count5Star / sampleSize;
      const rate4 = count4Star / sampleSize;

      // 允许±0.5%的误差
      const tolerance = 0.005;
      expect(Math.abs(rate6 - 0.008)).toBeLessThan(tolerance);
      expect(Math.abs(rate5 - 0.08)).toBeLessThan(tolerance);
      expect(Math.abs(rate4 - 0.912)).toBeLessThan(tolerance);
    });
  });
});
