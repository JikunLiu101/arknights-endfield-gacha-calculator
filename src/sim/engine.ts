import type { SimInput, SimOutput, TopUpSimOutput } from './types';
import { createRng } from './rng';
import {
  createDefaultStrategyConfig,
  executeStrategy,
  type StrategyExecutionResult,
  BANNER_BONUS_PULLS,
} from './strategies';
import {
  createInitialBannerState,
  createInitialGlobalState,
  simulateSinglePull,
} from './gacha-core';
import {
  ARSENAL_COST_PER_CLAIM,
  createInitialWeaponBannerState,
  simulateWeaponClaim,
} from './weapon-gacha-core';

/**
 * 运行完整的蒙特卡洛模拟
 *
 * @param input 模拟输入参数
 * @param onProgress 进度回调函数
 * @returns 模拟输出结果
 */
export function runSimulation(
  input: SimInput,
  onProgress?: (done: number, total: number) => void
): SimOutput {
  const rng = createRng(input.seed);

  // 验证和标准化输入
  const totalTrials = Math.max(1, Math.floor(input.trials));
  const currentPulls = Math.max(0, Math.floor(input.currentPulls));
  const currentArsenal = Math.max(0, Math.floor(input.currentArsenal));
  const pullsPerVersion = Math.max(0, Math.floor(input.pullsPerVersion));
  const arsenalPerVersion = Math.max(0, Math.floor(input.arsenalPerVersion));
  const versionCount = Math.max(1, Math.floor(input.versionCount));
  const bannersPerVersion = Math.max(1, Math.floor(input.bannersPerVersion));

  // 创建策略配置
  const strategyConfig =
    input.strategyConfig || createDefaultStrategyConfig(input.strategyId);

  // 存储所有trial的结果
  const results: StrategyExecutionResult[] = [];

  // 执行多次模拟
  for (let i = 0; i < totalTrials; i++) {
    const result = executeStrategy(
      strategyConfig,
      currentPulls,
      currentArsenal,
      arsenalPerVersion,
      pullsPerVersion,
      versionCount,
      bannersPerVersion,
      rng
    );

    results.push(result);

    // 定期报告进度
    if (onProgress && (i + 1) % 500 === 0) {
      onProgress(i + 1, totalTrials);
    }
  }

  // 最后一次报告进度
  if (onProgress) {
    onProgress(totalTrials, totalTrials);
  }

  // 统计分析
  const characterCounts = results.map((r) => r.obtainedCharacterCount);
  const weaponCounts = results.map((r) => r.obtainedWeaponCount);
  const pullsSpent = results.map((r) => r.totalPullsSpent);
  const arsenalSpent = results.map((r) => r.totalArsenalSpent);
  const arsenalRemaining = results.map((r) => r.remainingArsenal);

  // 计算总卡池数
  const totalBanners = versionCount * bannersPerVersion;

  // 计算角色覆盖率（获得所有角色的概率）
  const characterFullCoverageRate =
    results.filter((r) => r.obtainedAllCharacters).length / totalTrials;

  // 计算专武覆盖率（获得所有专武的概率）
  const weaponFullCoverageRate =
    results.filter((r) => r.obtainedAllWeapons).length / totalTrials;

  // 计算角色获取期望（平均获得角色数）
  const avgCharacterCount =
    characterCounts.reduce((sum, v) => sum + v, 0) / totalTrials;

  // 计算专武获取期望（平均获得专武数）
  const avgWeaponCount =
    weaponCounts.reduce((sum, v) => sum + v, 0) / totalTrials;

  // 计算平均消耗抽数
  const avgSpent = pullsSpent.reduce((sum, v) => sum + v, 0) / totalTrials;

  // 计算平均消耗武库配额和申领次数
  const avgArsenalSpent = arsenalSpent.reduce((sum, v) => sum + v, 0) / totalTrials;
  const avgArsenalClaims = avgArsenalSpent / 1980;

  // 计算平均剩余武库配额
  const avgArsenalRemaining = arsenalRemaining.reduce((sum, v) => sum + v, 0) / totalTrials;

  // 计算总资源（初始 + 规划期间获取）
  const totalPulls = currentPulls + pullsPerVersion * versionCount;
  // 武库配额总计应该是：平均花费 + 平均剩余
  const avgArsenalGained = avgArsenalSpent + avgArsenalRemaining;

  // 计算分位数（以消耗抽数为基准）
  const sortedPulls = [...pullsSpent].sort((a, b) => a - b);
  const getQuantile = (p: number) =>
    sortedPulls[Math.min(sortedPulls.length - 1, Math.floor(p * (sortedPulls.length - 1)))];

  const p50Spent = getQuantile(0.5);
  const p90Spent = getQuantile(0.9);
  const p99Spent = getQuantile(0.99);

  // 计算角色获取中位数
  const sortedCharacterCounts = [...characterCounts].sort((a, b) => a - b);
  const medianCharactersObtained = sortedCharacterCounts[
    Math.floor(sortedCharacterCounts.length / 2)
  ];

  // 计算专武获取中位数
  const sortedWeaponCounts = [...weaponCounts].sort((a, b) => a - b);
  const medianWeaponsObtained = sortedWeaponCounts[
    Math.floor(sortedWeaponCounts.length / 2)
  ];

  // 计算角色获取分布
  const characterCountMap = new Map<number, number>();
  characterCounts.forEach((count) => {
    characterCountMap.set(count, (characterCountMap.get(count) || 0) + 1);
  });
  const characterDistribution = Array.from(characterCountMap.entries())
    .map(([count, freq]) => ({
      count,
      percentage: (freq / totalTrials) * 100,
    }))
    .sort((a, b) => a.count - b.count);

  // 计算专武获取分布
  const weaponCountMap = new Map<number, number>();
  weaponCounts.forEach((count) => {
    weaponCountMap.set(count, (weaponCountMap.get(count) || 0) + 1);
  });
  const weaponDistribution = Array.from(weaponCountMap.entries())
    .map(([count, freq]) => ({
      count,
      percentage: (freq / totalTrials) * 100,
    }))
    .sort((a, b) => a.count - b.count);

  // 计算角色累加总结
  let charCumulative = 0;
  let charThresholdCount = 0;
  for (const { count, percentage } of characterDistribution) {
    charCumulative += percentage;
    charThresholdCount = count;
    if (charCumulative >= 75) break;
  }
  const characterMedianSummary = `玩家获取限定角色的中位数为${medianCharactersObtained}个`;
  const characterCumulativeSummary = `超过${charCumulative.toFixed(1)}%的玩家可以获得${charThresholdCount}个限定角色`;

  // 计算专武累加总结
  let weaponCumulative = 0;
  let weaponThresholdCount = 0;
  for (const { count, percentage } of weaponDistribution) {
    weaponCumulative += percentage;
    weaponThresholdCount = count;
    if (weaponCumulative >= 75) break;
  }
  const weaponMedianSummary = `玩家获取专武的中位数为${medianWeaponsObtained}个`
  const weaponCumulativeSummary = `超过${weaponCumulative.toFixed(1)}%的玩家可以获得${weaponThresholdCount}个专武`;

  // 对于成功率，我们定义为"获得至少1个角色"的概率
  const successRate = results.filter((r) => r.obtainedCharacterCount > 0).length / totalTrials;

  return {
    // 资源统计
    totalPulls,
    avgArsenalGained: avgArsenalGained,
    avgPullsSpent: avgSpent,
    avgArsenalSpent,
    avgArsenalClaims,

    // 角色统计
    totalCharacters: totalBanners,
    avgCharactersObtained: avgCharacterCount,
    medianCharactersObtained,
    characterDistribution,
    characterMedianSummary,
    characterCumulativeSummary,

    // 专武统计
    totalWeapons: totalBanners,
    avgWeaponsObtained: avgWeaponCount,
    medianWeaponsObtained,
    weaponDistribution,
    weaponMedianSummary,
    weaponCumulativeSummary,

    // 旧字段（保持向后兼容）
    successRate,
    avgSpent,
    p50Spent,
    p90Spent,
    p99Spent,

    debug: {
      note: `真实模拟结果 | 策略: ${strategyConfig.baseStrategy} | 角色期望: ${avgCharacterCount.toFixed(2)}/${totalBanners} | 专武期望: ${avgWeaponCount.toFixed(2)}/${totalBanners} | 角色覆盖率: ${(characterFullCoverageRate * 100).toFixed(1)}% | 专武覆盖率: ${(weaponFullCoverageRate * 100).toFixed(1)}%`,
      inputEcho: input,
    },
  };
}

