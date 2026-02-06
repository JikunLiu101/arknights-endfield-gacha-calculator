# 明日方舟：终末地 抽卡策略文档

本文档定义了模拟器支持的抽卡策略及其实现逻辑。

---

## 版本系统与资源发放

### 版本与卡池

- **版本周期**：游戏按版本更新，每个版本包含若干卡池
- **卡池类型**：
  - **角色池**：UP角色卡池（每个版本可能有多个）
  - **武器池**：UP专武卡池（每个版本可能有多个）
- **卡池时序**：一个版本内可能有多个角色池和武器池同时或先后开放

### 资源发放时机

- **抽卡资源**（pulls）：默认在**版本开始时发放**
  - 用户输入：`pullsPerVersion`（每版本抽数）
  - 发放时机：进入新版本时立即可用
  - 累积规则：未使用的抽数会累积到下一版本

- **武库配额**（arsenal points）：
  - **版本发放**：每版本开始时发放一定配额
    - 用户输入：`arsenalPerVersion`（每版本武库配额）
  - **抽卡获得**：通过角色池抽卡额外获得
    - 6星角色：+2000点
    - 5星角色：+200点
    - 4星角色：+20点

- **卡池赠送抽数**（banner bonus pulls）：
  - **每个角色卡池赠送10抽**，仅可用于该卡池
  - 不计入用户的库存抽数
  - 在基础策略中优先使用
  - 在附加策略中等价抵扣库存抽数消耗

---

## 策略体系

策略分为两个层级：

### 1. 基础策略（必选其一）
- **策略一：保底派（S1）** - 80抽阈值
- **策略二：井派（S2）** - 120抽阈值

### 2. 附加策略（可选、可多选）
- **附加策略一：永远使用情报书** - 默认开启
- **附加策略二：凑个加急寻访** - 赚取武库配额
- **附加策略三：凑个情报书** - 为下个池准备

---

## 策略概述

本项目实现了多种固定抽卡策略，用于模拟在有限资源下获取目标角色和专武的成功率。每个策略定义了：
- **角色池行为**：何时抽卡、何时停止
- **武器池行为**：何时申领、如何选择武器池
- **资源管理**：如何使用加急招募和情报书

---

## 策略一：保底派 (Conservative Strategy)

**策略ID**: `S1`
**策略名称**: 保底派 / 80抽策略
**核心思想**: 保守稳健，确保有足够资源触发硬保底（80抽）再进入角色池

### 角色池行为

#### 1. 进入条件（Gate Condition）
```
(当前可用抽数 + 卡池赠送10抽) > 80
```

- **当前可用抽数** = 初始抽数 + 累计获得抽数 - 已消耗抽数
- **卡池赠送10抽**：每个角色卡池固定赠送，仅可用于该池
- 只有满足条件时才会对该角色池进行抽卡

#### 2. 抽卡逻辑（Pull Logic）

**核心规则：一旦开始抽卡，持续抽卡直到获得UP角色或抽数耗尽**

```typescript
function pullCharacterBanner_S1(
  banner: CharacterBanner,
  currentPulls: number,
  globalState: GlobalGachaState,
  pendingIntelReport: IntelReport | null
) {
  const bannerBonusPulls = 10; // 卡池赠送抽数

  // 1. 检查进入条件（包含卡池赠送抽数）
  if (currentPulls + bannerBonusPulls <= 80) {
    return { success: false, pullsSpent: 0 }; // 不进入此池
  }

  // 2. 优先使用卡池赠送的10抽
  useBannerBonusPulls(10); // 不消耗库存抽数

  // 3. 如果有情报书，使用（10连）
  if (pendingIntelReport) {
    useIntelReport(); // 不消耗库存抽数
  }

  // 4. 持续单抽，直到获得UP或库存抽数耗尽
  let gotRateUp = false;
  while (currentPulls > 0 && !gotRateUp) {
    const result = simulateSinglePull(...);
    currentPulls--; // 消耗库存抽数

    if (result.rarity === 6 && result.isRateUp) {
      gotRateUp = true; // 获得UP，立即停止
    }

    // 检查是否触发加急招募（30抽）
    if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
      const fastTrack = simulateFastTrack(...);
      bannerState.fastTrackUsed = true;
      // 注意：加急招募不消耗抽数，不影响计数器
    }

    // 检查是否触发情报书（60抽）给下一个池
    if (bannerState.pullsInBanner === 60 && !bannerState.intelReportUsed) {
      pendingIntelReport = createIntelReportForNextBanner();
      bannerState.intelReportUsed = true;
    }
  }

  return { gotRateUp, pullsSpent: currentPulls, arsenalGained };
}
```

