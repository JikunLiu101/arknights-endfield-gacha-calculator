// ============ 策略相关类型 ============

/**
 * 基础策略ID
 */
export type BaseStrategyId = 'S1' | 'S2';

/**
 * 附加策略ID
 */
export type AddonStrategyId = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

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
    A4_useAllInLastVersion: boolean;    // 最后版本用光资源（默认false）
    A5_weaponSparkPriority: boolean;    // 武器井优先（默认true）- 开启时8次申领才抽专武，关闭时4次申领就抽
  };
};

/**
 * 旧的 StrategyId 类型（向后兼容）
 */
export type StrategyId = BaseStrategyId;

export type SimInput = {
  currentPulls: number;
  currentArsenal: number; // 当前武库配额
  pullsPerVersion: number;
  arsenalPerVersion: number; // 每版本武库配额
  versionCount: number;
  bannersPerVersion: number;
  /**
   * 若为 true，则第 1 个版本（版本1）的“每版本资源”（抽数/武库配额）不再计入。
   * 用于表示：当前版本资源已获取/已花掉，只计算后续版本可以获得的资源。
   */
  excludeFirstVersionResources?: boolean;
  strategyId: BaseStrategyId;
  strategyConfig?: StrategyConfig; // 完整策略配置（可选）
  trials: number;
  seed: string | null;
};

export type SimOutput = {
  // 资源统计
  totalPulls: number; // 初始 + 获取的总抽数
  avgTotalPullsGained?: number; // 含卡池赠送/加急/情报书的期望总抽数（用于资源来源提示）
  avgArsenalGained: number; // 初始 + 获取的总武库配额，是平均值
  avgPullsSpent: number; // 平均花费抽数
  avgArsenalSpent: number; // 平均花费武库配额
  avgArsenalClaims: number; // 平均申领次数（武库配额/1980）

  // 资源来源明细（用于 UI 悬浮提示）
  pullsBreakdownLines?: string[];
  arsenalBreakdownLines?: string[];

  // 角色统计
  totalCharacters: number; // 总限定角色数量（卡池总数）
  avgCharactersObtained: number; // 期望获得的不重复6星限定角色数量
  medianCharactersObtained: number; // 限定角色获取中位数
  characterDistribution: { count: number; percentage: number }[]; // 角色获取分布
  characterMedianSummary: string; // 角色中位数总结
  characterCumulativeSummary: string; // 角色累加总结（"超过X%的玩家可以获得Y个限定角色"）

  // 专武统计
  totalWeapons: number; // 总专武数量（与角色数相同）
  avgWeaponsObtained: number; // 期望获得的专武数量
  medianWeaponsObtained: number; // 专武获取中位数
  weaponDistribution: { count: number; percentage: number }[]; // 专武获取分布
  weaponMedianSummary: string; // 专武中位数总结
  weaponCumulativeSummary: string; // 专武累加总结

  // 旧字段（保持向后兼容）
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

// ============ 第二分页：全图鉴 0+1 充值估算输出 ============

export type TopUpSimOutput = {
  // 不充值可获得的资源（角色抽数为确定值；武库配额为期望值，因为来自抽卡的配额是随机的）
  totalPullsNoTopUp: number;
  avgArsenalGainedNoTopUp: number;

  // 资源来源明细（用于 UI 悬浮提示）
  pullsNoTopUpBreakdownLines?: string[];
  arsenalNoTopUpBreakdownLines?: string[];

  // 期望花费总计（包含卡池赠送、规划资源与充值投入后实际消耗）
  avgPullsSpent: number;
  avgArsenalSpent: number;

  // 充值统计（期望/中位数）
  avgTopUpPulls: number;
  medianTopUpPulls: number;
  avgTopUpArsenal: number;
  medianTopUpArsenal: number;

  // 分布（用于图表）
  topUpPullsDistribution: { count: number; percentage: number }[];
  topUpArsenalDistribution: { count: number; percentage: number }[];

  // 总结文案（仿照第一页）
  topUpPullsMedianSummary: string;
  topUpPullsCumulativeSummary: string;
  topUpArsenalMedianSummary: string;
  topUpArsenalCumulativeSummary: string;

  debug: {
    note: string;
    inputEcho: SimInput;
  };
};

export type WorkerRunRequest =
  | {
      type: 'run';
      input: SimInput;
    }
  | {
      type: 'runTopUp';
      input: SimInput;
    };

export type WorkerResponse =
  | { type: 'progress'; done: number; total: number }
  | { type: 'result'; output: SimOutput }
  | { type: 'resultTopUp'; output: TopUpSimOutput }
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
