import type { SimInput, SimOutput } from './types';
import { createRng } from './rng';
import {
  createDefaultStrategyConfig,
  executeStrategy,
  type StrategyExecutionResult,
} from './strategies';

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
  const totalArsenal = avgArsenalSpent + avgArsenalRemaining;

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
  const characterCumulativeSummary = `超过${charCumulative.toFixed(1)}%的玩家可以获得${charThresholdCount}个限定角色`;

  // 计算专武累加总结
  let weaponCumulative = 0;
  let weaponThresholdCount = 0;
  for (const { count, percentage } of weaponDistribution) {
    weaponCumulative += percentage;
    weaponThresholdCount = count;
    if (weaponCumulative >= 75) break;
  }
  const weaponCumulativeSummary = `超过${weaponCumulative.toFixed(1)}%的玩家可以获得${weaponThresholdCount}个专武`;

  // 对于成功率，我们定义为"获得至少1个角色"的概率
  const successRate = results.filter((r) => r.obtainedCharacterCount > 0).length / totalTrials;

  return {
    // 资源统计
    totalPulls,
    totalArsenal,
    avgPullsSpent: avgSpent,
    avgArsenalSpent,
    avgArsenalClaims,

    // 角色统计
    totalCharacters: totalBanners,
    avgCharactersObtained: avgCharacterCount,
    medianCharactersObtained,
    characterDistribution,
    characterCumulativeSummary,

    // 专武统计
    totalWeapons: totalBanners,
    avgWeaponsObtained: avgWeaponCount,
    medianWeaponsObtained,
    weaponDistribution,
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
