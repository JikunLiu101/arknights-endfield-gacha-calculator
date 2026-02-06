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

console.log('=== 开始测试核心抽卡引擎 ===\n');

// 测试1: 验证保底机制（65抽触发）
console.log('测试1: 保底机制（65抽后触发）');
{
  const rng = createRng('test-pity');
  let globalState = createInitialGlobalState();
  const bannerState = createInitialBannerState();

  // 手动设置保底计数器为65（已经触发保底）
  globalState.pityCounter = 65;

  // 下一次抽卡应该有5.8%的概率出6星
  const { result, newGlobalState } = simulateSinglePull(globalState, bannerState, rng);

  console.log(`  - 保底计数器: ${globalState.pityCounter} -> ${newGlobalState.pityCounter}`);
  console.log(`  - 是否触发保底概率提升: ${result.triggeredPity}`);
  console.log(`  - 抽到的稀有度: ${result.rarity}星`);

  if (result.triggeredPity) {
    console.log('  ✓ 保底触发标记正确');
  } else {
    console.log('  ✗ 保底触发标记错误（保底计数器>=65时应该触发）');
  }
}

console.log('\n测试2: 保底重置（获得6星后重置）');
{
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

  console.log(`  - 初始保底计数: 70`);
  console.log(`  - 是否抽到6星: ${got6Star}`);
  console.log(`  - 最终保底计数: ${finalGlobalState.pityCounter}`);

  if (got6Star && finalGlobalState.pityCounter === 0) {
    console.log('  ✓ 保底重置正确');
  } else {
    console.log('  ✗ 保底重置失败');
  }
}

console.log('\n测试3: 井机制（第120抽强制UP）');
{
  const rng = createRng('test-spark');
  let globalState = createInitialGlobalState();
  let bannerState = createInitialBannerState();

  // 模拟前119抽都没出UP
  bannerState.sparkCounter = 119;
  bannerState.gotRateUpInThisBanner = false;

  // 第120抽应该强制给UP
  const { result, newBannerState } = simulateSinglePull(globalState, bannerState, rng);

  console.log(`  - 井计数器: ${bannerState.sparkCounter} -> ${newBannerState.sparkCounter}`);
  console.log(`  - 是否触发井: ${result.triggeredSpark}`);
  console.log(`  - 稀有度: ${result.rarity}星`);
  console.log(`  - 是否UP: ${result.isRateUp}`);

  if (result.triggeredSpark && result.rarity === 6 && result.isRateUp) {
    console.log('  ✓ 井机制触发正确，强制给出UP角色');
  } else {
    console.log('  ✗ 井机制触发失败');
  }
}

console.log('\n测试3.5: 硬保底机制（第80抽强制6星）');
{
  const rng = createRng('test-hard-pity');

  // 测试80抽硬保底
  let globalState = createInitialGlobalState();
  let bannerState = createInitialBannerState();

  // 设置保底计数器为80（硬保底触发点）
  globalState.pityCounter = 80;

  // 第80抽应该100%给6星
  const { result, newGlobalState } = simulateSinglePull(globalState, bannerState, rng);

  console.log(`  - 保底计数器: ${globalState.pityCounter}`);
  console.log(`  - 稀有度: ${result.rarity}星`);
  console.log(`  - 是否触发保底: ${result.triggeredPity}`);

  if (result.rarity === 6 && result.triggeredPity) {
    console.log('  ✓ 80抽硬保底触发正确，强制给出6星');
  } else {
    console.log('  ✗ 80抽硬保底触发失败（应该100%给6星）');
  }

  // 测试多次验证100%概率
  console.log('\n  验证100%触发率（100次测试）:');
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

  console.log(`  - 100次测试中获得6星次数: ${successCount}/100`);
  if (successCount === 100) {
    console.log('  ✓ 硬保底100%触发验证通过');
  } else {
    console.log('  ✗ 硬保底触发率不是100%');
  }
}

console.log('\n测试4: 加急招募（10连必得5星+，不影响计数器）');
{
  const rng = createRng('test-fast-track');
  let globalState = createInitialGlobalState();

  // 设置初始保底计数
  globalState.pityCounter = 30;
  const initialPity = globalState.pityCounter;

  // 执行加急招募
  const { result, newGlobalState } = simulateFastTrack(globalState, rng);

  const has5StarOrAbove = result.pullResults.some((r) => r.rarity >= 5);
  const pityUnchanged = newGlobalState.pityCounter === initialPity;

  console.log(`  - 加急招募抽数: ${result.pullResults.length}`);
  console.log(`  - 是否至少有1个5星+: ${has5StarOrAbove}`);
  console.log(`  - 保底计数器 (前): ${initialPity}`);
  console.log(`  - 保底计数器 (后): ${newGlobalState.pityCounter}`);
  console.log(`  - 获得武库配额: ${result.arsenalGained}`);

  if (result.pullResults.length === 10) {
    console.log('  ✓ 加急招募抽数正确（10连）');
  } else {
    console.log('  ✗ 加急招募抽数错误');
  }

  if (has5StarOrAbove) {
    console.log('  ✓ 必得5星+规则正确');
  } else {
    console.log('  ✗ 必得5星+规则失败');
  }

  if (pityUnchanged) {
    console.log('  ✓ 保底计数器未受影响');
  } else {
    console.log('  ✗ 保底计数器被改变了');
  }
}

console.log('\n测试5: 武库配额累计');
{
  const rng = createRng('test-arsenal');
  let globalState = createInitialGlobalState();
  const bannerState = createInitialBannerState();

  console.log(`  - 初始配额: ${globalState.arsenalPoints}`);

  // 抽一次
  const { result, newGlobalState } = simulateSinglePull(globalState, bannerState, rng);

  console.log(`  - 抽到: ${result.rarity}星`);
  console.log(`  - 本次获得: ${result.arsenalPoints}点`);
  console.log(`  - 累计配额: ${newGlobalState.arsenalPoints}`);

  const expectedPoints = result.rarity === 6 ? 2000 : result.rarity === 5 ? 200 : 20;

  if (result.arsenalPoints === expectedPoints) {
    console.log('  ✓ 武库配额计算正确');
  } else {
    console.log('  ✗ 武库配额计算错误');
  }
}

console.log('\n测试6: 概率统计验证（大样本测试）');
{
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

  console.log(`  样本数: ${sampleSize}`);
  console.log(`  6星出现率: ${(rate6 * 100).toFixed(2)}% (期望: 0.80%)`);
  console.log(`  5星出现率: ${(rate5 * 100).toFixed(2)}% (期望: 8.00%)`);
  console.log(`  4星出现率: ${(rate4 * 100).toFixed(2)}% (期望: 91.20%)`);

  // 允许±0.5%的误差
  const tolerance = 0.005;
  const is6StarCorrect = Math.abs(rate6 - 0.008) < tolerance;
  const is5StarCorrect = Math.abs(rate5 - 0.08) < tolerance;
  const is4StarCorrect = Math.abs(rate4 - 0.912) < tolerance;

  if (is6StarCorrect && is5StarCorrect && is4StarCorrect) {
    console.log('  ✓ 概率分布在允许误差范围内');
  } else {
    console.log('  ⚠ 概率分布存在偏差（可能是样本数不够或RNG问题）');
  }
}

console.log('\n=== 测试完成 ===');
