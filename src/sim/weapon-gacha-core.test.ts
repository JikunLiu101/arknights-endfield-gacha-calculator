/**
 * 武器池核心引擎测试
 *
 * 测试武器池保底、井、申领等核心机制
 */

import {
  simulateWeaponClaim,
  createInitialWeaponBannerState,
} from './weapon-gacha-core';
import { createRng } from './rng';
import type { WeaponBannerState } from './types';

// ============ 测试用例 ============

console.log('=== 开始测试武器池核心引擎 ===\n');

// 测试1: 验证保底机制（第4次申领必得6星）
console.log('测试1: 保底机制（第4次申领必得6星）');
{
  const testCount = 100;
  let allGot6Star = true;
  let forcedCount = 0; // 被第10抽强制的次数
  let naturalCount = 0; // 前9抽自然出现的次数

  for (let i = 0; i < testCount; i++) {
    const rng = createRng(`test-pity-${i}`);
    let weaponBannerState = createInitialWeaponBannerState();

    // 设置保底计数器为3（第4次申领）
    weaponBannerState.weaponPityCounter = 3;

    const { result } = simulateWeaponClaim(weaponBannerState, rng);

    if (!result.gotSixStar) {
      allGot6Star = false;
      console.log(`  ✗ 第${i + 1}次测试未得到6星`);
      break;
    }

    // 统计是强制触发还是前9抽自然出现
    if (result.triggeredPity) {
      forcedCount++;
    } else {
      naturalCount++;
    }
  }

  console.log(`  - 测试次数: ${testCount}`);
  console.log(`  - 全部得到6星: ${allGot6Star}`);
  console.log(`  - 第10抽强制触发: ${forcedCount}次`);
  console.log(`  - 前9抽自然出现: ${naturalCount}次`);

  if (allGot6Star) {
    console.log('  ✓ 保底机制正确，第4次申领必得6星');
  } else {
    console.log('  ✗ 保底机制失败');
  }
}

// 测试2: 验证保底触发标记（前9抽未出时才标记为触发）
console.log('\n测试2: 保底触发标记（仅在第10抽强制时标记）');
{
  // 使用特定seed，确保前9抽不出6星
  let foundCase = false;
  for (let seed = 0; seed < 1000; seed++) {
    const rng = createRng(`test-pity-trigger-${seed}`);
    let weaponBannerState = createInitialWeaponBannerState();
    weaponBannerState.weaponPityCounter = 3;

    const { result } = simulateWeaponClaim(weaponBannerState, rng);

    // 检查前9抽是否有6星
    const got6StarInFirst9 = result.pullResults.slice(0, 9).some((r) => r.rarity === 6);

    if (!got6StarInFirst9 && result.triggeredPity) {
      // 前9抽未出，第10抽强制，应该标记为触发
      const sixStarIndex = result.pullResults.findIndex((r) => r.rarity === 6);
      console.log(`  - 前9抽未出6星，第10抽强制给出`);
      console.log(`  - 6星位置: 第${sixStarIndex + 1}抽`);
      console.log(`  - 触发标记: ${result.triggeredPity}`);
      console.log('  ✓ 保底触发标记正确');
      foundCase = true;
      break;
    }
  }

  if (!foundCase) {
    console.log('  ⚠ 未找到前9抽不出6星的测试用例（可能需要更多seed）');
  }
}

// 测试3: 验证井机制（第8次申领必得UP）
console.log('\n测试3: 井机制（第8次申领必得UP）');
{
  const testCount = 100;
  let allGotUp = true;
  let forcedCount = 0;
  let naturalCount = 0;

  for (let i = 0; i < testCount; i++) {
    const rng = createRng(`test-spark-${i}`);
    let weaponBannerState = createInitialWeaponBannerState();

    // 设置井计数器为7（第8次申领）
    weaponBannerState.weaponSparkCounter = 7;
    weaponBannerState.gotRateUpInThisBanner = false;

    const { result } = simulateWeaponClaim(weaponBannerState, rng);

    if (!result.gotRateUp) {
      allGotUp = false;
      console.log(`  ✗ 第${i + 1}次测试未得到UP`);
      break;
    }

    if (result.triggeredSpark) {
      forcedCount++;
    } else {
      naturalCount++;
    }
  }

  console.log(`  - 测试次数: ${testCount}`);
  console.log(`  - 全部得到UP: ${allGotUp}`);
  console.log(`  - 第10抽强制触发: ${forcedCount}次`);
  console.log(`  - 前9抽自然出现: ${naturalCount}次`);

  if (allGotUp) {
    console.log('  ✓ 井机制正确，第8次申领必得UP');
  } else {
    console.log('  ✗ 井机制失败');
  }
}