/**
 * 第二分页：全图鉴 0+1 充值估算模拟
 * - 每个角色池：抽到UP才收手
 * - 每个武器池：抽到UP专武才收手
 * - 不使用加急寻访/寻访情报书（因为它们属于“可能获得”）
 * - 充值按“用到时补齐”计算：每次需要消耗但余额不足，就立即注入刚好够用的数量
 */
export function runTopUpSimulation(
  input: SimInput,
  onProgress?: (done: number, total: number) => void
): TopUpSimOutput {
  const rng = createRng(input.seed);

  const totalTrials = Math.max(1, Math.floor(input.trials));
  const initialPulls = Math.max(0, Math.floor(input.currentPulls));
  const initialArsenal = Math.max(0, Math.floor(input.currentArsenal));
  const pullsPerVersion = Math.max(0, Math.floor(input.pullsPerVersion));
  const arsenalPerVersion = Math.max(0, Math.floor(input.arsenalPerVersion));
  const versionCount = Math.max(1, Math.floor(input.versionCount));
  const bannersPerVersion = Math.max(1, Math.floor(input.bannersPerVersion));

  const totalBanners = versionCount * bannersPerVersion;
  const totalPullsNoTopUp =
    initialPulls + pullsPerVersion * versionCount + totalBanners * BANNER_BONUS_PULLS;

  const topUpPullsAll: number[] = [];
  const topUpArsenalAll: number[] = [];
  const arsenalGainedNoTopUpAll: number[] = [];
  const pullsSpentAll: number[] = [];
  const arsenalSpentAll: number[] = [];

  for (let i = 0; i < totalTrials; i++) {
    let currentPulls = initialPulls;
    let globalState = createInitialGlobalState();
    globalState.arsenalPoints = initialArsenal;

    let topUpPulls = 0;
    let topUpArsenal = 0;

    let pullsSpent = 0;
    let arsenalSpent = 0;

    let arsenalFromNonTopUpPulls = 0;

    for (let version = 0; version < versionCount; version++) {
      // 版本开始：发放确定性资源（非充值）
      currentPulls += pullsPerVersion;
      globalState.arsenalPoints += arsenalPerVersion;

      for (let banner = 0; banner < bannersPerVersion; banner++) {
        // ========== 角色池：抽到UP才收手（含卡池赠送10抽；不触发加急/情报书） ==========
        let bannerState = createInitialBannerState();

        // 1) 卡池赠送 10 抽（不消耗库存，不计入充值）
        for (let j = 0; j < BANNER_BONUS_PULLS; j++) {
          pullsSpent += 1;
          const { result, newGlobalState, newBannerState } = simulateSinglePull(
            globalState,
            bannerState,
            rng,
            false
          );
          globalState = newGlobalState;
          bannerState = newBannerState;
          arsenalFromNonTopUpPulls += result.arsenalPoints;

          if (result.rarity === 6 && result.isRateUp) {
            break;
          }
        }

        // 2) 若还没出UP，用库存抽数继续抽；不足则当场充值补齐
        while (!bannerState.gotRateUpInThisBanner) {
          const needPulls = Math.max(0, 1 - currentPulls);
          const isTopUpFunded = needPulls > 0;
          if (needPulls > 0) {
            topUpPulls += needPulls;
            currentPulls += needPulls;
          }

          // 消耗 1 抽
          currentPulls -= 1;
          pullsSpent += 1;

          const { result, newGlobalState, newBannerState } = simulateSinglePull(
            globalState,
            bannerState,
            rng,
            false
          );
          globalState = newGlobalState;
          bannerState = newBannerState;

          // 将由“非充值/充值”抽数带来的配额区分开（这里只需要统计“不充值获得配额”）
          if (!isTopUpFunded) {
            arsenalFromNonTopUpPulls += result.arsenalPoints;
          }

          if (result.rarity === 6 && result.isRateUp) {
            break;
          }
        }

        // ========== 武器池：抽到UP专武才收手（不足配额则当场充值补齐） ==========
        let weaponBannerState = createInitialWeaponBannerState();

        while (!weaponBannerState.gotRateUpInThisBanner) {
          const needArsenal = Math.max(0, ARSENAL_COST_PER_CLAIM - globalState.arsenalPoints);
          if (needArsenal > 0) {
            topUpArsenal += needArsenal;
            globalState.arsenalPoints += needArsenal;
          }

          globalState.arsenalPoints -= ARSENAL_COST_PER_CLAIM;
          arsenalSpent += ARSENAL_COST_PER_CLAIM;

          const { result, newWeaponBannerState } = simulateWeaponClaim(
            weaponBannerState,
            rng
          );
          weaponBannerState = newWeaponBannerState;

          if (result.gotRateUp) {
            break;
          }
        }
      }
    }

    const arsenalGainedNoTopUp =
      initialArsenal + arsenalPerVersion * versionCount + arsenalFromNonTopUpPulls;

    topUpPullsAll.push(topUpPulls);
    topUpArsenalAll.push(topUpArsenal);
    arsenalGainedNoTopUpAll.push(arsenalGainedNoTopUp);
    pullsSpentAll.push(pullsSpent);
    arsenalSpentAll.push(arsenalSpent);

    if (onProgress && (i + 1) % 500 === 0) {
      onProgress(i + 1, totalTrials);
    }
  }

  if (onProgress) {
    onProgress(totalTrials, totalTrials);
  }

  const avgTopUpPulls = topUpPullsAll.reduce((s, v) => s + v, 0) / totalTrials;
  const avgTopUpArsenal = topUpArsenalAll.reduce((s, v) => s + v, 0) / totalTrials;
  const avgArsenalGainedNoTopUp =
    arsenalGainedNoTopUpAll.reduce((s, v) => s + v, 0) / totalTrials;
  const avgPullsSpent = pullsSpentAll.reduce((s, v) => s + v, 0) / totalTrials;
  const avgArsenalSpent = arsenalSpentAll.reduce((s, v) => s + v, 0) / totalTrials;

  const sortedTopUpPulls = [...topUpPullsAll].sort((a, b) => a - b);
  const sortedTopUpArsenal = [...topUpArsenalAll].sort((a, b) => a - b);

  const medianTopUpPulls = sortedTopUpPulls[Math.floor(sortedTopUpPulls.length / 2)];
  const medianTopUpArsenal = sortedTopUpArsenal[Math.floor(sortedTopUpArsenal.length / 2)];

  // 分布
  const buildDistribution = (values: number[], bucketSize?: number) => {
    const map = new Map<number, number>();
    for (const v of values) {
      const key = bucketSize ? Math.floor(v / bucketSize) * bucketSize : v;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([count, freq]) => ({ count, percentage: (freq / totalTrials) * 100 }))
      .sort((a, b) => a.count - b.count);
  };

  const topUpPullsDistribution = buildDistribution(topUpPullsAll);
  // 为减少横轴分布密度，武库配额按每1000为一个档位
  const topUpArsenalDistribution = buildDistribution(topUpArsenalAll, 1000);

  // 总结句式：中位数 + “超过xx%的玩家需要充值不超过yy”
  const cumulativeSummary = (distribution: { count: number; percentage: number }[], unitLabel: string) => {
    let cumulative = 0;
    let threshold = 0;
    for (const { count, percentage } of distribution) {
      cumulative += percentage;
      threshold = count;
      if (cumulative >= 75) break;
    }
    return {
      cumulative,
      threshold,
      text: `超过${cumulative.toFixed(1)}%的玩家需要充值不超过${threshold}${unitLabel}`,
    };
  };

  const pullsSummary = cumulativeSummary(topUpPullsDistribution, '抽角色抽数');
  const arsenalSummary = cumulativeSummary(topUpArsenalDistribution, '武库配额');

  const formatClaims = (arsenal: number) => (arsenal / ARSENAL_COST_PER_CLAIM).toFixed(1);
  // 武库配额分布是按 1000 桶聚合的；为了配合“充值不超过”措辞，用桶上界（start+999）
  const arsenalBucketUpperBound = arsenalSummary.threshold + 999;

  return {
    totalPullsNoTopUp,
    avgArsenalGainedNoTopUp,

    avgPullsSpent,
    avgArsenalSpent,

    avgTopUpPulls,
    medianTopUpPulls,
    avgTopUpArsenal,
    medianTopUpArsenal,

    topUpPullsDistribution,
    topUpArsenalDistribution,

    topUpPullsMedianSummary: `玩家需要充值的角色抽数中位数为${medianTopUpPulls}抽`,
    topUpPullsCumulativeSummary: pullsSummary.text,
    topUpArsenalMedianSummary: `玩家需要充值的武库配额中位数为${medianTopUpArsenal}（约${formatClaims(medianTopUpArsenal)}次申领）`,
    topUpArsenalCumulativeSummary: `超过${arsenalSummary.cumulative.toFixed(1)}%的玩家需要充值不超过${arsenalBucketUpperBound}武库配额（约${formatClaims(arsenalBucketUpperBound)}次申领）`,

    debug: {
      note: `0+1全图鉴充值估算 | trials=${totalTrials} | 平均充值抽数=${avgTopUpPulls.toFixed(1)} | 平均充值配额=${avgTopUpArsenal.toFixed(0)}`,
      inputEcho: input,
    },
  };
}
