# 明日方舟：终末地 卡池机制实现文档

## 核心规则总结

### 1. 基础概率与角色构成

- **6星基础概率**: 0.8% (0.008)
  - UP角色: 0.4% (0.004) - 占6星的50%
  - 非UP角色: 0.4% (0.004) - 2个延续限定 + 5个常驻，共7个角色均分
- **5星概率**: 8% (0.08)
- **4星概率**: 91.2% (0.912)
- **模拟重点**: 仅关注6星角色，特别是UP角色的获取

### 2. 保底机制 (Pity System)

- **触发条件**: 连续65次抽卡未获得6星角色
- **概率提升**:
  - 第65抽前: 0.8% (基础概率)
  - 第65抽: 0.8% + 1×5% = 5.8%
  - 第66抽: 0.8% + 2×5% = 10.8%
  - 逐抽递增5%，直到...
  - **第80抽: 100% (硬保底，强制获得6星)**
- **重置条件**: 获得任意6星角色后，计数器归零，概率恢复0.8%
- **继承规则**: **跨卡池继承**（全局计数器），不会因换池而重置

### 3. 井机制 (Spark/Guarantee System)

- **触发条件**: 在当前卡池的前120次抽卡中，未获得UP角色
- **效果**: 第120次抽卡必定获得UP角色
- **继承规则**: **每个卡池独立**，更换卡池后井计数器重置为0

### 4. 加急招募 (Fast Track Recruitment)

- **触发条件**: 在当前卡池累计抽取30次后
- **内容**: 额外获得10连抽（必须10连）
- **特殊规则**:
  - 这10连抽必定至少获得1个5星或以上角色
  - 遵循卡池基础概率（0.8% 六星、8% 五星等）
  - **不计入保底计数器**（不增加也不触发）
  - **不计入井计数器**（不增加也不触发）
- **限制**: 每个卡池仅触发一次

### 5. 寻访情报书 (Intelligence Report)

- **触发条件**: 在当前卡池累计抽取60次后
- **内容**: 额外获得下个卡池（紧连的卡池）的免费10连抽
- **特殊规则**:
  - 遵循**下个卡池**的概率和规则
  - **计入下个卡池的保底和井计数器**（正常计数）
- **限制**: 每个卡池仅触发一次

### 6. 武库配额 (Arsenal Points)

- **获得规则**:
  - 6星角色: +2000点
  - 5星角色: +200点
  - 4星角色: +20点
- **用途**: 后续武器池抽取（当前实现中仅累计记录）

---

## 数据模型设计

### 核心类型定义

```typescript
// ============ 全局状态（跨卡池继承） ============
export type GlobalGachaState = {
  pityCounter: number;        // 保底计数器（连续未出6星的次数）
  arsenalPoints: number;      // 武库配额累计
};

// ============ 单个卡池状态（卡池内独立） ============
export type BannerState = {
  sparkCounter: number;       // 井计数器（当前池内抽卡次数，用于判断120抽井）
  pullsInBanner: number;      // 当前卡池累计抽数（用于触发加急30/情报书60）
  fastTrackUsed: boolean;     // 是否已使用加急招募
  intelReportUsed: boolean;   // 是否已使用寻访情报书
};

// ============ 单次抽卡结果 ============
export type PullResult = {
  rarity: 6 | 5 | 4;
  isRateUp: boolean;          // 仅当rarity=6时有意义，表示是否为UP角色
  triggeredPity: boolean;     // 是否在此次抽卡触发了保底（概率提升到5.8%）
  triggeredSpark: boolean;    // 是否在此次抽卡触发了井（第120抽强制UP）
  arsenalPoints: number;      // 本次抽卡获得的武库配额
};

// ============ 卡池模拟结果 ============
export type BannerOutcome = {
  gotRateUp: boolean;         // 是否获得了UP角色
  pullsSpent: number;         // 本次在该卡池消耗的抽数
  pullResults: PullResult[]; // 所有抽卡的详细结果
  arsenalGained: number;      // 本池累计获得的武库配额
  finalGlobalState: GlobalGachaState;  // 更新后的全局状态
  finalBannerState: BannerState;       // 最终卡池状态
};

// ============ 加急招募结果 ============
export type FastTrackResult = {
  pullResults: PullResult[];  // 10次抽卡结果，至少1个5星+
  arsenalGained: number;      // 获得的武库配额
};
```

