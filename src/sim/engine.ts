import type { SimInput, SimOutput } from './types';
import { createRng } from './rng';

// 占位模拟引擎：先用一个“固定成功率 + 预算相关”的简化模型跑通 UI/Worker。
// 后续你提供固定卡池机制与策略细节后，将这里替换为真实的 gachaModel + strategy runner。

export function runSimulation(input: SimInput, onProgress?: (done: number, total: number) => void): SimOutput {
  const rng = createRng(input.seed);

  const totalTrials = Math.max(1, Math.floor(input.trials));
  const pullsBudget =
    Math.max(0, Math.floor(input.currentPulls)) +
    Math.max(0, Math.floor(input.pullsPerVersion)) * Math.max(0, Math.floor(input.versionCount));

  // 占位：成功概率随预算增加略增（仅用于脚手架演示）
  const baseP = 0.10;
  const budgetFactor = Math.min(0.75, pullsBudget / 3000);
  const successP = Math.min(0.95, baseP + budgetFactor);

  let successCount = 0;
  const spentSamples: number[] = [];

  for (let i = 0; i < totalTrials; i++) {
    // 占位：用几何分布抽样“达成所需抽数”，并截断在预算内
    let spent = 0;
    while (spent < pullsBudget) {
      spent++;
      if (rng.nextFloat() < successP / Math.max(1, pullsBudget)) {
        break;
      }
    }

    const success = spent < pullsBudget;
    if (success) successCount++;

    // 若失败，记为预算（表示抽完也没达成）
    spentSamples.push(success ? spent : pullsBudget);

    if (onProgress && (i + 1) % 500 === 0) {
      onProgress(i + 1, totalTrials);
    }
  }

  spentSamples.sort((a, b) => a - b);

  const avgSpent = spentSamples.reduce((sum, v) => sum + v, 0) / spentSamples.length;
  const q = (p: number) => spentSamples[Math.min(spentSamples.length - 1, Math.floor(p * (spentSamples.length - 1)))];

  return {
    successRate: successCount / totalTrials,
    avgSpent,
    p50Spent: q(0.5),
    p90Spent: q(0.9),
    p99Spent: q(0.99),
    debug: {
      note: '当前为占位模拟模型；请在补充卡池机制/策略后替换为真实模拟逻辑。',
      inputEcho: input,
    },
  };
}
