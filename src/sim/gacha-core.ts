/**
 * 明日方舟：终末地 核心抽卡引擎
 *
 * 实现卡池的保底、井、加急招募等核心机制
 */

import type {
  GlobalGachaState,
  BannerState,
  PullResult,
  FastTrackResult,
} from './types';
import type { Rng } from './rng';

// ============ 常量定义 ============

/** 6星基础概率 */
const PROB_6_STAR_BASE = 0.008;
/** 5星基础概率 */
const PROB_5_STAR = 0.08;
// Note: 4星基础概率 = 0.912 (not used in implementation)

/** 保底触发阈值（连续65次未出6星后触发） */
const PITY_THRESHOLD = 65;
/** 硬保底阈值（第80次必定6星） */
const HARD_PITY_THRESHOLD = 80;
/** 保底每抽增加的概率 */
const PITY_INCREMENT_PER_PULL = 0.05;

/** 井触发阈值（第120次抽取强制UP） */
const SPARK_THRESHOLD = 120;

/** UP角色占6星概率的比例 */
const RATE_UP_RATIO = 0.5;

// Note: 加急招募触发阈值 = 30 (handled in strategy layer)
/** 加急招募抽数 */
const FAST_TRACK_PULLS = 10;

// Note: 寻访情报书触发阈值 = 60 (handled in strategy layer)

/** 武库配额 */
const ARSENAL_POINTS = {
  6: 2000,
  5: 200,
  4: 20,
} as const;

// ============ 辅助函数 ============

/**
 * 计算当前6星概率（考虑保底）
 * - pityCounter < 65: 0.8%
 * - pityCounter >= 65 && < 80: 0.8% + (counter - 64) * 5%
 * - pityCounter >= 80: 100% (硬保底，但会在 simulateSinglePull 中强制处理)
 */
function getSixStarProb(pityCounter: number): number {
  if (pityCounter < PITY_THRESHOLD) {
    return PROB_6_STAR_BASE; // 0.8%
  } else if (pityCounter < HARD_PITY_THRESHOLD) {
    // 65抽: 0.8% + 1*5% = 5.8%
    // 66抽: 0.8% + 2*5% = 10.8%
    // ...
    // 79抽: 0.8% + 15*5% = 75.8%
    const pullsSincePityStart = pityCounter - PITY_THRESHOLD + 1;
    return PROB_6_STAR_BASE + pullsSincePityStart * PITY_INCREMENT_PER_PULL;
  } else {
    // 80+ 抽: 100%（硬保底）
    return 1.0;
  }
}

/**
 * 根据概率抽取稀有度
 */
function rollRarity(rng: Rng, prob6Star: number): 6 | 5 | 4 {
  const r = rng.nextFloat();
  if (r < prob6Star) return 6;
  if (r < prob6Star + PROB_5_STAR) return 5;
  return 4;
}

/**
 * 判断6星是否为UP角色
 */
function isRateUpSixStar(rng: Rng): boolean {
  return rng.nextFloat() < RATE_UP_RATIO;
}

// ============ 核心函数 ============

/**
 * 单次抽卡模拟（最基础的原子操作）
 *
 * @param globalState 全局状态
 * @param bannerState 卡池状态
 * @param rng 随机数生成器
 * @param isFromFastTrack 是否来自加急招募（不影响计数器）
 * @returns 抽卡结果和更新后的状态
 */