---

## 核心算法实现

### 1. 单次抽卡逻辑 (simulateSinglePull)

这是最基础的原子操作，处理一次抽卡的所有逻辑。

```typescript
function simulateSinglePull(
  globalState: GlobalGachaState,
  bannerState: BannerState,
  rng: RNG,
  isFromFastTrack: boolean = false  // 是否来自加急招募
): { result: PullResult; newGlobalState: GlobalGachaState; newBannerState: BannerState }
```

**实现步骤**:

1. **判断是否触发井**（仅非加急招募）
   - 如果 `bannerState.sparkCounter === 119`（即将第120抽）且之前未获得UP
   - 强制返回6星UP角色

2. **判断是否触发硬保底**（仅非加急招募）
   - 如果 `globalState.pityCounter >= 80`
   - 强制返回6星角色（按50%概率判断是否UP）
   - 标记 `triggeredPity = true`

3. **计算当前6星概率**（正常抽卡流程）
   - 基础概率: 0.008
   - 如果 `globalState.pityCounter >= 65 && < 80`:
     - 概率 = 0.008 + (pityCounter - 64) × 0.05
     - 第65抽: 5.8%, 第66抽: 10.8%, ..., 第79抽: 75.8%
   - 如果 `pityCounter >= 80`: 100% (但会在步骤2处理)

4. **抽取稀有度** (用RNG)
   - 生成随机数 r ∈ [0, 1)
   - r < 6星概率 → 6星
   - r < 6星概率 + 5星概率 → 5星
   - 否则 → 4星

5. **如果是6星，判断是否UP**
   - 生成随机数 r2 ∈ [0, 1)
   - r2 < 0.5 → UP角色
   - 否则 → 非UP角色（歪了）

6. **更新状态**
   - 如果获得6星: `pityCounter` 归零
   - 否则: `pityCounter++`（仅非加急招募）
   - 非加急招募: `sparkCounter++`
   - 累加武库配额

### 2. 加急招募逻辑 (simulateFastTrack)

```typescript
function simulateFastTrack(
  globalState: GlobalGachaState,
  rng: RNG
): FastTrackResult
```

**要点**:
- 执行10次抽卡（使用 `simulateSinglePull` 的特殊模式）
- **不影响保底和井计数器**
- 如果10次中没有5星或6星，需要重新生成（或者强制修正最后一次结果为5星）

### 3. 单池模拟逻辑 (simulateBanner)

```typescript
function simulateBanner(
  bannerIndex: number,
  pullBudget: number,
  initialGlobalState: GlobalGachaState,
  strategy: Strategy,
  rng: RNG
): BannerOutcome
```

**流程**:
1. 初始化卡池状态: `BannerState { sparkCounter: 0, pullsInBanner: 0, ... }`
2. 循环抽卡，直到达成目标或预算用完:
   - 执行 `simulateSinglePull`
   - 更新 `pullsInBanner++`
   - 检查是否触发加急招募（`pullsInBanner === 30`）
   - 检查是否触发寻访情报书（`pullsInBanner === 60`）
   - 如果获得UP角色，可以提前停止（根据策略）
3. 返回本池结果和更新后的状态

---

## 实现顺序建议

### 阶段 1: 基础抽卡引擎 (核心优先)

**目标**: 实现最小可验证的抽卡逻辑

**任务**:
1. 创建 `src/sim/gacha-core.ts`
2. 实现 `simulateSinglePull` (不含加急/情报书)
3. 实现基础的保底和井逻辑
4. 编写单元测试验证:
   - 65抽触发保底（概率提升）
   - 120抽触发井（强制UP）
   - 获得6星后保底计数器归零

**验证方式**:
```typescript
// 测试用例示例
test('pity triggers after 65 pulls without 6-star', () => {
  // 模拟65次未出6星，验证第66次概率是否开始递增
});

test('hard pity guarantees 6-star at 80th pull', () => {
  // 模拟80抽未出6星，验证第80抽是否100%给6星
});

test('spark triggers at 120th pull', () => {
  // 模拟119抽未出UP，验证第120抽是否强制给UP
});
```

### 阶段 2: 加急招募和寻访情报书

**任务**:
1. 实现 `simulateFastTrack`
2. 在 `simulateBanner` 中集成加急/情报书触发逻辑
3. 验证加急招募不影响计数器

### 阶段 3: 完整单池模拟

