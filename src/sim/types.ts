// ============ 策略相关类型 ============

/**
 * 基础策略ID
 */
export type BaseStrategyId = 'S1' | 'S2';

/**
 * 附加策略ID
 */
export type AddonStrategyId = 'A1' | 'A2' | 'A3';

/**
 * 策略配置
 */
export type StrategyConfig = {
  // 基础策略
  baseStrategy: BaseStrategyId;
  characterBannerThreshold: number; // 角色池进入门槛（80 or 120）
  weaponBannerThreshold: number;    // 武器池进入门槛（武库配额，默认15840）

  // 附加策略（可选、可多选）
  addonStrategies: {
    A1_alwaysUseIntelReport: boolean;   // 永远使用情报书（默认true）
    A2_pullForFastTrack: boolean;       // 凑加急寻访（默认false）
    A3_pullForIntelReport: boolean;     // 凑情报书（默认false）
  };
};

/**
 * 旧的 StrategyId 类型（向后兼容）
 */
export type StrategyId = BaseStrategyId;

export type SimInput = {
  currentPulls: number;
  pullsPerVersion: number;
  arsenalPerVersion: number; // 新增：每版本武库配额
  versionCount: number;
  bannersPerVersion: number;
  strategyId: BaseStrategyId;
  strategyConfig?: StrategyConfig; // 新增：完整策略配置（可选）
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

// ============ 武器池相关类型 ============

/**
 * 武器池状态（每个武器池独立）
 */
export type WeaponBannerState = {
  weaponPityCounter: number; // 保底计数器（连续未出6星的申领次数，0-3）
  weaponSparkCounter: number; // 井计数器（连续未出UP的申领次数，0-7）
  gotRateUpInThisBanner: boolean; // 当前武器池是否已获得UP专武（井仅生效一次）
  claimsInBanner: number; // 当前武器池累计申领次数（统计用）
};

/**
 * 单次武器抽取结果
 */
export type WeaponPullResult = {
  rarity: 6 | 5 | 4;
  isRateUp: boolean; // 仅当rarity=6时有意义，表示是否为UP专武
  triggeredPity: boolean; // 是否触发了保底（第4次申领必得6星）
  triggeredSpark: boolean; // 是否触发了井（第8次申领必得UP）
};

/**
 * 一次申领结果（10连）
 */
export type WeaponClaimResult = {
  pullResults: WeaponPullResult[]; // 10次抽取结果
  gotSixStar: boolean; // 是否获得6星武器
  gotRateUp: boolean; // 是否获得UP专武
  triggeredPity: boolean; // 本次申领是否触发保底
  triggeredSpark: boolean; // 本次申领是否触发井
};

/**
 * 武器池模拟结果
 */
export type WeaponBannerOutcome = {
  gotRateUp: boolean; // 是否获得了UP专武
  claimsSpent: number; // 消耗的申领次数
  arsenalSpent: number; // 消耗的武库配额（= claimsSpent * 1980）
  claimResults: WeaponClaimResult[]; // 所有申领的详细结果
  finalWeaponBannerState: WeaponBannerState; // 最终武器池状态
  finalArsenalPoints: number; // 剩余武库配额
};