export function simulateSinglePull(
  globalState: GlobalGachaState,
  bannerState: BannerState,
  rng: Rng,
  isFromFastTrack: boolean = false
): {
  result: PullResult;
  newGlobalState: GlobalGachaState;
  newBannerState: BannerState;
} {
  // 复制状态（不可变更新）
  const newGlobalState = { ...globalState };
  const newBannerState = { ...bannerState };

  // 初始化结果
  let rarity: 6 | 5 | 4;
  let isRateUp = false;
  let triggeredPity = false;
  let triggeredSpark = false;

  // 1. 检查是否触发井（第120抽且未获得UP）- 优先级最高
  if (
    !isFromFastTrack &&
    bannerState.sparkCounter === SPARK_THRESHOLD - 1 &&
    !bannerState.gotRateUpInThisBanner
  ) {
    // 强制给UP角色
    rarity = 6;
    isRateUp = true;
    triggeredSpark = true;
    newGlobalState.pityCounter = 0; // 重置保底
    newBannerState.gotRateUpInThisBanner = true;
  }
  // 2. 检查是否触发硬保底（第80抽强制6星）
  else if (
    !isFromFastTrack &&
    globalState.pityCounter >= HARD_PITY_THRESHOLD
  ) {
    // 强制给6星，但不一定是UP
    rarity = 6;
    isRateUp = isRateUpSixStar(rng);
    triggeredPity = true; // 标记为保底触发
    newGlobalState.pityCounter = 0; // 重置保底计数器

    if (isRateUp) {
      newBannerState.gotRateUpInThisBanner = true;
    }
  }
  // 3. 正常抽卡流程
  else {
    const prob6Star = getSixStarProb(globalState.pityCounter);
    triggeredPity = globalState.pityCounter >= PITY_THRESHOLD;

    // 抽取稀有度
    rarity = rollRarity(rng, prob6Star);

    // 如果是6星，判断是否UP
    if (rarity === 6) {
      isRateUp = isRateUpSixStar(rng);
      newGlobalState.pityCounter = 0; // 重置保底计数器

      if (isRateUp) {
        newBannerState.gotRateUpInThisBanner = true;
      }
    } else {
      // 未出6星，保底计数器+1（仅非加急招募）
      if (!isFromFastTrack) {
        newGlobalState.pityCounter++;
      }
    }
  }

  // 4. 更新井计数器（仅非加急招募）
  if (!isFromFastTrack) {
    newBannerState.sparkCounter++;
  }

  // 5. 计算武库配额
  const arsenalPoints = ARSENAL_POINTS[rarity];
  newGlobalState.arsenalPoints += arsenalPoints;

  // 6. 构建结果
  const result: PullResult = {
    rarity,
    isRateUp,
    triggeredPity,
    triggeredSpark,
    arsenalPoints,
  };

  return {
    result,
    newGlobalState,
    newBannerState,
  };
}

/**
 * 加急招募模拟（10连抽，必得至少1个5星+）
 *
 * 注意：加急招募不影响保底和井的计数器
 *
 * @param globalState 全局状态
 * @param rng 随机数生成器
 * @returns 加急招募结果
 */
export function simulateFastTrack(
  globalState: GlobalGachaState,
  rng: Rng
): {
  result: FastTrackResult;
  newGlobalState: GlobalGachaState;
} {
  let currentGlobalState = { ...globalState };
  const pullResults: PullResult[] = [];
  let arsenalGained = 0;
  let has5StarOrAbove = false;

  // 先执行10次抽卡
  for (let i = 0; i < FAST_TRACK_PULLS; i++) {
    // 使用空的 BannerState（因为不影响计数器）
    const dummyBannerState: BannerState = {
      sparkCounter: 0,
      pullsInBanner: 0,
      fastTrackUsed: false,
      intelReportUsed: false,
      gotRateUpInThisBanner: false,
    };

    const { result, newGlobalState } = simulateSinglePull(
      currentGlobalState,
      dummyBannerState,
      rng,
      true // 标记为来自加急招募
    );

    pullResults.push(result);
    arsenalGained += result.arsenalPoints;

    // 只更新武库配额，不更新计数器（因为 isFromFastTrack=true）
    currentGlobalState.arsenalPoints = newGlobalState.arsenalPoints;

    if (result.rarity === 5 || result.rarity === 6) {
      has5StarOrAbove = true;
    }
  }

  // 如果没有5星+，强制将最后一次结果改为5星
  if (!has5StarOrAbove) {
    const lastIndex = pullResults.length - 1;
    const lastResult = pullResults[lastIndex];

    // 扣除之前的配额
    arsenalGained -= lastResult.arsenalPoints;
    currentGlobalState.arsenalPoints -= lastResult.arsenalPoints;

    // 修改为5星
    pullResults[lastIndex] = {
      rarity: 5,
      isRateUp: false,
      triggeredPity: false,
      triggeredSpark: false,
      arsenalPoints: ARSENAL_POINTS[5],
    };

    arsenalGained += ARSENAL_POINTS[5];
    currentGlobalState.arsenalPoints += ARSENAL_POINTS[5];
  }

  return {
    result: {
      pullResults,
      arsenalGained,
    },
    newGlobalState: currentGlobalState,
  };
}

/**
 * 创建初始全局状态
 */
export function createInitialGlobalState(): GlobalGachaState {
  return {
    pityCounter: 0,
    arsenalPoints: 0,
  };
}

/**
 * 创建初始卡池状态
 */
export function createInitialBannerState(): BannerState {
  return {
    sparkCounter: 0,
    pullsInBanner: 0,
    fastTrackUsed: false,
    intelReportUsed: false,
    gotRateUpInThisBanner: false,
  };
}