**任务**:
1. 完善 `simulateBanner` 的完整流程
2. 处理跨池继承（全局状态传递）
3. 测试多池场景

### 阶段 4: 策略层实现

**任务**:
1. 创建 `src/sim/strategies.ts`
2. 实现3个基础策略:
   - 策略1: 平均分配抽数
   - 策略2: 只抽目标池
   - 策略3: 每池抽到UP或井为止

### 阶段 5: 集成到主模拟引擎

**任务**:
1. 重构 `src/sim/engine.ts` 的 `runSimulation`
2. 替换占位逻辑为真实卡池模拟
3. 处理多个trial的统计汇总

### 阶段 6: UI适配

**任务**:
1. 更新输入表单（策略选择、参数配置）
2. 更新结果展示（武库配额、保底/井触发次数等）
3. 添加可视化（分布图、累计概率等）

---

## 关键实现注意事项

### 概率计算精度
- 使用浮点数时注意精度问题
- 建议使用 `>` 而非 `>=` 进行区间判断

### 状态不可变性
- 每次状态更新应返回新对象，避免意外修改
- 便于调试和追踪状态变化

### RNG的正确使用
- 每次抽卡应该使用独立的随机数
- 保证seed可复现性

### 加急招募的特殊处理
- 必须确保不影响主线计数器
- "必得5星+"的实现方式需要注意性能（避免无限循环）

### 寻访情报书的延迟生效
- 情报书的10连是给下个池的，需要妥善传递这个"待用的10连"

---

## 测试策略

### 单元测试
- 测试单次抽卡的所有分支逻辑
- 测试边界条件（第65抽、第120抽等）

### 集成测试
- 测试多池场景下的状态继承
- 测试加急/情报书的触发和效果

### 概率验证测试
- 运行大量trial，验证实际概率接近理论概率
- 例如: 10000次抽卡，6星出现次数应接近80次（误差在合理范围内）

---

# 武器池机制 (Weapon Banner System)

## 核心规则总结

### 1. 卡池周期与并存

- **周期**: 每个武器池延续3个角色卡池后结束
- **并存情况**: 除首个武器池外，可能出现2-3个武器池同时开放
- **模拟重点**: 仅关注6星武器，特别是UP专武的获取

### 2. 基础概率与武器构成

- **6星基础概率**: 4% (0.04)
  - UP专武: 1% (0.01) - 占6星的25%
  - 非UP武器: 3% (0.03) - 共8把6星武器，7把非UP均分
- **5星概率**: 15% (0.15)
- **4星概率**: 81% (0.81)

### 3. 申领机制 (Claim System)

- **形式**: 仅支持10连抽（称为"一次申领"）
- **消耗**: 1980 武库配额/次
- **保证**: 每次申领必得至少1个5星或以上武器

### 4. 保底机制 (Weapon Pity System)

- **触发条件**: 连续3次申领未获得6星武器
- **效果**: 第4次申领**保证获得至少1个6星武器**
  - 前9抽正常随机抽取
  - 如果前9抽已出现6星，则保底已满足，第10抽正常抽取
  - 如果前9抽未出现6星，则第10抽强制给6星（按25% UP概率）
- **重置条件**: 获得任意6星武器后，计数器归零
- **继承规则**: **不跨池继承**（每个武器池独立计数）
- **可重复**: 同一武器池内可多次触发

### 5. 井机制 (Weapon Spark System)

- **触发条件**: 连续7次申领未获得UP专武
- **效果**: 第8次申领**保证获得UP专武**
  - 前9抽正常随机抽取
  - 如果前9抽已出现UP专武，则井已满足，第10抽正常抽取
  - 如果前9抽未出现UP专武，则第10抽强制给UP专武
- **继承规则**: **不跨池继承**（每个武器池独立计数）
- **限制**: 每个武器池仅生效一次
- **优先级**: 井触发优先于保底触发（井满足后保底也满足）

### 6. 武库配额消耗

- **获取来源**: 角色池抽卡（6星+2000, 5星+200, 4星+20）
- **消耗用途**: 武器池申领（1980/次）
- **跨池共享**: 所有武器池共享同一武库配额余额

---

## 武器池数据模型设计

### 核心类型定义

