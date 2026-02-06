export type StrategyId = 'S1' | 'S2' | 'S3';

export type SimInput = {
  currentPulls: number;
  pullsPerVersion: number;
  versionCount: number;
  bannersPerVersion: number;
  strategyId: StrategyId;
  trials: number;
  seed: string | null;
};

export type SimOutput = {
  successRate: number;
  avgSpent: number;
  p50Spent: number;
  p90Spent: number;
  p99Spent: number;
  debug: {
    note: string;
    inputEcho: SimInput;
  };
};

export type WorkerRunRequest = {
  type: 'run';
  input: SimInput;
};

export type WorkerResponse =
  | { type: 'progress'; done: number; total: number }
  | { type: 'result'; output: SimOutput }
  | { type: 'error'; message: string };

// ============ 卡池机制相关类型 ============

/**
 * 全局抽卡状态（跨卡池继承）
 */
export type GlobalGachaState = {
  pityCounter: number; // 保底计数器（连续未出6星的次数）
  arsenalPoints: number; // 武库配额累计
};

/**
 * 单个卡池状态（卡池内独立）
 */
export type BannerState = {
  sparkCounter: number; // 井计数器（当前池内抽卡次数，用于判断120抽井）
  pullsInBanner: number; // 当前卡池累计抽数（用于触发加急30/情报书60）
  fastTrackUsed: boolean; // 是否已使用加急招募
  intelReportUsed: boolean; // 是否已使用寻访情报书
  gotRateUpInThisBanner: boolean; // 当前卡池是否已获得UP角色（用于井的判断）
};

/**
 * 单次抽卡结果
 */
export type PullResult = {
  rarity: 6 | 5 | 4;
  isRateUp: boolean; // 仅当rarity=6时有意义，表示是否为UP角色
  triggeredPity: boolean; // 是否在此次抽卡触发了保底（概率提升到5.8%）
  triggeredSpark: boolean; // 是否在此次抽卡触发了井（第120抽强制UP）
  arsenalPoints: number; // 本次抽卡获得的武库配额
};

/**
 * 加急招募结果（10连抽，必得5星+）
 */
export type FastTrackResult = {
  pullResults: PullResult[]; // 10次抽卡结果，至少1个5星+
  arsenalGained: number; // 获得的武库配额
};

/**
 * 单个卡池的模拟结果
 */
export type BannerOutcome = {
  gotRateUp: boolean; // 是否获得了UP角色
  pullsSpent: number; // 本次在该卡池消耗的抽数
  pullResults: PullResult[]; // 所有抽卡的详细结果（不含加急招募）
  fastTrackResult: FastTrackResult | null; // 加急招募结果（如果触发）
  arsenalGained: number; // 本池累计获得的武库配额（含加急）
  finalGlobalState: GlobalGachaState; // 更新后的全局状态
  finalBannerState: BannerState; // 最终卡池状态
};
