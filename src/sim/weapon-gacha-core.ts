/**
 * 明日方舟：终末地 武器池核心引擎
 *
 * 实现武器池的保底、井、申领等核心机制
 */

import type {
  WeaponBannerState,
  WeaponPullResult,
  WeaponClaimResult,
} from './types';
import type { Rng } from './rng';

// ============ 常量定义 ============

/** 6星基础概率 */
const PROB_6_STAR = 0.04;
/** 5星基础概率 */
const PROB_5_STAR = 0.15;

/** UP专武占6星概率的比例 */
const RATE_UP_RATIO = 0.25;

/** 保底触发门槛（连续3次申领未出6星后触发） */
const WEAPON_PITY_THRESHOLD = 3;

/** 井触发门槛（第8次申领强制UP） */
const WEAPON_SPARK_THRESHOLD = 7;

/** 每次申领的抽数 */
const PULLS_PER_CLAIM = 10;

/** 每次申领消耗的武库配额 */
export const ARSENAL_COST_PER_CLAIM = 1980;

// ============ 辅助函数 ============

/**
 * 根据概率抽取武器稀有度
 */
function rollWeaponRarity(rng: Rng): 6 | 5 | 4 {
  const r = rng.nextFloat();
  if (r < PROB_6_STAR) return 6;
  if (r < PROB_6_STAR + PROB_5_STAR) return 5;
  return 4;
}

/**
 * 判断6星武器是否为UP专武
 */
function isRateUpWeapon(rng: Rng): boolean {
  return rng.nextFloat() < RATE_UP_RATIO;
}

// ============ 核心函数 ============

/**
 * 单次武器抽取模拟（最基础的原子操作）
 *
 * @param weaponBannerState 武器池状态
 * @param rng 随机数生成器
 * @param isLastPullOfClaim 是否为本次申领的第10抽
 * @param guaranteeType 触发类型（spark/pity/null）
 * @returns 抽取结果和更新后的状态
 */
export function simulateWeaponSinglePull(
  weaponBannerState: WeaponBannerState,
  rng: Rng,
  isLastPullOfClaim: boolean,
  guaranteeType: 'spark' | 'pity' | null
): {
  result: WeaponPullResult;
  newWeaponBannerState: WeaponBannerState;
} {
  // 复制状态（不可变更新）
  const newWeaponBannerState = { ...weaponBannerState };

  // 初始化结果
  let rarity: 6 | 5 | 4;
  let isRateUp = false;
  let triggeredPity = false;
  let triggeredSpark = false;

  // 1. 判断是否触发井（井优先级高于保底）
  if (isLastPullOfClaim && guaranteeType === 'spark') {
    // 强制给UP专武
    rarity = 6;
    isRateUp = true;
    triggeredSpark = true;
    newWeaponBannerState.weaponPityCounter = 0; // 重置保底
    newWeaponBannerState.gotRateUpInThisBanner = true;
  }
  // 2. 判断是否触发保底
  else if (isLastPullOfClaim && guaranteeType === 'pity') {
    // 强制给6星武器（但按25%概率判断是否UP）
    rarity = 6;
    isRateUp = isRateUpWeapon(rng);
    triggeredPity = true;
    newWeaponBannerState.weaponPityCounter = 0; // 重置保底

    if (isRateUp) {
      newWeaponBannerState.gotRateUpInThisBanner = true;
    }
  }
  // 3. 正常抽取流程
  else {
    rarity = rollWeaponRarity(rng);

    // 如果是6星，判断是否UP
    if (rarity === 6) {
      isRateUp = isRateUpWeapon(rng);
      newWeaponBannerState.weaponPityCounter = 0; // 重置保底计数器

      if (isRateUp) {
        newWeaponBannerState.gotRateUpInThisBanner = true;
      }
    }
  }

  // 构建结果
  const result: WeaponPullResult = {
    rarity,
    isRateUp,
    triggeredPity,
    triggeredSpark,
  };

  return {
    result,
    newWeaponBannerState,
  };
}

/**
 * 一次申领模拟（10连抽，必得至少1个5星+）
 *
 * @param weaponBannerState 武器池状态
 * @param rng 随机数生成器
 * @returns 申领结果和更新后的状态
 */
