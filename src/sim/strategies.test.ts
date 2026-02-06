/**
 * 策略系统测试
 *
 * 测试策略配置、附加策略判断逻辑
 */

import {
  BASE_STRATEGIES,
  ADDON_STRATEGIES,
  BANNER_BONUS_PULLS,
  createDefaultStrategyConfig,
  getStrategyName,
  shouldTriggerAddonA2,
  shouldTriggerAddonA3,
  getAddonA2PullCost,
  getAddonA3PullCost,
  canEnterCharacterBanner,
  canEnterWeaponBanner,
} from './strategies';

// ============ 测试工具函数 ============

function testPass(testName: string) {
  console.log(`  ✓ ${testName}`);
}

function testFail(testName: string, expected: any, actual: any) {
  console.log(`  ✗ ${testName}`);
  console.log(`    期望: ${JSON.stringify(expected)}`);
  console.log(`    实际: ${JSON.stringify(actual)}`);
}

// ============ 测试用例 ============

console.log('=== 开始测试策略系统 ===\n');

// 测试1: 基础策略配置
console.log('测试1: 基础策略配置');
{
  const s1 = BASE_STRATEGIES.S1;
  const s2 = BASE_STRATEGIES.S2;

  if (s1.characterBannerThreshold === 80) {
    testPass('S1 门槛为 80');
  } else {
    testFail('S1 门槛为 80', 80, s1.characterBannerThreshold);
  }

  if (s2.characterBannerThreshold === 120) {
    testPass('S2 门槛为 120');
  } else {
    testFail('S2 门槛为 120', 120, s2.characterBannerThreshold);
  }

  if (s1.weaponBannerThreshold === 15840) {
    testPass('武器池门槛为 15840');
  } else {
    testFail('武器池门槛为 15840', 15840, s1.weaponBannerThreshold);
  }
}

// 测试2: 创建默认策略配置
console.log('\n测试2: 创建默认策略配置');
{
  const config = createDefaultStrategyConfig('S1');

  if (config.baseStrategy === 'S1') {
    testPass('基础策略为 S1');
  } else {
    testFail('基础策略为 S1', 'S1', config.baseStrategy);
  }

  if (config.addonStrategies.A1_alwaysUseIntelReport === true) {
    testPass('A1 默认开启');
  } else {
    testFail('A1 默认开启', true, config.addonStrategies.A1_alwaysUseIntelReport);
  }

  if (config.addonStrategies.A2_pullForFastTrack === false) {
    testPass('A2 默认关闭');
  } else {
    testFail('A2 默认关闭', false, config.addonStrategies.A2_pullForFastTrack);
  }

  if (config.addonStrategies.A3_pullForIntelReport === false) {
    testPass('A3 默认关闭');
  } else {
    testFail('A3 默认关闭', false, config.addonStrategies.A3_pullForIntelReport);
  }
}

// 测试3: 策略名称获取
console.log('\n测试3: 策略名称获取');
{
  const config1 = createDefaultStrategyConfig('S1');
  const name1 = getStrategyName(config1);
  console.log(`  保底派 + [A1]: ${name1}`);

  const config2 = createDefaultStrategyConfig('S2');
  config2.addonStrategies.A2_pullForFastTrack = true;
  config2.addonStrategies.A3_pullForIntelReport = true;
  const name2 = getStrategyName(config2);
  console.log(`  井派 + [A1, A2, A3]: ${name2}`);
}

// 测试4: 基础策略进入条件
console.log('\n测试4: 基础策略进入条件');
{
  // S1: (currentPulls + 10) > 80
  const canEnter1 = canEnterCharacterBanner(70, 80); // 70 + 10 = 80, 不满足 >
  const canEnter2 = canEnterCharacterBanner(71, 80); // 71 + 10 = 81, 满足 >

  if (!canEnter1) {
    testPass('70抽不能进入S1（70+10=80不满足>80）');
  } else {
    testFail('70抽不能进入S1', false, canEnter1);
  }

  if (canEnter2) {
    testPass('71抽可以进入S1（71+10=81满足>80）');
  } else {
    testFail('71抽可以进入S1', true, canEnter2);
  }

  // S2: (currentPulls + 10) > 120
  const canEnter3 = canEnterCharacterBanner(110, 120); // 110 + 10 = 120, 不满足 >
  const canEnter4 = canEnterCharacterBanner(111, 120); // 111 + 10 = 121, 满足 >

  if (!canEnter3) {
    testPass('110抽不能进入S2（110+10=120不满足>120）');
  } else {
    testFail('110抽不能进入S2', false, canEnter3);
  }

  if (canEnter4) {
    testPass('111抽可以进入S2（111+10=121满足>120）');
  } else {
    testFail('111抽可以进入S2', true, canEnter4);
  }
}