#### 3. 特殊机制处理

- **卡池赠送抽数**（Banner Bonus Pulls）
  - 每个角色卡池固定赠送10抽
  - 仅可用于该卡池，不可跨池使用
  - 优先使用，不消耗库存抽数
  - 计入保底和井计数器

- **加急招募**（Fast Track）
  - 触发条件：当前卡池抽满30次
  - 自动触发，执行10连抽
  - 不消耗库存抽数（免费）
  - 不影响保底和井计数器

- **寻访情报书**（Intelligence Report）
  - 触发条件：当前卡池抽满60次
  - 给予下一个角色池的免费10连
  - 下一个池开始时优先使用
  - 计入下一个池的保底和井计数器

#### 4. 退出条件（Exit Condition）

满足以下任一条件时停止抽卡：
1. **获得UP角色**（成功退出）
2. **抽数耗尽**（`currentPulls == 0`，失败退出）

---

### 武器池行为

#### 1. 进入条件（Gate Condition）

**必须同时满足以下条件：**
```
1. 已拥有该武器池对应的UP角色
2. 当前武库配额 >= 15840 (8次申领的成本: 8 × 1980)
```

#### 2. 武器池优先级排序

当多个武器池同时满足条件时，按以下优先级选择：

**优先级规则：**
1. **已拥有对应角色的武器池** > 未拥有对应角色的池
2. **结束时间早的池** > 结束时间晚的池

```typescript
function selectWeaponBanner(
  eligibleBanners: WeaponBanner[],
  ownedCharacters: Set<string>
) {
  return eligibleBanners.sort((a, b) => {
    // 优先级1：已有角色
    const aHasChar = ownedCharacters.has(a.correspondingCharacterId);
    const bHasChar = ownedCharacters.has(b.correspondingCharacterId);
    if (aHasChar && !bHasChar) return -1;
    if (!aHasChar && bHasChar) return 1;

    // 优先级2：先结束的池
    return a.endTime - b.endTime;
  })[0];
}
```

#### 3. 申领逻辑（Claim Logic）

```typescript
function claimWeaponBanner_S1(
  banner: WeaponBanner,
  arsenalPoints: number
) {
  let gotRateUp = false;
  let claimCount = 0;
  const maxClaims = 8; // 保底派最多申领8次（保证井）

  while (claimCount < maxClaims && arsenalPoints >= 1980 && !gotRateUp) {
    const result = simulateWeaponClaim(...);
    arsenalPoints -= 1980;
    claimCount++;

    if (result.gotRateUp) {
      gotRateUp = true; // 获得UP专武，立即停止
    }
  }

  return { gotRateUp, claimCount, arsenalSpent: claimCount * 1980 };
}
```

#### 4. 退出条件（Exit Condition）

满足以下任一条件时停止申领：
1. **获得UP专武**（成功退出）
2. **武库配额不足1980**（无法继续）
3. **已申领8次**（达到井上限）

---

## 策略二：井派 (Spark Strategy)

**策略ID**: `S2`
**策略名称**: 井派 / 120抽策略
**核心思想**: 确保有足够资源触发井机制（120抽）再进入角色池

### 角色池行为

#### 1. 进入条件（Gate Condition）
```
(当前可用抽数 + 卡池赠送10抽) > 120
```

- **对比保底派**：井派要求更高的进入门槛（120 vs 80）
- **卡池赠送10抽**：与保底派相同，优先使用
- 保证即使运气最差，也能通过井机制获得UP角色

#### 2. 抽卡逻辑（Pull Logic）

**与保底派完全相同**，只是进入门槛更高：

```typescript
function pullCharacterBanner_S2(
  banner: CharacterBanner,
  currentPulls: number,
  globalState: GlobalGachaState,
  pendingIntelReport: IntelReport | null
) {
  // 1. 检查进入条件（唯一区别）
  if (currentPulls <= 120) {
    return { success: false, pullsSpent: 0 }; // 不进入此池
  }

  // 2-4. 其余逻辑与保底派完全相同
  // ... (同策略一)
}
```

