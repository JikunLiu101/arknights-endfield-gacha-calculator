/**
 * 明日方舟：终末地 抽卡策略系统
 *
 * 实现基础策略和附加策略的配置和执行逻辑
 */

import type { BaseStrategyId, StrategyConfig } from './types';

// ============ 常量配置 ============

/** 卡池赠送抽数 */
export const BANNER_BONUS_PULLS = 10;

/** 武器池单次申领消耗 */
export const WEAPON_CLAIM_COST = 1980;

/** 武器池井机制申领次数 */
export const WEAPON_SPARK_CLAIMS = 8;

// ============ 基础策略配置 ============

/**
 * 基础策略配置
 */
export const BASE_STRATEGIES = {
  S1: {
    id: 'S1' as const,
    name: '保底派',
    characterBannerThreshold: 80,
    weaponBannerThreshold: WEAPON_SPARK_CLAIMS * WEAPON_CLAIM_COST, // 15840
  },
  S2: {
    id: 'S2' as const,
    name: '井派',
    characterBannerThreshold: 120,
    weaponBannerThreshold: WEAPON_SPARK_CLAIMS * WEAPON_CLAIM_COST, // 15840
  },
};

/**
 * 附加策略配置
 */
export const ADDON_STRATEGIES = {
  A1: {
    id: 'A1' as const,
    name: '永远使用情报书和卡池赠送抽数',
    defaultEnabled: true,
  },
  A2: {
    id: 'A2' as const,
    name: '凑加急寻访',
    defaultEnabled: false,
  },
  A3: {
    id: 'A3' as const,
    name: '凑情报书',
    defaultEnabled: false,
  },
};

// ============ 策略配置工具函数 ============

/**
 * 创建默认策略配置
 */
export function createDefaultStrategyConfig(baseStrategyId: BaseStrategyId): StrategyConfig {
  const baseStrategy = BASE_STRATEGIES[baseStrategyId];

  return {
    baseStrategy: baseStrategyId,
    characterBannerThreshold: baseStrategy.characterBannerThreshold,
    weaponBannerThreshold: baseStrategy.weaponBannerThreshold,
    addonStrategies: {
      A1_alwaysUseIntelReport: ADDON_STRATEGIES.A1.defaultEnabled,
      A2_pullForFastTrack: ADDON_STRATEGIES.A2.defaultEnabled,
      A3_pullForIntelReport: ADDON_STRATEGIES.A3.defaultEnabled,
    },
  };
}

/**
 * 获取策略配置的显示名称
 */
export function getStrategyName(config: StrategyConfig): string {
  const baseName = BASE_STRATEGIES[config.baseStrategy].name;
  const addons: string[] = [];

  if (config.addonStrategies.A1_alwaysUseIntelReport) {
    addons.push('A1');
  }
  if (config.addonStrategies.A2_pullForFastTrack) {
    addons.push('A2');
  }
  if (config.addonStrategies.A3_pullForIntelReport) {
    addons.push('A3');
  }

  if (addons.length === 0) {
    return baseName;
  }

  return `${baseName} + [${addons.join(', ')}]`;
}

// ============ 附加策略判断函数 ============

/**
 * 判断是否应该触发附加策略二（凑加急寻访）
 *
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数
 * @param threshold 基础策略阈值（80 or 120）
 * @param hasIntelReport 是否有情报书
 * @returns 是否触发附加策略二
 */
export function shouldTriggerAddonA2(
  currentPulls: number,
  pullsNextVersion: number,
  threshold: number,
  hasIntelReport: boolean
): boolean {
  const B = BANNER_BONUS_PULLS; // 10
  const I = hasIntelReport ? 10 : 0;

  // 条件1：当前库存不满足基础策略（不考虑卡池赠送抽数）
  // 注意：如果currentPulls本身就>threshold，说明基础策略可以进入，不需要附加策略
  if (currentPulls > threshold) {
    return false;
  }

  // 条件2：下个版本后预计盈余足够（考虑卡池赠送抽数）
  const surplus = currentPulls + B + I + pullsNextVersion - threshold;
  const requiredSurplus = hasIntelReport ? 10 : 20;

  return surplus > requiredSurplus;
}

/**
 * 计算附加策略二需要消耗的库存抽数
 *
 * @param hasIntelReport 是否有情报书
 * @returns 需要消耗的库存抽数（10 or 20）
 */