```typescript
// ============ 武器池状态（每个武器池独立） ============
export type WeaponBannerState = {
  weaponPityCounter: number;      // 保底计数器（连续未出6星的申领次数，0-3）
  weaponSparkCounter: number;     // 井计数器（连续未出UP的申领次数，0-7）
  gotRateUpInThisBanner: boolean; // 当前武器池是否已获得UP专武（井仅生效一次）
  claimsInBanner: number;         // 当前武器池累计申领次数（统计用）
};

// ============ 单次武器抽取结果 ============
export type WeaponPullResult = {
  rarity: 6 | 5 | 4;
  isRateUp: boolean;              // 仅当rarity=6时有意义，表示是否为UP专武
  triggeredPity: boolean;         // 是否触发了保底（第4次申领必得6星）
  triggeredSpark: boolean;        // 是否触发了井（第8次申领必得UP）
};

// ============ 一次申领结果（10连） ============
export type WeaponClaimResult = {
  pullResults: WeaponPullResult[]; // 10次抽取结果
  gotSixStar: boolean;             // 是否获得6星武器
  gotRateUp: boolean;              // 是否获得UP专武
  triggeredPity: boolean;          // 本次申领是否触发保底
  triggeredSpark: boolean;         // 本次申领是否触发井
};

// ============ 武器池模拟结果 ============
export type WeaponBannerOutcome = {
  gotRateUp: boolean;              // 是否获得了UP专武
  claimsSpent: number;             // 消耗的申领次数
  arsenalSpent: number;            // 消耗的武库配额（= claimsSpent * 1980）
  claimResults: WeaponClaimResult[]; // 所有申领的详细结果
  finalWeaponBannerState: WeaponBannerState; // 最终武器池状态
  finalArsenalPoints: number;      // 剩余武库配额
};
```

---

## 武器池核心算法设计

### 1. 单次武器抽取逻辑 (simulateWeaponSinglePull)

```typescript
function simulateWeaponSinglePull(
  weaponBannerState: WeaponBannerState,
  rng: RNG,
  isLastPullOfClaim: boolean,     // 是否为本次申领的第10抽
  mustGuarantee: boolean,         // 是否必须保底/井触发
  guaranteeType: 'spark' | 'pity' | null // 触发类型
): { result: WeaponPullResult; newWeaponBannerState: WeaponBannerState }
```

**实现步骤**:

1. **判断是否触发井**（仅在第10抽且满足条件）
   - 如果 `isLastPullOfClaim && guaranteeType === 'spark'`
   - 强制返回6星UP专武

2. **判断是否触发保底**（仅在第10抽且满足条件）
   - 如果 `isLastPullOfClaim && guaranteeType === 'pity'`
   - 强制返回6星武器（按25% UP概率抽取）

3. **正常抽取流程**
   - 生成随机数 r ∈ [0, 1)
   - r < 0.04 → 6星
   - r < 0.19 → 5星
   - 否则 → 4星

4. **如果是6星，判断是否UP**
   - 生成随机数 r2 ∈ [0, 1)
   - r2 < 0.25 → UP专武
   - 否则 → 非UP武器

5. **更新状态**
   - 如果获得6星: `weaponPityCounter` 归零
   - 如果获得UP: `gotRateUpInThisBanner = true`

### 2. 一次申领逻辑 (simulateWeaponClaim)

```typescript
function simulateWeaponClaim(
  weaponBannerState: WeaponBannerState,
  rng: RNG
): { result: WeaponClaimResult; newWeaponBannerState: WeaponBannerState }
```

**要点**:

1. **判断本次申领是否需要保底/井**
   - 井优先级高于保底
   - 如果 `weaponSparkCounter === 7 && !gotRateUpInThisBanner`: 需要井保证
   - 否则如果 `weaponPityCounter === 3`: 需要保底保证

2. **执行前9次抽取**
   - 所有9次抽取都按正常概率进行

3. **第10次抽取**
   - **井保证**：如果前9抽未出现UP专武，第10抽强制给UP
   - **保底保证**：如果前9抽未出现6星，第10抽强制给6星（按25% UP概率）
   - **正常抽取**：如果无需保底/井，或前9抽已满足条件，第10抽正常随机

4. **保证至少1个5星+**
   - 如果10抽都没有5星+（极端情况），强制修正最后一抽为5星

5. **更新计数器**
   - 如果获得6星: `weaponPityCounter = 0`，否则 `weaponPityCounter++`
   - 如果获得UP: `weaponSparkCounter = 0`，否则 `weaponSparkCounter++`
   - `claimsInBanner++`