#### 3. 特殊机制处理

与保底派完全相同：
- 自动使用加急招募（30抽触发）
- 自动使用情报书（如果有）
- 触发情报书给下一个池（60抽）

#### 4. 退出条件（Exit Condition）

与保底派完全相同：
1. 获得UP角色
2. 抽数耗尽

---

### 武器池行为

**与保底派完全相同**，无任何差异。

---

## 策略对比总结

| 维度 | 策略一：保底派 | 策略二：井派 |
|------|--------------|------------|
| **策略ID** | S1 | S2 |
| **角色池进入门槛** | > 80抽 | > 120抽 |
| **角色池退出条件** | 获得UP 或 抽数耗尽 | 获得UP 或 抽数耗尽 |
| **加急招募** | 自动使用 | 自动使用 |
| **情报书** | 自动使用 | 自动使用 |
| **武器池进入条件** | 有角色 + 15840配额 | 有角色 + 15840配额 |
| **武器池申领上限** | 8次 | 8次 |
| **武器池优先级** | 有角色 > 先结束 | 有角色 > 先结束 |

**核心区别：仅在角色池进入门槛不同**
- 保底派：80抽（保证硬保底触发）
- 井派：120抽（保证井机制触发）

---

## 附加策略系统

附加策略是对基础策略的补充，用于优化资源利用。附加策略可以**不选或多选**，与基础策略配合使用。

---

## 附加策略一：永远使用情报书和卡池赠送抽数

**策略ID**: `A1`
**策略名称**: 永远使用情报书和卡池赠送抽数
**默认状态**: **开启**

### 核心规则

1. **卡池赠送10抽**：对任何角色卡池，优先使用赠送的10抽（基础策略已包含）
2. **寻访情报书**：如果持有该卡池的寻访情报书，则**必定使用**

### 实现逻辑

```typescript
function pullCharacterBanner_withA1(
  banner: CharacterBanner,
  pendingIntelReport: IntelReport | null,
  enableA1: boolean // 是否启用附加策略一
) {
  // 1. 优先使用卡池赠送抽数（10抽）
  useBannerBonusPulls(10); // 不消耗库存

  // 2. 如果启用附加策略一 且 有情报书 且 情报书对应此池
  if (enableA1 && pendingIntelReport && pendingIntelReport.targetBanner === banner.id) {
    // 使用情报书（10连）
    useIntelReport(pendingIntelReport);
    pendingIntelReport = null; // 已使用，清空
  }

  // 3. 继续基础策略的抽卡逻辑
  // ...
}
```

### 注意事项

- **卡池赠送10抽**：
  - 每个角色卡池固定赠送
  - 仅可用于该卡池
  - 不消耗库存抽数
  - 计入保底和井计数器

- **寻访情报书**：
  - 由上一个角色池60抽时生成
  - 情报书的10连计入当前池的保底和井计数器
  - 不消耗库存抽数（免费）

---

## 附加策略二：凑个加急寻访（赚武库配额）

**策略ID**: `A2`
**策略名称**: 凑加急寻访
**核心思想**: 在资源不足执行基础策略时，预支未来资源凑够30抽触发加急招募，赚取武库配额

### 触发条件

**必须同时满足以下所有条件：**

1. **当前资源不满足基础策略**
   ```
   currentPulls + bannerBonus <= threshold
   ```
   - `threshold` = 80（保底派）或 120（井派）
   - `bannerBonus` = 10（卡池赠送抽数）

2. **下个版本后预计超出阈值一定量**
   ```
   (currentPulls + bannerBonus + intelReport + pullsNextVersion) > (threshold + 20/10)
   ```

   **简化判断公式：**
   ```typescript
   const B = 10; // 卡池赠送抽数（固定）
   const I = hasIntelReport ? 10 : 0; // 情报书抵扣
   const surplus = currentPulls + B + I + pullsNextVersion - threshold;

   // 触发条件
   if (currentPulls + B <= threshold && surplus > (hasIntelReport ? 10 : 20)) {
     // 触发附加策略二
   }
   ```

   **说明：**
   - 有卡池赠送10抽 + 有情报书：盈余 > 10 即可触发（10 + 10 + 10 = 30抽，需要消耗库存0抽）
   - 有卡池赠送10抽 + 无情报书：盈余 > 20 即可触发（10 + 20 = 30抽，需要消耗库存20抽）