export function getAddonA2PullCost(hasIntelReport: boolean): number {
  // 卡池赠送10 + 情报书10 + 库存10 = 30（触发加急）
  // 卡池赠送10 + 库存20 = 30（触发加急）
  return hasIntelReport ? 10 : 20;
}

/**
 * 判断是否应该触发附加策略三（凑情报书）
 *
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数
 * @param threshold 基础策略阈值（80 or 120）
 * @param hasIntelReport 是否有情报书
 * @returns 是否触发附加策略三
 */
export function shouldTriggerAddonA3(
  currentPulls: number,
  pullsNextVersion: number,
  threshold: number,
  hasIntelReport: boolean
): boolean {
  const B = BANNER_BONUS_PULLS; // 10
  const I = hasIntelReport ? 10 : 0;

  // 条件1：当前库存不满足基础策略（不考虑卡池赠送抽数）
  if (currentPulls > threshold) {
    return false;
  }

  // 条件2：下个版本后预计盈余足够（考虑卡池赠送抽数）
  const surplus = currentPulls + B + I + pullsNextVersion - threshold;
  const requiredSurplus = hasIntelReport ? 40 : 50;

  return surplus > requiredSurplus;
}

/**
 * 计算附加策略三需要消耗的库存抽数
 *
 * @param hasIntelReport 是否有情报书
 * @returns 需要消耗的库存抽数（40 or 50）
 */
export function getAddonA3PullCost(hasIntelReport: boolean): number {
  // 卡池赠送10 + 情报书10 + 库存40 = 60（触发情报书）
  // 卡池赠送10 + 库存50 = 60（触发情报书）
  return hasIntelReport ? 40 : 50;
}

/**
 * 判断是否满足基础策略的进入条件
 *
 * @param currentPulls 当前库存抽数
 * @param threshold 基础策略阈值（80 or 120）
 * @returns 是否满足进入条件
 */
export function canEnterCharacterBanner(
  currentPulls: number,
  threshold: number
): boolean {
  return currentPulls + BANNER_BONUS_PULLS > threshold;
}

/**
 * 判断是否满足武器池进入条件
 *
 * @param arsenalPoints 当前武库配额
 * @param hasCorrespondingCharacter 是否有对应角色
 * @param threshold 武器池进入门槛（默认15840）
 * @returns 是否满足进入条件
 */
export function canEnterWeaponBanner(
  arsenalPoints: number,
  hasCorrespondingCharacter: boolean,
  threshold: number
): boolean {
  return hasCorrespondingCharacter && arsenalPoints >= threshold;
}

// ============ 角色池完整模拟函数 ============

import type { GlobalGachaState, BannerOutcome } from './types';
import type { Rng } from './rng';
import {
  simulateSinglePull,
  simulateFastTrack,
  createInitialBannerState,
} from './gacha-core';

/**
 * 角色池完整模拟函数
 * 整合策略逻辑和核心抽卡机制
 *
 * @param config 策略配置
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数（用于附加策略判断）
 * @param globalState 全局状态
 * @param hasIntelReport 是否有寻访情报书
 * @param rng 随机数生成器
 * @returns 卡池模拟结果
 */