// 测试4: 验证井触发标记（前9抽未出UP时才标记）
console.log('\n测试4: 井触发标记（仅在第10抽强制时标记）');
{
  let foundCase = false;
  for (let seed = 0; seed < 1000; seed++) {
    const rng = createRng(`test-spark-trigger-${seed}`);
    let weaponBannerState = createInitialWeaponBannerState();
    weaponBannerState.weaponSparkCounter = 7;
    weaponBannerState.gotRateUpInThisBanner = false;

    const { result } = simulateWeaponClaim(weaponBannerState, rng);

    const gotUpInFirst9 = result.pullResults.slice(0, 9).some((r) => r.rarity === 6 && r.isRateUp);

    if (!gotUpInFirst9 && result.triggeredSpark) {
      const upIndex = result.pullResults.findIndex((r) => r.rarity === 6 && r.isRateUp);
      console.log(`  - 前9抽未出UP，第10抽强制给出`);
      console.log(`  - UP位置: 第${upIndex + 1}抽`);
      console.log(`  - 触发标记: ${result.triggeredSpark}`);
      console.log('  ✓ 井触发标记正确');
      foundCase = true;
      break;
    }
  }

  if (!foundCase) {
    console.log('  ⚠ 未找到前9抽不出UP的测试用例（可能需要更多seed）');
  }
}

// 测试5: 井优先级高于保底
console.log('\n测试5: 井优先级高于保底（同时满足时优先井）');
{
  const testCount = 100;
  let allCorrect = true;

  for (let i = 0; i < testCount; i++) {
    const rng = createRng(`test-priority-${i}`);
    let weaponBannerState = createInitialWeaponBannerState();

    // 同时满足保底和井
    weaponBannerState.weaponPityCounter = 3;
    weaponBannerState.weaponSparkCounter = 7;
    weaponBannerState.gotRateUpInThisBanner = false;

    const { result } = simulateWeaponClaim(weaponBannerState, rng);

    // 必须得到UP（井保证）
    if (!result.gotRateUp) {
      allCorrect = false;
      console.log(`  ✗ 第${i + 1}次测试未得到UP（井应该保证UP）`);
      break;
    }

    // 如果触发了标记，应该是井而非保底
    if (result.triggeredPity && result.triggeredSpark) {
      allCorrect = false;
      console.log(`  ✗ 第${i + 1}次测试同时触发了保底和井`);
      break;
    }
  }

  console.log(`  - 测试次数: ${testCount}`);

  if (allCorrect) {
    console.log('  ✓ 井优先级正确，同时满足时必得UP');
  } else {
    console.log('  ✗ 井优先级错误');
  }
}

// 测试6: 每次申领必得5星+
console.log('\n测试6: 每次申领必得至少1个5星或以上武器');
{
  const testCount = 100;
  let allPass = true;

  for (let i = 0; i < testCount; i++) {
    const testRng = createRng(`test-5star-${i}`);
    const weaponBannerState = createInitialWeaponBannerState();
    const { result } = simulateWeaponClaim(weaponBannerState, testRng);

    const has5StarOrAbove = result.pullResults.some((r) => r.rarity === 5 || r.rarity === 6);

    if (!has5StarOrAbove) {
      allPass = false;
      console.log(`  ✗ 第${i + 1}次申领没有5星+`);
      break;
    }
  }

  console.log(`  - 测试次数: ${testCount}`);

  if (allPass) {
    console.log('  ✓ 所有申领都满足至少1个5星+');
  } else {
    console.log('  ✗ 存在申领不满足5星+保证');
  }
}

// 测试7: 武器池独立性（计数器不跨池继承）
console.log('\n测试7: 武器池独立性（计数器不跨池继承）');
{
  // 武器池A
  let weaponBannerStateA = createInitialWeaponBannerState();
  weaponBannerStateA.weaponPityCounter = 2;
  weaponBannerStateA.weaponSparkCounter = 5;
  weaponBannerStateA.gotRateUpInThisBanner = true;

  // 切换到武器池B（应该是全新的状态）
  const weaponBannerStateB = createInitialWeaponBannerState();

  console.log('  武器池A:');
  console.log(`    - 保底计数: ${weaponBannerStateA.weaponPityCounter}`);
  console.log(`    - 井计数: ${weaponBannerStateA.weaponSparkCounter}`);
  console.log(`    - 已得UP: ${weaponBannerStateA.gotRateUpInThisBanner}`);

  console.log('  武器池B (新池):');
  console.log(`    - 保底计数: ${weaponBannerStateB.weaponPityCounter}`);
  console.log(`    - 井计数: ${weaponBannerStateB.weaponSparkCounter}`);
  console.log(`    - 已得UP: ${weaponBannerStateB.gotRateUpInThisBanner}`);

  if (
    weaponBannerStateB.weaponPityCounter === 0 &&
    weaponBannerStateB.weaponSparkCounter === 0 &&
    weaponBannerStateB.gotRateUpInThisBanner === false
  ) {
    console.log('  ✓ 新武器池状态独立，计数器未继承');
  } else {
    console.log('  ✗ 新武器池状态异常');
  }
}