### 行为逻辑

1. **使用卡池赠送抽数**（固定10抽）
   - 不消耗库存抽数

2. **使用情报书**（如果有）
   - 不消耗库存抽数

3. **抽10/20抽（库存）**
   - 有卡池赠送 + 有情报书：10抽（10 + 10 + 10 = 30，触发加急）
   - 有卡池赠送 + 无情报书：20抽（10 + 20 = 30，触发加急）

4. **触发加急招募**
   - 30抽时自动触发，获得10连（不计入计数器）
   - 增加武库配额

5. **检查是否获得6星限定**
   ```typescript
   if (got6StarRateUp || got6StarLimited) {
     // 如果武库配额 >= 15840，执行武器池抽取
     if (arsenalPoints >= 15840) {
       claimWeaponBanner(...);
     }
   }
   ```

### 注意事项

- **"新的其他6星限定角色"** 是指：
  - 本池的UP6星角色
  - 延续限定6星角色（非常驻）
- 不包括常驻6星角色（歪了不算）

### 示例场景

**场景A：保底派 + 有情报书**
- 当前抽数：75
- 下个版本抽数：60
- 有情报书：是

判断：
```
currentPulls = 75 <= 80 ✓
surplus = 75 + 10 + 60 - 80 = 65 > 20 ✓
触发附加策略二
```

行为：
1. 使用情报书（10连）
2. 抽20抽
3. 触发加急招募（30抽时）
4. 总消耗：20抽（情报书免费）

**场景B：井派 + 无情报书**
- 当前抽数：100
- 下个版本抽数：80
- 有情报书：否

判断：
```
currentPulls = 100 <= 120 ✓
surplus = 100 + 0 + 80 - 120 = 60 > 30 ✓
触发附加策略二
```

行为：
1. 抽30抽
2. 触发加急招募（30抽时）
3. 总消耗：30抽

---

## 附加策略三：凑个情报书

**策略ID**: `A3`
**策略名称**: 凑情报书
**核心思想**: 在资源不足执行基础策略时，预支未来资源凑够60抽触发情报书，为下一个池准备

### 触发条件

**必须同时满足以下所有条件：**

1. **当前资源不满足基础策略**
   ```
   currentPulls + bannerBonus <= threshold
   ```

2. **下个版本后预计超出阈值一定量**
   ```
   (currentPulls + bannerBonus + intelReport + pullsNextVersion) > (threshold + 50/40)
   ```

   **简化判断公式：**
   ```typescript
   const B = 10; // 卡池赠送抽数（固定）
   const I = hasIntelReport ? 10 : 0;
   const surplus = currentPulls + B + I + pullsNextVersion - threshold;

   // 触发条件
   if (currentPulls + B <= threshold && surplus > (hasIntelReport ? 40 : 50)) {
     // 触发附加策略三
   }
   ```

   **说明：**
   - 有卡池赠送10抽 + 有情报书：盈余 > 40 即可触发（10 + 10 + 40 = 60抽，需要消耗库存40抽）
   - 有卡池赠送10抽 + 无情报书：盈余 > 50 即可触发（10 + 50 = 60抽，需要消耗库存50抽）

### 行为逻辑

1. **使用卡池赠送抽数**（固定10抽）
   - 不消耗库存抽数

2. **使用情报书**（如果有）
   - 不消耗库存抽数

3. **抽40/50抽（库存）**
   - 有卡池赠送 + 有情报书：40抽（10 + 10 + 40 = 60，触发情报书）
   - 有卡池赠送 + 无情报书：50抽（10 + 50 = 60，触发情报书）

4. **触发加急招募**
   - 30抽时自动触发（免费10连，增加武库配额）

5. **触发寻访情报书**
   - 60抽时自动触发，生成下一个池的情报书

6. **检查是否获得6星限定**
   ```typescript
   if (got6StarRateUp || got6StarLimited) {
     // 如果武库配额 >= 15840，执行武器池抽取
     if (arsenalPoints >= 15840) {
       claimWeaponBanner(...);
     }
   }
   ```

### 注意事项

- 附加策略三包含附加策略二的效果（30抽触发加急）
- 额外增加了60抽触发情报书的效果
- 为下一个角色池提供免费10连

### 示例场景

**场景A：保底派 + 有情报书**
- 当前抽数：60
- 下个版本抽数：100
- 有情报书：是