export function pullCharacterBanner(
  config: StrategyConfig,
  currentPulls: number,
  pullsNextVersion: number,
  globalState: GlobalGachaState,
  hasIntelReport: boolean,
  rng: Rng
): BannerOutcome & { newGlobalState: GlobalGachaState; generatedIntelReport: boolean } {
  const threshold = config.characterBannerThreshold;
  let currentGlobalState = { ...globalState };
  let bannerState = createInitialBannerState();
  const pullResults = [];
  let fastTrackResult = null;
  let pullsSpent = 0;
  let arsenalGained = 0;
  let usedIntelReport = false;
  let generatedIntelReport = false;

  // ========== 判断是否进入卡池 ==========

  let shouldEnter = false;
  let pullsToSpend = 0; // 计划消耗的库存抽数

  // 1. 检查基础策略进入条件
  if (canEnterCharacterBanner(currentPulls, threshold)) {
    shouldEnter = true;
    pullsToSpend = currentPulls; // 基础策略：持续抽到UP或抽数耗尽
  }
  // 2. 检查附加策略三（凑情报书）- 优先级高于附加策略二
  else if (
    config.addonStrategies.A3_pullForIntelReport &&
    shouldTriggerAddonA3(currentPulls, pullsNextVersion, threshold, hasIntelReport)
  ) {
    shouldEnter = true;
    pullsToSpend = getAddonA3PullCost(hasIntelReport); // 消耗40或50抽
  }
  // 3. 检查附加策略二（凑加急寻访）
  else if (
    config.addonStrategies.A2_pullForFastTrack &&
    shouldTriggerAddonA2(currentPulls, pullsNextVersion, threshold, hasIntelReport)
  ) {
    shouldEnter = true;
    pullsToSpend = getAddonA2PullCost(hasIntelReport); // 消耗10或20抽
  }

  // 如果不进入卡池，返回空结果
  if (!shouldEnter) {
    return {
      gotRateUp: false,
      pullsSpent: 0,
      pullResults: [],
      fastTrackResult: null,
      arsenalGained: 0,
      finalGlobalState: currentGlobalState,
      finalBannerState: bannerState,
      newGlobalState: currentGlobalState,
      generatedIntelReport: false,
    };
  }

  // ========== 开始抽卡流程 ==========

  // 1. 使用卡池赠送的10抽（不消耗库存）
  for (let i = 0; i < BANNER_BONUS_PULLS; i++) {
    const { result, newGlobalState, newBannerState } = simulateSinglePull(
      currentGlobalState,
      bannerState,
      rng,
      false
    );

    pullResults.push(result);
    currentGlobalState = newGlobalState;
    bannerState = newBannerState;
    bannerState.pullsInBanner++;
    arsenalGained += result.arsenalPoints;

    // 检查是否触发加急招募（30抽）
    if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
      const fastTrack = simulateFastTrack(currentGlobalState, rng);
      fastTrackResult = fastTrack.result;
      currentGlobalState = fastTrack.newGlobalState;
      arsenalGained += fastTrack.result.arsenalGained;
      bannerState.fastTrackUsed = true;
    }

    // 检查是否获得UP，如果是基础策略则立即停止
    if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
      return {
        gotRateUp: true,
        pullsSpent,
        pullResults,
        fastTrackResult,
        arsenalGained,
        finalGlobalState: currentGlobalState,
        finalBannerState: bannerState,
        newGlobalState: currentGlobalState,
        generatedIntelReport,
      };
    }
  }

  // 2. 使用寻访情报书（如果启用A1且有情报书）
  if (
    config.addonStrategies.A1_alwaysUseIntelReport &&
    hasIntelReport &&
    !usedIntelReport
  ) {
    for (let i = 0; i < BANNER_BONUS_PULLS; i++) {
      const { result, newGlobalState, newBannerState } = simulateSinglePull(
        currentGlobalState,
        bannerState,
        rng,
        false
      );

      pullResults.push(result);
      currentGlobalState = newGlobalState;
      bannerState = newBannerState;
      bannerState.pullsInBanner++;
      arsenalGained += result.arsenalPoints;

      // 检查是否触发加急招募（30抽）
      if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
        const fastTrack = simulateFastTrack(currentGlobalState, rng);
        fastTrackResult = fastTrack.result;
        currentGlobalState = fastTrack.newGlobalState;
        arsenalGained += fastTrack.result.arsenalGained;
        bannerState.fastTrackUsed = true;
      }

      // 检查是否获得UP，如果是基础策略则立即停止
      if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
        return {
          gotRateUp: true,
          pullsSpent,
          pullResults,
          fastTrackResult,
          arsenalGained,
          finalGlobalState: currentGlobalState,
          finalBannerState: bannerState,
          newGlobalState: currentGlobalState,
          generatedIntelReport,
        };
      }
    }
    usedIntelReport = true;
  }

  // 3. 持续单抽，直到达到目标抽数或获得UP
  while (pullsSpent < pullsToSpend) {
    const { result, newGlobalState, newBannerState } = simulateSinglePull(
      currentGlobalState,
      bannerState,
      rng,
      false
    );

    pullResults.push(result);
    currentGlobalState = newGlobalState;
    bannerState = newBannerState;
    bannerState.pullsInBanner++;
    pullsSpent++;
    arsenalGained += result.arsenalPoints;

    // 检查是否触发加急招募（30抽）
    if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
      const fastTrack = simulateFastTrack(currentGlobalState, rng);
      fastTrackResult = fastTrack.result;
      currentGlobalState = fastTrack.newGlobalState;
      arsenalGained += fastTrack.result.arsenalGained;
      bannerState.fastTrackUsed = true;
    }

    // 检查是否触发寻访情报书（60抽）
    if (bannerState.pullsInBanner === 60 && !bannerState.intelReportUsed) {
      generatedIntelReport = true;
      bannerState.intelReportUsed = true;
    }

    // 检查是否获得UP，如果是基础策略则立即停止
    if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
      return {
        gotRateUp: true,
        pullsSpent,
        pullResults,
        fastTrackResult,
        arsenalGained,
        finalGlobalState: currentGlobalState,
        finalBannerState: bannerState,
        newGlobalState: currentGlobalState,
        generatedIntelReport,
      };
    }
  }

  // 判断是否获得UP
  const gotRateUp = pullResults.some((r) => r.rarity === 6 && r.isRateUp);

  return {
    gotRateUp,
    pullsSpent,
    pullResults,
    fastTrackResult,
    arsenalGained,
    finalGlobalState: currentGlobalState,
    finalBannerState: bannerState,
    newGlobalState: currentGlobalState,
    generatedIntelReport,
  };
}