### 3. 单个武器池模拟逻辑 (simulateWeaponBanner)

```typescript
function simulateWeaponBanner(
  weaponBannerId: string,
  arsenalBudget: number,
  strategy: WeaponStrategy,
  rng: RNG
): WeaponBannerOutcome
```

**流程**:

1. 初始化武器池状态: `WeaponBannerState { weaponPityCounter: 0, ... }`
2. 循环申领，直到达成目标或预算不足（< 1980）:
   - 执行 `simulateWeaponClaim`
   - 扣除1980武库配额
   - 如果获得UP专武，根据策略决定是否继续
3. 返回本池结果和剩余配额

---

## 武器池实现顺序建议

### 阶段 1: 基础武器抽取引擎

**任务**:
1. 创建 `src/sim/weapon-gacha-core.ts`
2. 实现 `simulateWeaponSinglePull`
3. 实现 `simulateWeaponClaim`（单次申领逻辑）
4. 编写单元测试验证:
   - 连续3次申领未出6星，第4次触发保底
   - 连续7次申领未出UP，第8次触发井
   - 井优先级高于保底
   - 每次申领必得5星+

### 阶段 2: 完整武器池模拟

**任务**:
1. 实现 `simulateWeaponBanner`（单个武器池完整流程）
2. 处理武库配额的消耗和余额管理
3. 测试多次申领场景

### 阶段 3: 武器池策略层

**任务**:
1. 扩展 `src/sim/strategies.ts`，添加武器池策略
2. 实现基础策略:
   - 策略A: 固定申领次数
   - 策略B: 抽到UP为止
   - 策略C: 最多到井为止

### 阶段 4: 集成到主模拟引擎

**任务**:
1. 修改 `src/sim/engine.ts`，整合角色池+武器池
2. 处理武器池的开放时间（延续3个角色卡池）
3. 处理多个武器池并存的情况

### 阶段 5: UI适配

**任务**:
1. 添加武器池输入表单（目标武器池、申领策略）
2. 更新结果展示（武器获取情况、配额消耗）
3. 添加武器池相关的统计和可视化

---

## 关键实现注意事项

### 井与保底的优先级
- 必须确保井的判断在保底之前
- 井满足时，保底也必然满足（因为UP必定是6星）

### 保底/井的"保证"机制
- **关键理解**：保底/井是"保证获得"而非"强制在第10抽出现"
- 前9抽正常随机，如果已经出现目标，则保底/井已满足
- 仅当前9抽未出现目标时，第10抽才强制给出
- 这样设计使得概率更自然，避免浪费随机结果

### 每次申领的5星+保证
- 实现方式：先正常抽10次，检查是否有5星+，没有则修正最后一次
- 保底/井触发时必然有6星，所以5星+保证自动满足
- 避免无限循环重抽

### 武器池的独立性
- 每个武器池的保底/井计数器完全独立
- 切换武器池时不继承任何状态（除武库配额外）

### 武库配额的全局性
- 所有武器池共享同一配额余额
- 需要在全局状态中维护 `arsenalPoints`

---

## 武器池测试策略

### 单元测试
- 测试第4次申领必得6星（前9抽未出时，第10抽强制给）
- 测试第4次申领前9抽自然出现6星的情况（保底已满足，不触发）
- 测试第8次申领必得UP（前9抽未出时，第10抽强制给）
- 测试第8次申领前9抽自然出现UP的情况（井已满足，不触发）
- 测试井优先级高于保底
- 测试每次申领必得5星+
- 测试状态不跨池继承

### 集成测试
- 测试角色池积累配额 → 武器池消耗配额的完整流程
- 测试多个武器池并存时的独立性
- 测试武器池开放时间（延续3个角色卡池）

### 概率验证测试
- 运行大量申领，验证实际概率接近理论概率
- 例如: 1000次申领，6星出现次数应接近400次（4% × 10次 × 1000申领）

---

## 后续扩展方向

1. **角色池与武器池联合规划**: 在有限资源下优化角色+武器的获取顺序
2. **多目标规划**: 支持用户指定多个想要的UP角色和专武
3. **策略优化**: 基于遗传算法或强化学习优化跨池抽卡策略
4. **历史数据导入**: 允许用户导入已有的抽卡记录，继承保底状态和配额余额