判断：
```
currentPulls = 60 <= 80 ✓
surplus = 60 + 10 + 100 - 80 = 90 > 50 ✓
触发附加策略三
```

行为：
1. 使用情报书（10连）
2. 抽50抽
3. 触发加急招募（30抽时）
4. 触发寻访情报书（60抽时）
5. 总消耗：50抽

**场景B：井派 + 无情报书**
- 当前抽数：80
- 下个版本抽数：150
- 有情报书：否

判断：
```
currentPulls = 80 <= 120 ✓
surplus = 80 + 0 + 150 - 120 = 110 > 60 ✓
触发附加策略三
```

行为：
1. 抽60抽
2. 触发加急招募（30抽时）
3. 触发寻访情报书（60抽时）
4. 总消耗：60抽

---

## 附加策略优先级

当多个附加策略同时启用时，执行顺序如下：

1. **附加策略一（永远使用情报书）**
   - 最高优先级，如果有情报书则先使用

2. **附加策略三（凑情报书）**
   - 次优先级，条件更严格（需要更多盈余）

3. **附加策略二（凑加急）**
   - 最低优先级，条件最宽松

**判断逻辑：**
```typescript
if (enableA1 && hasIntelReport) {
  useIntelReport();
}

if (enableA3 && triggersA3Condition()) {
  pullToTriggerIntelReport(50 or 60);
} else if (enableA2 && triggersA2Condition()) {
  pullToTriggerFastTrack(20 or 30);
} else {
  // 执行基础策略
}
```

---

## 附加策略对比总结

| 维度 | A1: 永远使用情报书和赠送抽数 | A2: 凑加急 | A3: 凑情报书 |
|------|---------------------------|----------|------------|
| **默认状态** | 开启 | 关闭 | 关闭 |
| **触发条件** | 有情报书或卡池赠送抽数 | 当前不足 + 盈余>20/10 | 当前不足 + 盈余>50/40 |
| **抽卡量（库存）** | 0（全部免费） | 20/10抽 | 50/40抽 |
| **卡池赠送10抽** | ✓ 优先使用 | ✓ 抵扣消耗 | ✓ 抵扣消耗 |
| **触发加急** | - | ✓（30抽） | ✓（30抽） |
| **触发情报书** | - | ✗ | ✓（60抽） |
| **核心收益** | 省10抽 | 赚武库配额 | 赚配额+下池情报书 |
| **武器池抽取** | - | 有6星限定时 | 有6星限定时 |

---

## 实现架构设计

### 1. 策略接口定义

```typescript
// src/sim/types.ts

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
 * 策略执行结果
 */
export type StrategyResult = {
  obtainedCharacters: Set<string>;  // 获得的UP角色ID集合
  obtainedWeapons: Set<string>;     // 获得的UP专武ID集合
  totalPullsSpent: number;          // 总消耗抽数
  totalArsenalSpent: number;        // 总消耗武库配额
  remainingPulls: number;           // 剩余抽数
  remainingArsenal: number;         // 剩余武库配额
  bannerOutcomes: BannerOutcome[];  // 每个卡池的详细结果
};
```

### 2. 策略常量配置

```typescript
// src/sim/strategies.ts

/**
 * 基础策略配置
 */
export const BASE_STRATEGIES = {
  S1: {
    id: 'S1' as const,
    name: '保底派',
    characterBannerThreshold: 80,
    weaponBannerThreshold: 15840, // 8 × 1980
  },
  S2: {
    id: 'S2' as const,
    name: '井派',
    characterBannerThreshold: 120,
    weaponBannerThreshold: 15840, // 8 × 1980
  },
};

/**
 * 附加策略配置
 */
export const ADDON_STRATEGIES = {
  A1: {
    id: 'A1' as const,
    name: '永远使用情报书',
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
      A1_alwaysUseIntelReport: true,   // 默认开启
      A2_pullForFastTrack: false,      // 默认关闭
      A3_pullForIntelReport: false,    // 默认关闭
    },
  };
}
```

### 3. 核心执行流程