export function simulateWeaponClaim(
  weaponBannerState: WeaponBannerState,
  rng: Rng
): {
  result: WeaponClaimResult;
  newWeaponBannerState: WeaponBannerState;
} {
  let currentWeaponBannerState = { ...weaponBannerState };
  const pullResults: WeaponPullResult[] = [];

  // 1. 判断本次申领是否触发保底/井
  let guaranteeType: 'spark' | 'pity' | null = null;

  // 井优先级高于保底
  if (
    currentWeaponBannerState.weaponSparkCounter === WEAPON_SPARK_THRESHOLD &&
    !currentWeaponBannerState.gotRateUpInThisBanner
  ) {
    guaranteeType = 'spark';
  } else if (
    currentWeaponBannerState.weaponPityCounter === WEAPON_PITY_THRESHOLD
  ) {
    guaranteeType = 'pity';
  }

  // 2. 执行前9次抽取（如果触发保底/井，前9抽都是正常抽取）
  for (let i = 0; i < PULLS_PER_CLAIM - 1; i++) {
    const { result, newWeaponBannerState } = simulateWeaponSinglePull(
      currentWeaponBannerState,
      rng,
      false,
      null
    );

    pullResults.push(result);
    currentWeaponBannerState = newWeaponBannerState;
  }

  // 3. 第10抽：根据保底/井检查前9抽，决定是否强制给出
  const got6StarInFirst9 = pullResults.some((r) => r.rarity === 6);
  const gotRateUpInFirst9 = pullResults.some((r) => r.rarity === 6 && r.isRateUp);

  if (guaranteeType === 'spark' && !gotRateUpInFirst9) {
    // 井触发且前9抽未得UP：第10抽强制给UP
    pullResults.push({
      rarity: 6,
      isRateUp: true,
      triggeredPity: false,
      triggeredSpark: true,
    });
    currentWeaponBannerState.weaponPityCounter = 0;
    currentWeaponBannerState.gotRateUpInThisBanner = true;
  } else if (guaranteeType === 'pity' && !got6StarInFirst9) {
    // 保底触发且前9抽未得6星：第10抽强制给6星（按25%概率判断是否UP）
    const isUp = isRateUpWeapon(rng);
    pullResults.push({
      rarity: 6,
      isRateUp: isUp,
      triggeredPity: true,
      triggeredSpark: false,
    });
    currentWeaponBannerState.weaponPityCounter = 0;
    if (isUp) {
      currentWeaponBannerState.gotRateUpInThisBanner = true;
    }
  } else {
    // 无需触发保底/井，或前9抽已满足条件：正常抽取第10抽
    const { result, newWeaponBannerState } = simulateWeaponSinglePull(
      currentWeaponBannerState,
      rng,
      true,
      null
    );
    pullResults.push(result);
    currentWeaponBannerState = newWeaponBannerState;
  }

  // 4. 保证至少1个5星+（在保底/井处理后检查）
  let has5StarOrAbove = pullResults.some((r) => r.rarity === 5 || r.rarity === 6);

  if (!has5StarOrAbove) {
    // 如果第10抽没有被保底/井占用，则强制修正为5星
    if (!pullResults[9].triggeredPity && !pullResults[9].triggeredSpark) {
      pullResults[9] = {
        rarity: 5,
        isRateUp: false,
        triggeredPity: false,
        triggeredSpark: false,
      };
    }
    has5StarOrAbove = true;
  }

  // 5. 更新计数器
  const gotSixStar = pullResults.some((r) => r.rarity === 6);
  const gotRateUp = pullResults.some((r) => r.rarity === 6 && r.isRateUp);
  const triggeredPity = pullResults.some((r) => r.triggeredPity);
  const triggeredSpark = pullResults.some((r) => r.triggeredSpark);

  // 如果没有获得6星，保底计数器+1
  if (!gotSixStar) {
    currentWeaponBannerState.weaponPityCounter++;
  }

  // 如果没有获得UP，井计数器+1
  if (!gotRateUp) {
    currentWeaponBannerState.weaponSparkCounter++;
  } else {
    // 获得UP，重置井计数器
    currentWeaponBannerState.weaponSparkCounter = 0;
  }

  // 申领次数+1
  currentWeaponBannerState.claimsInBanner++;

  // 6. 构建结果
  const result: WeaponClaimResult = {
    pullResults,
    gotSixStar,
    gotRateUp,
    triggeredPity,
    triggeredSpark,
  };

  return {
    result,
    newWeaponBannerState: currentWeaponBannerState,
  };
}

/**
 * 创建初始武器池状态
 */
export function createInitialWeaponBannerState(): WeaponBannerState {
  return {
    weaponPityCounter: 0,
    weaponSparkCounter: 0,
    gotRateUpInThisBanner: false,
    claimsInBanner: 0,
  };
}
