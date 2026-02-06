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

// ============ 测试用例 ============

describe('策略系统测试', () => {
  describe('基础策略配置', () => {
    it('S1 门槛为 80', () => {
      const s1 = BASE_STRATEGIES.S1;
      expect(s1.characterBannerThreshold).toBe(80);
    });

    it('S2 门槛为 120', () => {
      const s2 = BASE_STRATEGIES.S2;
      expect(s2.characterBannerThreshold).toBe(120);
    });

    it('武器池门槛为 15840', () => {
      const s1 = BASE_STRATEGIES.S1;
      expect(s1.weaponBannerThreshold).toBe(15840);
    });
  });

  describe('创建默认策略配置', () => {
    it('基础策略为 S1', () => {
      const config = createDefaultStrategyConfig('S1');
      expect(config.baseStrategy).toBe('S1');
    });

    it('A1 默认开启', () => {
      const config = createDefaultStrategyConfig('S1');
      expect(config.addonStrategies.A1_alwaysUseIntelReport).toBe(true);
    });

    it('A2 默认关闭', () => {
      const config = createDefaultStrategyConfig('S1');
      expect(config.addonStrategies.A2_pullForFastTrack).toBe(false);
    });

    it('A3 默认关闭', () => {
      const config = createDefaultStrategyConfig('S1');
      expect(config.addonStrategies.A3_pullForIntelReport).toBe(false);
    });
  });

  describe('策略名称获取', () => {
    it('保底派 + [A1]', () => {
      const config1 = createDefaultStrategyConfig('S1');
      const name1 = getStrategyName(config1);
      expect(name1).toContain('保底派');
      expect(name1).toContain('A1');
    });

    it('井派 + [A1, A2, A3]', () => {
      const config2 = createDefaultStrategyConfig('S2');
      config2.addonStrategies.A2_pullForFastTrack = true;
      config2.addonStrategies.A3_pullForIntelReport = true;
      const name2 = getStrategyName(config2);
      expect(name2).toContain('井派');
      expect(name2).toContain('A1');
      expect(name2).toContain('A2');
      expect(name2).toContain('A3');
    });
  });

  describe('基础策略进入条件', () => {
    it('70抽不能进入S1（70+10=80不满足>80）', () => {
      const canEnter1 = canEnterCharacterBanner(70, 80);
      expect(canEnter1).toBe(false);
    });

    it('71抽可以进入S1（71+10=81满足>80）', () => {
      const canEnter2 = canEnterCharacterBanner(71, 80);
      expect(canEnter2).toBe(true);
    });

    it('110抽不能进入S2（110+10=120不满足>120）', () => {
      const canEnter3 = canEnterCharacterBanner(110, 120);
      expect(canEnter3).toBe(false);
    });

    it('111抽可以进入S2（111+10=121满足>120）', () => {
      const canEnter4 = canEnterCharacterBanner(111, 120);
      expect(canEnter4).toBe(true);
    });
  });

  describe('附加策略二判断逻辑', () => {
    it('场景1触发A2（保底派+有情报书，盈余75>10）', () => {
      // currentPulls=75, pullsNextVersion=60, threshold=80, hasIntelReport=true
      // surplus = 75 + 10 + 10 + 60 - 80 = 75 > 10
      const trigger1 = shouldTriggerAddonA2(75, 60, 80, true);
      expect(trigger1).toBe(true);
    });

    it('场景2触发A2（保底派+无情报书，盈余50>20）', () => {
      // currentPulls=60, pullsNextVersion=60, threshold=80, hasIntelReport=false
      // surplus = 60 + 10 + 0 + 60 - 80 = 50 > 20
      const trigger2 = shouldTriggerAddonA2(60, 60, 80, false);
      expect(trigger2).toBe(true);
    });

    it('场景3不触发A2（当前已满足基础策略）', () => {
      // currentPulls=100, pullsNextVersion=60, threshold=80, hasIntelReport=false
      // currentPulls + 10 = 110 > 80，不触发
      const trigger3 = shouldTriggerAddonA2(100, 60, 80, false);
      expect(trigger3).toBe(false);
    });

    it('场景4不触发A2（盈余不足）', () => {
      // currentPulls=50, pullsNextVersion=10, threshold=80, hasIntelReport=false
      // surplus = 50 + 10 + 0 + 10 - 80 = -10 <= 20，不触发
      const trigger4 = shouldTriggerAddonA2(50, 10, 80, false);
      expect(trigger4).toBe(false);
    });
  });

  describe('附加策略二消耗计算', () => {
    it('有情报书时A2消耗10抽', () => {
      const cost1 = getAddonA2PullCost(true);
      expect(cost1).toBe(10);
    });

    it('无情报书时A2消耗20抽', () => {
      const cost2 = getAddonA2PullCost(false);
      expect(cost2).toBe(20);
    });
  });

  describe('附加策略三判断逻辑', () => {
    it('场景1触发A3（保底派+有情报书，盈余100>40）', () => {
      // currentPulls=60, pullsNextVersion=100, threshold=80, hasIntelReport=true
      // surplus = 60 + 10 + 10 + 100 - 80 = 100 > 40
      const trigger1 = shouldTriggerAddonA3(60, 100, 80, true);
      expect(trigger1).toBe(true);
    });

    it('场景2触发A3（井派+无情报书，盈余120>50）', () => {
      // currentPulls=80, pullsNextVersion=150, threshold=120, hasIntelReport=false
      // surplus = 80 + 10 + 0 + 150 - 120 = 120 > 50
      const trigger2 = shouldTriggerAddonA3(80, 150, 120, false);
      expect(trigger2).toBe(true);
    });

    it('场景3不触发A3（盈余不足）', () => {
      // currentPulls=60, pullsNextVersion=30, threshold=80, hasIntelReport=false
      // surplus = 60 + 10 + 0 + 30 - 80 = 20 <= 50，不触发
      const trigger3 = shouldTriggerAddonA3(60, 30, 80, false);
      expect(trigger3).toBe(false);
    });
  });

  describe('附加策略三消耗计算', () => {
    it('有情报书时A3消耗40抽', () => {
      const cost1 = getAddonA3PullCost(true);
      expect(cost1).toBe(40);
    });

    it('无情报书时A3消耗50抽', () => {
      const cost2 = getAddonA3PullCost(false);
      expect(cost2).toBe(50);
    });
  });

  describe('武器池进入条件', () => {
    it('有角色+15840配额可以进入武器池', () => {
      const canEnter1 = canEnterWeaponBanner(15840, true, 15840);
      expect(canEnter1).toBe(true);
    });

    it('有角色+15839配额不能进入武器池', () => {
      const canEnter2 = canEnterWeaponBanner(15839, true, 15840);
      expect(canEnter2).toBe(false);
    });

    it('无角色+15840配额不能进入武器池', () => {
      const canEnter3 = canEnterWeaponBanner(15840, false, 15840);
      expect(canEnter3).toBe(false);
    });
  });
});