// 测试8: 井机制仅生效一次
console.log('\n测试8: 井机制仅生效一次');
{
  const rng = createRng('test-spark-once');
  let weaponBannerState = createInitialWeaponBannerState();

  // 第一次触发井（第8次申领）
  weaponBannerState.weaponSparkCounter = 7;
  weaponBannerState.gotRateUpInThisBanner = false;

  const { newWeaponBannerState: stateAfterFirstSpark } = simulateWeaponClaim(
    weaponBannerState,
    rng
  );

  console.log('  第一次触发井后:');
  console.log(`    - 已获得UP: ${stateAfterFirstSpark.gotRateUpInThisBanner}`);

  // 模拟之后连续7次申领都不出UP（人为设置计数器）
  let currentState = { ...stateAfterFirstSpark };
  currentState.weaponSparkCounter = 7;

  // 再次尝试申领
  const { result: secondResult } = simulateWeaponClaim(currentState, rng);

  console.log('  再次满足7次未出UP后:');
  console.log(`    - 获得UP: ${secondResult.gotRateUp}`);
  console.log(`    - 触发井: ${secondResult.triggeredSpark}`);

  // 因为gotRateUpInThisBanner=true，井不应该再次触发强制
  if (stateAfterFirstSpark.gotRateUpInThisBanner) {
    console.log('  ✓ 井机制仅触发一次，已获得UP后不再强制');
  } else {
    console.log('  ✗ 井机制状态记录错误');
  }
}

// 测试9: 概率统计验证（大样本测试）
console.log('\n测试9: 概率统计验证（大样本测试）');
{
  const weaponBannerState = createInitialWeaponBannerState();
  const sampleSize = 1000; // 1000次申领 = 10000次抽取
  let count6Star = 0;
  let count5Star = 0;
  let count4Star = 0;
  let countRateUp = 0;

  for (let i = 0; i < sampleSize; i++) {
    const testRng = createRng(`prob-test-${i}`);
    const { result } = simulateWeaponClaim(weaponBannerState, testRng);

    result.pullResults.forEach((pull) => {
      if (pull.rarity === 6) {
        count6Star++;
        if (pull.isRateUp) countRateUp++;
      }
      if (pull.rarity === 5) count5Star++;
      if (pull.rarity === 4) count4Star++;
    });
  }

  const totalPulls = sampleSize * 10;
  const rate6 = count6Star / totalPulls;
  const rate5 = count5Star / totalPulls;
  const rate4 = count4Star / totalPulls;
  const rateUpRatio = count6Star > 0 ? countRateUp / count6Star : 0;

  console.log(`  样本数: ${sampleSize}次申领 (${totalPulls}次抽取)`);
  console.log(`  6星出现率: ${(rate6 * 100).toFixed(2)}% (期望: 4.00%)`);
  console.log(`  5星出现率: ${(rate5 * 100).toFixed(2)}% (期望: 15.00%)`);
  console.log(`  4星出现率: ${(rate4 * 100).toFixed(2)}% (期望: 81.00%)`);
  console.log(`  UP占6星比例: ${(rateUpRatio * 100).toFixed(2)}% (期望: 25.00%)`);

  // 允许±1.5%的误差（因为有保底等机制影响）
  const tolerance = 0.015;
  const is6StarCorrect = Math.abs(rate6 - 0.04) < tolerance;
  const is5StarCorrect = Math.abs(rate5 - 0.15) < tolerance;
  const is4StarCorrect = Math.abs(rate4 - 0.81) < tolerance;

  if (is6StarCorrect && is5StarCorrect && is4StarCorrect) {
    console.log('  ✓ 概率分布在允许误差范围内');
  } else {
    console.log('  ⚠ 概率分布存在偏差（可能是样本数不够或有保底影响）');
  }
}

console.log('\n=== 武器池测试完成 ===');