// ============ 武器池完整模拟函数 ============

import type { WeaponBannerOutcome } from './types';
import {
  simulateWeaponClaim,
  createInitialWeaponBannerState,
} from './weapon-gacha-core';

/**
 * 武器池完整模拟函数
 * 按照策略执行武器池申领
 *
 * @param config 策略配置
 * @param arsenalPoints 当前武库配额
 * @param hasCorrespondingCharacter 是否有对应角色
 * @param rng 随机数生成器
 * @returns 武器池模拟结果
 */
export function claimWeaponBanner(
  config: StrategyConfig,
  arsenalPoints: number,
  hasCorrespondingCharacter: boolean,
  rng: Rng
): WeaponBannerOutcome {
  const threshold = config.weaponBannerThreshold;
  let currentArsenalPoints = arsenalPoints;
  let weaponBannerState = createInitialWeaponBannerState();
  const claimResults = [];
  let arsenalSpent = 0;

  // 检查是否满足进入条件
  if (!canEnterWeaponBanner(currentArsenalPoints, hasCorrespondingCharacter, threshold)) {
    return {
      gotRateUp: false,
      claimsSpent: 0,
      arsenalSpent: 0,
      claimResults: [],
      finalWeaponBannerState: weaponBannerState,
      finalArsenalPoints: currentArsenalPoints,
    };
  }

  // 持续申领，直到获得UP或达到上限
  const maxClaims = WEAPON_SPARK_CLAIMS; // 8次
  let claimsSpent = 0;

  while (
    claimsSpent < maxClaims &&
    currentArsenalPoints >= WEAPON_CLAIM_COST &&
    !weaponBannerState.gotRateUpInThisBanner
  ) {
    const { result, newWeaponBannerState } = simulateWeaponClaim(
      weaponBannerState,
      rng
    );

    claimResults.push(result);
    weaponBannerState = newWeaponBannerState;
    currentArsenalPoints -= WEAPON_CLAIM_COST;
    arsenalSpent += WEAPON_CLAIM_COST;
    claimsSpent++;

    // 如果获得UP，立即停止
    if (result.gotRateUp) {
      break;
    }
  }

  const gotRateUp = weaponBannerState.gotRateUpInThisBanner;

  return {
    gotRateUp,
    claimsSpent,
    arsenalSpent,
    claimResults,
    finalWeaponBannerState: weaponBannerState,
    finalArsenalPoints: currentArsenalPoints,
  };
}

// ============ 完整策略执行流程 ============

import { createInitialGlobalState } from './gacha-core';

/**
 * 单次完整策略执行结果
 */
export type StrategyExecutionResult = {
  /** 获得的限定角色数量 */
  obtainedCharacterCount: number;
  /** 获得的专武数量 */
  obtainedWeaponCount: number;
  /** 总消耗抽数 */
  totalPullsSpent: number;
  /** 总消耗武库配额 */
  totalArsenalSpent: number;
  /** 剩余抽数 */
  remainingPulls: number;
  /** 剩余武库配额 */
  remainingArsenal: number;
  /** 是否获得所有角色（覆盖率100%） */
  obtainedAllCharacters: boolean;
  /** 是否获得所有专武（覆盖率100%） */
  obtainedAllWeapons: boolean;
};

