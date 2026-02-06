# 附加策略 A4：最后版本用光所有资源

## 策略概述

**策略ID**: A4
**策略名称**: 最后版本用光所有资源
**默认状态**: 关闭
**优先级**: 最高（在所有策略判断之前）

## 功能描述

在规划的**最后一个版本**的**最后一个卡池**，如果启用 A4 策略且有剩余抽数，会强制进入该卡池并用光所有剩余抽数，不留盈余。

## 触发条件

满足以下**所有**条件时触发：
1. A4 策略已启用（`A4_useAllInLastVersion = true`）
2. 当前为最后一个版本（`version === versionCount - 1`）
3. 当前为该版本的最后一个卡池（`banner === bannersPerVersion - 1`）
4. 有剩余抽数（`currentPulls > 0`）

## 行为逻辑

当 A4 触发时：
- **强制进入卡池**：即使不满足基础策略的进入门槛（>80抽或>120抽）
- **用光所有抽数**：`pullsToSpend = currentPulls`
- **持续抽卡**：直到获得UP角色或抽数耗尽

## 优先级说明

A4 策略的优先级**最高**，在策略判断流程中排在第一位：

```typescript
// 0. 检查附加策略四（最后版本用光资源）- 最高优先级
if (A4_useAllInLastVersion && isLastVersion && isLastBanner && currentPulls > 0) {
  shouldEnter = true;
  pullsToSpend = currentPulls;
}
// 1. 检查基础策略进入条件（>80抽或>120抽）
else if (canEnterCharacterBanner(currentPulls, threshold)) {
  ...
}
// 2. 检查附加策略三（凑情报书）
else if (A3_pullForIntelReport && ...) {
  ...
}
// 3. 检查附加策略二（凑加急寻访）
else if (A2_pullForFastTrack && ...) {
  ...
}
```

## 使用场景

### 适合使用 A4 的情况：
- **追求收益最大化**：不想浪费任何资源，即使风险较高也要用完所有抽数
- **规划已到尽头**：确定规划的版本数后不会再增加
- **宁可赌一把**：哪怕抽数不足80/120抽，也想试试运气

### 不适合使用 A4 的情况：
- **保守型玩家**：希望保留盈余，避免浪费在低价值卡池上
- **规划可能延长**：后续可能增加规划版本数
- **追求稳定性**：只想在满足进入条件时才抽卡

## 示例

### 示例 1：A4 开启
```
规划：3个版本，每版本2个卡池
基础策略：S1（保底派，>80抽进入）
当前状态：最后版本的最后一个卡池，剩余50抽

结果：
- A4 触发 ✓
- 即使只有50抽（<80抽），仍然进入卡池
- 用光所有50抽
```

### 示例 2：A4 关闭
```
规划：3个版本，每版本2个卡池
基础策略：S1（保底派，>80抽进入）
当前状态：最后版本的最后一个卡池，剩余50抽

结果：
- A4 未启用 ✗
- 检查基础策略：50抽 < 80抽，不满足进入条件
- 不进入卡池，保留50抽
```

## 技术实现

### 类型定义
```typescript
// src/sim/types.ts
export type AddonStrategyId = 'A1' | 'A2' | 'A3' | 'A4';

export type StrategyConfig = {
  addonStrategies: {
    A1_alwaysUseIntelReport: boolean;
    A2_pullForFastTrack: boolean;
    A3_pullForIntelReport: boolean;
    A4_useAllInLastVersion: boolean; // 新增
  };
};
```

### 策略配置
```typescript
// src/sim/strategies.ts
export const ADDON_STRATEGIES = {
  A4: {
    id: 'A4' as const,
    name: '最后版本用光所有资源',
    defaultEnabled: false,
  },
};
```

### 函数签名更新
```typescript
// src/sim/strategies.ts
export function pullCharacterBanner(
  config: StrategyConfig,
  currentPulls: number,
  pullsNextVersion: number,
  globalState: GlobalGachaState,
  hasIntelReport: boolean,
  isLastVersion: boolean,   // 新增参数
  isLastBanner: boolean,    // 新增参数
  rng: Rng
): BannerOutcome & { ... }
```

## 版本信息

- **版本**: 1.0
- **添加日期**: 2026-02-06
- **作者**: Claude + User