```typescript
// src/sim/strategies.ts

export function executeStrategy(
  strategyId: StrategyId,
  banners: Banner[],
  initialPulls: number,
  rng: RNG
): StrategyResult {
  const config = STRATEGIES[strategyId];

  let currentPulls = initialPulls;
  let globalState = createInitialGlobalState();
  let ownedCharacters = new Set<string>();
  let ownedWeapons = new Set<string>();
  let pendingIntelReport: IntelReport | null = null;

  // 按卡池顺序逐个处理
  for (const banner of banners) {
    if (banner.type === 'character') {
      // 角色池逻辑
      const outcome = pullCharacterBanner(
        banner,
        currentPulls,
        globalState,
        pendingIntelReport,
        config
      );

      currentPulls -= outcome.pullsSpent;
      globalState = outcome.finalGlobalState;
      pendingIntelReport = outcome.generatedIntelReport;

      if (outcome.gotRateUp) {
        ownedCharacters.add(banner.rateUpCharacterId);
      }
    } else if (banner.type === 'weapon') {
      // 武器池逻辑
      const eligibleBanners = getEligibleWeaponBanners(
        weaponBanners,
        ownedCharacters,
        globalState.arsenalPoints,
        config
      );

      if (eligibleBanners.length > 0) {
        const selectedBanner = selectWeaponBanner(eligibleBanners, ownedCharacters);
        const outcome = claimWeaponBanner(selectedBanner, globalState, config);

        globalState.arsenalPoints -= outcome.arsenalSpent;

        if (outcome.gotRateUp) {
          ownedWeapons.add(selectedBanner.rateUpWeaponId);
        }
      }
    }
  }

  return {
    obtainedCharacters,
    obtainedWeapons,
    totalPullsSpent: initialPulls - currentPulls,
    totalArsenalSpent: /* calculate */,
    remainingPulls: currentPulls,
    remainingArsenal: globalState.arsenalPoints,
    bannerOutcomes: /* collect */,
  };
}
```

---

## 关键实现要点

### 1. 进入条件检查

**必须在每个卡池开始前检查**，而不是在抽卡过程中：

```typescript
// ✗ 错误：在循环中检查
while (currentPulls > threshold && !gotRateUp) {
  // 这样会导致抽到一半时资源不足停止
}

// ✓ 正确：进入前检查
if (currentPulls <= threshold) {
  return; // 不进入此池
}
while (currentPulls > 0 && !gotRateUp) {
  // 一旦进入，持续抽到UP或抽数耗尽
}
```

### 2. 加急招募和情报书的触发时机

- **加急招募**：在 `pullsInBanner === 30` 时触发
- **情报书**：在 `pullsInBanner === 60` 时触发
- 需要维护 `bannerState.pullsInBanner` 计数器

### 3. 武器池的优先级排序

必须同时考虑：
1. 是否有对应角色（布尔值，优先级最高）
2. 结束时间（数值，次优先级）

### 4. 状态继承

- **全局状态**（`GlobalGachaState`）：跨卡池继承
  - `pityCounter`：保底计数器
  - `arsenalPoints`：武库配额
- **卡池状态**（`BannerState`）：每个卡池独立
  - `sparkCounter`：井计数器（切池重置）
  - `pullsInBanner`：本池抽数（切池重置）

---

## 后续扩展策略

### 策略三：平衡派（待定）
- 可能的思路：在保底派和井派之间取平衡，例如 > 100抽进入

### 策略四：激进派（待定）
- 可能的思路：只要有抽数就进入，追求覆盖率最大化

### 策略五：定制派（用户自定义）
- 允许用户指定每个卡池的进入条件和抽卡策略

---

## 测试策略

### 单元测试

1. **策略配置验证**
   - 验证 S1 的门槛是 80
   - 验证 S2 的门槛是 120

2. **进入条件测试**
   - 79抽时不进入 S1 角色池
   - 80抽时不进入 S1 角色池（> 80 才进入）
   - 81抽时进入 S1 角色池

3. **退出条件测试**
   - 获得UP后立即停止
   - 抽数耗尽后停止

### 集成测试

1. **完整模拟流程**
   - 初始200抽 + 每版本60抽 × 3版本 = 380抽
   - 执行 S1 策略，验证角色和武器获取情况

2. **多池场景**
   - 3个角色池 + 2个武器池并存
   - 验证优先级排序和资源分配

### 概率验证测试

1. **大样本测试**
   - 运行10000次trial
   - 统计成功率、平均消耗等指标
   - 验证是否符合理论预期

---

## 文档版本

- **版本**: 1.0
- **最后更新**: 2026-02-06
- **作者**: Claude + User