/**
 * 完整策略执行流程
 * 从初始资源到最后一个卡池的完整模拟
 *
 * @param config 策略配置
 * @param initialPulls 初始抽数
 * @param arsenalPerVersion 每版本武库配额
 * @param pullsPerVersion 每版本抽数
 * @param versionCount 版本数
 * @param bannersPerVersion 每版本卡池数
 * @param rng 随机数生成器
 * @returns 策略执行结果
 */
export function executeStrategy(
  config: StrategyConfig,
  initialPulls: number,
  arsenalPerVersion: number,
  pullsPerVersion: number,
  versionCount: number,
  bannersPerVersion: number,
  rng: Rng
): StrategyExecutionResult {
  // 初始化资源和状态
  let currentPulls = initialPulls;
  let globalState = createInitialGlobalState();
  let hasIntelReport = false;
  let obtainedCharacterCount = 0;
  let obtainedWeaponCount = 0;
  let totalPullsSpent = 0;
  let totalArsenalSpent = 0;

  // 按版本循环
  for (let version = 0; version < versionCount; version++) {
    // 在版本开始时发放资源
    currentPulls += pullsPerVersion;
    globalState.arsenalPoints += arsenalPerVersion;

    // 按卡池顺序处理每个角色池
    for (let banner = 0; banner < bannersPerVersion; banner++) {
      // 计算下个版本的抽数（用于附加策略判断）
      const remainingVersions = versionCount - version - 1;
      const pullsNextVersion = remainingVersions > 0 ? pullsPerVersion : 0;

      // 执行角色池模拟
      const bannerOutcome = pullCharacterBanner(
        config,
        currentPulls,
        pullsNextVersion,
        globalState,
        hasIntelReport,
        rng
      );

      // 更新资源和状态
      currentPulls -= bannerOutcome.pullsSpent;
      globalState = bannerOutcome.newGlobalState;
      totalPullsSpent += bannerOutcome.pullsSpent;
      hasIntelReport = bannerOutcome.generatedIntelReport;

      // 如果获得UP角色，计数+1
      if (bannerOutcome.gotRateUp) {
        obtainedCharacterCount++;
      }

      // 在角色池后检查是否应该申领武器池
      // 1. 如果获得了新的UP角色
      // 2. 或者附加策略A2/A3触发且抽到了6星限定
      const got6StarLimited = bannerOutcome.pullResults.some(
        (r) => r.rarity === 6 && r.isRateUp
      );

      // 判断是否应该尝试申领武器池
      let shouldTryWeaponBanner = false;

      // 条件1: 获得了UP角色（基础策略）
      if (bannerOutcome.gotRateUp) {
        shouldTryWeaponBanner = true;
      }
      // 条件2: 附加策略A2/A3触发且抽到6星限定
      else if (
        (config.addonStrategies.A2_pullForFastTrack ||
          config.addonStrategies.A3_pullForIntelReport) &&
        got6StarLimited
      ) {
        shouldTryWeaponBanner = true;
      }

      // 如果满足条件，尝试申领武器池
      if (shouldTryWeaponBanner) {
        const weaponOutcome = claimWeaponBanner(
          config,
          globalState.arsenalPoints,
          true, // 假设有对应角色
          rng
        );

        // 更新资源和状态
        globalState.arsenalPoints = weaponOutcome.finalArsenalPoints;
        totalArsenalSpent += weaponOutcome.arsenalSpent;

        // 如果获得UP专武，计数+1
        if (weaponOutcome.gotRateUp) {
          obtainedWeaponCount++;
        }
      }
    }
  }

  // 计算总卡池数
  const totalBanners = versionCount * bannersPerVersion;

  // 返回统计结果
  return {
    obtainedCharacterCount,
    obtainedWeaponCount,
    totalPullsSpent,
    totalArsenalSpent,
    remainingPulls: currentPulls,
    remainingArsenal: globalState.arsenalPoints,
    obtainedAllCharacters: obtainedCharacterCount === totalBanners,
    obtainedAllWeapons: obtainedWeaponCount === totalBanners,
  };
}