// 测试5: 附加策略二（凑加急）判断
console.log('\n测试5: 附加策略二判断逻辑');
{
  // 场景1：保底派 + 有情报书
  // currentPulls=75, pullsNextVersion=60, threshold=80, hasIntelReport=true
  // surplus = 75 + 10 + 10 + 60 - 80 = 75 > 10 ✓
  const trigger1 = shouldTriggerAddonA2(75, 60, 80, true);
  if (trigger1) {
    testPass('场景1触发A2（保底派+有情报书，盈余75>10）');
  } else {
    testFail('场景1触发A2', true, trigger1);
  }

  // 场景2：保底派 + 无情报书
  // currentPulls=60, pullsNextVersion=60, threshold=80, hasIntelReport=false
  // surplus = 60 + 10 + 0 + 60 - 80 = 50 > 20 ✓
  const trigger2 = shouldTriggerAddonA2(60, 60, 80, false);
  if (trigger2) {
    testPass('场景2触发A2（保底派+无情报书，盈余50>20）');
  } else {
    testFail('场景2触发A2', true, trigger2);
  }

  // 场景3：当前已满足基础策略，不触发
  // currentPulls=100, pullsNextVersion=60, threshold=80, hasIntelReport=false
  // currentPulls + 10 = 110 > 80，不触发
  const trigger3 = shouldTriggerAddonA2(100, 60, 80, false);
  if (!trigger3) {
    testPass('场景3不触发A2（当前已满足基础策略）');
  } else {
    testFail('场景3不触发A2', false, trigger3);
  }

  // 场景4：盈余不足，不触发
  // currentPulls=50, pullsNextVersion=10, threshold=80, hasIntelReport=false
  // surplus = 50 + 10 + 0 + 10 - 80 = -10 <= 20，不触发
  const trigger4 = shouldTriggerAddonA2(50, 10, 80, false);
  if (!trigger4) {
    testPass('场景4不触发A2（盈余不足）');
  } else {
    testFail('场景4不触发A2', false, trigger4);
  }
}

// 测试6: 附加策略二消耗计算
console.log('\n测试6: 附加策略二消耗计算');
{
  const cost1 = getAddonA2PullCost(true);  // 有情报书：10抽
  const cost2 = getAddonA2PullCost(false); // 无情报书：20抽

  if (cost1 === 10) {
    testPass('有情报书时A2消耗10抽');
  } else {
    testFail('有情报书时A2消耗10抽', 10, cost1);
  }

  if (cost2 === 20) {
    testPass('无情报书时A2消耗20抽');
  } else {
    testFail('无情报书时A2消耗20抽', 20, cost2);
  }
}

// 测试7: 附加策略三（凑情报书）判断
console.log('\n测试7: 附加策略三判断逻辑');
{
  // 场景1：保底派 + 有情报书
  // currentPulls=60, pullsNextVersion=100, threshold=80, hasIntelReport=true
  // surplus = 60 + 10 + 10 + 100 - 80 = 100 > 40 ✓
  const trigger1 = shouldTriggerAddonA3(60, 100, 80, true);
  if (trigger1) {
    testPass('场景1触发A3（保底派+有情报书，盈余100>40）');
  } else {
    testFail('场景1触发A3', true, trigger1);
  }

  // 场景2：井派 + 无情报书
  // currentPulls=80, pullsNextVersion=150, threshold=120, hasIntelReport=false
  // surplus = 80 + 10 + 0 + 150 - 120 = 120 > 50 ✓
  const trigger2 = shouldTriggerAddonA3(80, 150, 120, false);
  if (trigger2) {
    testPass('场景2触发A3（井派+无情报书，盈余120>50）');
  } else {
    testFail('场景2触发A3', true, trigger2);
  }

  // 场景3：盈余不足，不触发
  // currentPulls=60, pullsNextVersion=30, threshold=80, hasIntelReport=false
  // surplus = 60 + 10 + 0 + 30 - 80 = 20 <= 50，不触发
  const trigger3 = shouldTriggerAddonA3(60, 30, 80, false);
  if (!trigger3) {
    testPass('场景3不触发A3（盈余不足）');
  } else {
    testFail('场景3不触发A3', false, trigger3);
  }
}

// 测试8: 附加策略三消耗计算
console.log('\n测试8: 附加策略三消耗计算');
{
  const cost1 = getAddonA3PullCost(true);  // 有情报书：40抽
  const cost2 = getAddonA3PullCost(false); // 无情报书：50抽

  if (cost1 === 40) {
    testPass('有情报书时A3消耗40抽');
  } else {
    testFail('有情报书时A3消耗40抽', 40, cost1);
  }

  if (cost2 === 50) {
    testPass('无情报书时A3消耗50抽');
  } else {
    testFail('无情报书时A3消耗50抽', 50, cost2);
  }
}

// 测试9: 武器池进入条件
console.log('\n测试9: 武器池进入条件');
{
  // 有角色 + 足够配额
  const canEnter1 = canEnterWeaponBanner(15840, true, 15840);
  if (canEnter1) {
    testPass('有角色+15840配额可以进入武器池');
  } else {
    testFail('有角色+15840配额可以进入武器池', true, canEnter1);
  }

  // 有角色 + 配额不足
  const canEnter2 = canEnterWeaponBanner(15839, true, 15840);
  if (!canEnter2) {
    testPass('有角色+15839配额不能进入武器池');
  } else {
    testFail('有角色+15839配额不能进入武器池', false, canEnter2);
  }

  // 无角色 + 足够配额
  const canEnter3 = canEnterWeaponBanner(15840, false, 15840);
  if (!canEnter3) {
    testPass('无角色+15840配额不能进入武器池');
  } else {
    testFail('无角色+15840配额不能进入武器池', false, canEnter3);
  }
}

console.log('\n=== 测试完成 ===');
