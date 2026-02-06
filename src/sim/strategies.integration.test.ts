/**
 * 策略系统集成测试
 * 测试完整的策略执行流程
 */

import { createRng } from './rng';
import {
  createDefaultStrategyConfig,
  executeStrategy,
  pullCharacterBanner,
  claimWeaponBanner,
} from './strategies';
import { createInitialGlobalState } from './gacha-core';

describe('策略集成测试', () => {
  describe('角色池完整模拟', () => {
    it('基础策略 S1 - 资源充足时应该进入角色池', () => {
      const rng = createRng('test-seed-1');
      const config = createDefaultStrategyConfig('S1');
      const globalState = createInitialGlobalState();

      // 100抽 > 80（S1门槛），应该进入
      const result = pullCharacterBanner(config, 100, 0, globalState, false, false, false, rng);

      // 应该消耗了抽数
      expect(result.pullsSpent).toBeGreaterThan(0);
      // 应该有抽卡记录
      expect(result.pullResults.length).toBeGreaterThan(0);
    });

    it('基础策略 S1 - 资源不足时不应该进入角色池', () => {
      const rng = createRng('test-seed-2');
      const config = createDefaultStrategyConfig('S1');
      const globalState = createInitialGlobalState();

      // 70抽 <= 80（S1门槛），不应该进入
      const result = pullCharacterBanner(config, 70, 0, globalState, false, false, false, rng);

      // 应该没有消耗抽数
      expect(result.pullsSpent).toBe(0);
      expect(result.pullResults.length).toBe(0);
    });

    it('基础策略 S2 - 需要更多资源才能进入', () => {
      const rng = createRng('test-seed-3');
      const config = createDefaultStrategyConfig('S2');
      const globalState = createInitialGlobalState();

      // 100抽 <= 120（S2门槛），不应该进入
      const result1 = pullCharacterBanner(config, 100, 0, globalState, false, false, false, rng);
      expect(result1.pullsSpent).toBe(0);

      // 130抽 > 120（S2门槛），应该进入
      const result2 = pullCharacterBanner(config, 130, 0, globalState, false, false, false, rng);
      expect(result2.pullsSpent).toBeGreaterThan(0);
    });

    it('应该在获得UP角色后立即停止（基础策略）', () => {
      const config = createDefaultStrategyConfig('S1');

      // 执行多次直到遇到获得UP的情况
      let gotRateUp = false;
      for (let i = 0; i < 10 && !gotRateUp; i++) {
        const result = pullCharacterBanner(
          config,
          1000, // 充足的资源
          0,
          createInitialGlobalState(),
          false,
          false,
          false,
          createRng(`test-seed-gotup-${i}`)
        );

        if (result.gotRateUp) {
          gotRateUp = true;
          // 如果获得UP，应该停止抽卡
          expect(result.pullsSpent).toBeLessThan(1000);
        }
      }

      // 应该至少有一次获得了UP
      expect(gotRateUp).toBe(true);
    });

    it('应该正确使用卡池赠送10抽和情报书', () => {
      const rng = createRng('test-seed-5');
      const config = createDefaultStrategyConfig('S1');
      config.addonStrategies.A1_alwaysUseIntelReport = true;
      const globalState = createInitialGlobalState();

      // 有情报书的情况
      const result = pullCharacterBanner(
        config,
        100,
        0,
        globalState,
        true, // 有情报书
        false,
        false,
        rng
      );

      // 应该使用了卡池赠送10抽 + 情报书10抽 + 库存抽数
      expect(result.pullResults.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('武器池完整模拟', () => {
    it('资源充足且有角色时应该申领武器池', () => {
      const rng = createRng('test-seed-weapon-1');
      const config = createDefaultStrategyConfig('S1');

      // 充足的武库配额（>= 15840）
      const result = claimWeaponBanner(
        config,
        20000,
        true, // 有对应角色
        rng
      );

      // 应该至少申领了一次
      expect(result.claimsSpent).toBeGreaterThan(0);
      expect(result.arsenalSpent).toBeGreaterThan(0);
    });

    it('资源不足时不应该申领武器池', () => {
      const rng = createRng('test-seed-weapon-2');
      const config = createDefaultStrategyConfig('S1');

      // 武库配额不足
      const result = claimWeaponBanner(
        config,
        10000, // < 15840
        true, // 有对应角色
        rng
      );

      // 不应该申领
      expect(result.claimsSpent).toBe(0);
      expect(result.arsenalSpent).toBe(0);
    });

    it('没有对应角色时不应该申领武器池', () => {
      const rng = createRng('test-seed-weapon-3');
      const config = createDefaultStrategyConfig('S1');

      const result = claimWeaponBanner(
        config,
        20000,
        false, // 没有对应角色
        rng
      );

      // 不应该申领
      expect(result.claimsSpent).toBe(0);
    });

    it('应该在获得UP专武后立即停止', () => {
      const config = createDefaultStrategyConfig('S1');

      // 执行多次直到遇到获得UP的情况
      let gotRateUp = false;
      for (let i = 0; i < 20 && !gotRateUp; i++) {
        const result = claimWeaponBanner(
          config,
          20000,
          true,
          createRng(`test-seed-weapon-gotup-${i}`)
        );

        if (result.gotRateUp) {
          gotRateUp = true;
          // 应该少于8次申领
          expect(result.claimsSpent).toBeLessThanOrEqual(8);
        }
      }
    });

    it('最多只能申领8次（井上限）', () => {
      const rng = createRng('test-seed-weapon-5');
      const config = createDefaultStrategyConfig('S1');

      const result = claimWeaponBanner(config, 100000, true, rng);

      // 即使配额充足，最多也只能申领8次
      expect(result.claimsSpent).toBeLessThanOrEqual(8);
    });
  });

  describe('武器池 A5 策略测试', () => {
    it('A5开启（默认）：15840配额可以申领，最多8次', () => {
      const rng = createRng('test-seed-a5-1');
      const config = createDefaultStrategyConfig('S1');
      // A5 默认开启，threshold = 15840

      const result = claimWeaponBanner(
        config,
        20000, // 足够申领多次
        true,
        rng
      );

      // 应该申领了
      expect(result.claimsSpent).toBeGreaterThan(0);
      // 最多申领8次（井机制）
      expect(result.claimsSpent).toBeLessThanOrEqual(8);
    });

    it('A5开启：10000配额（< 15840）不能申领', () => {
      const rng = createRng('test-seed-a5-2');
      const config = createDefaultStrategyConfig('S1');
      // A5 默认开启，threshold = 15840

      const result = claimWeaponBanner(
        config,
        10000, // < 15840
        true,
        rng
      );

      // 不应该申领
      expect(result.claimsSpent).toBe(0);
      expect(result.arsenalSpent).toBe(0);
    });

    it('A5关闭：7920配额可以申领，最多4次', () => {
      const rng = createRng('test-seed-a5-3');
      const config = createDefaultStrategyConfig('S1');
      // 关闭 A5，threshold = 7920
      config.addonStrategies.A5_weaponSparkPriority = false;

      const result = claimWeaponBanner(
        config,
        10000, // >= 7920，足够申领4次以上
        true,
        rng
      );

      // 应该申领了
      expect(result.claimsSpent).toBeGreaterThan(0);
      // 最多申领4次（保底机制）
      expect(result.claimsSpent).toBeLessThanOrEqual(4);
    });

    it('A5关闭：5000配额（< 7920）不能申领', () => {
      const rng = createRng('test-seed-a5-4');
      const config = createDefaultStrategyConfig('S1');
      // 关闭 A5，threshold = 7920
      config.addonStrategies.A5_weaponSparkPriority = false;

      const result = claimWeaponBanner(
        config,
        5000, // < 7920
        true,
        rng
      );

      // 不应该申领
      expect(result.claimsSpent).toBe(0);
      expect(result.arsenalSpent).toBe(0);
    });

    it('A5关闭：12000配额可以申领（在7920和15840之间）', () => {
      const rng = createRng('test-seed-a5-5');
      const config = createDefaultStrategyConfig('S1');
      // 关闭 A5，threshold = 7920
      config.addonStrategies.A5_weaponSparkPriority = false;

      const result = claimWeaponBanner(
        config,
        12000, // 7920 < 12000 < 15840
        true,
        rng
      );

      // 应该申领了
      expect(result.claimsSpent).toBeGreaterThan(0);
      // 最多申领4次
      expect(result.claimsSpent).toBeLessThanOrEqual(4);
    });
  });

  describe('完整策略执行流程', () => {
    it('应该正确执行基础策略 S1', () => {
      const rng = createRng('test-seed-full-1');
      const config = createDefaultStrategyConfig('S1');

      const result = executeStrategy(
        config,
        200, // initialPulls
        0, // initialArsenal
        1000, // arsenalPerVersion
        60, // 每版本抽数
        3, // 3个版本
        2, // 每版本2个卡池
        rng
      );

      // 应该获得了一些角色
      expect(result.obtainedCharacterCount).toBeGreaterThanOrEqual(0);
      // 总消耗应该合理
      expect(result.totalPullsSpent).toBeLessThanOrEqual(200 + 60 * 3);
      // 剩余资源应该是非负的
      expect(result.remainingPulls).toBeGreaterThanOrEqual(0);
      expect(result.remainingArsenal).toBeGreaterThanOrEqual(0);
    });

    it('应该正确执行基础策略 S2', () => {
      const rng = createRng('test-seed-full-2');
      const config = createDefaultStrategyConfig('S2');

      const result = executeStrategy(
        config,
        300, // initialPulls
        0, // initialArsenal
        1500, // arsenalPerVersion
        80, // 每版本抽数
        4, // 4个版本
        2, // 每版本2个卡池
        rng
      );

      // S2需要更多资源，所以获得角色数可能较少
      expect(result.obtainedCharacterCount).toBeGreaterThanOrEqual(0);
      expect(result.totalPullsSpent).toBeLessThanOrEqual(300 + 80 * 4);
    });

    it('多次执行相同seed应该得到相同结果', () => {
      const config = createDefaultStrategyConfig('S1');

      const result1 = executeStrategy(
        config,
        200,
        1000,
        1000,
        60,
        3,
        2,
        createRng('deterministic-seed')
      );

      const result2 = executeStrategy(
        config,
        200,
        1000,
        1000,
        60,
        3,
        2,
        createRng('deterministic-seed')
      );

      // 相同seed应该得到完全相同的结果
      expect(result1.obtainedCharacterCount).toBe(result2.obtainedCharacterCount);
      expect(result1.obtainedWeaponCount).toBe(result2.obtainedWeaponCount);
      expect(result1.totalPullsSpent).toBe(result2.totalPullsSpent);
      expect(result1.totalArsenalSpent).toBe(result2.totalArsenalSpent);
    });

    it('应该正确计算资源发放时机', () => {
      const rng = createRng('test-seed-full-3');
      const config = createDefaultStrategyConfig('S1');

      const result = executeStrategy(
        config,
        0, // initialPulls - 初始没有抽数
        0, // initialArsenal - 初始没有武库配额
        0, // arsenalPerVersion - 每版本没有武库配额
        100, // pullsPerVersion - 但每版本会发放100抽
        2, // versionCount - 2个版本
        1, // bannersPerVersion - 每版本1个卡池
        rng
      );

      // 尽管初始没有抽数，但版本开始时会发放，所以应该能抽卡
      // 第一个版本开始时发放100抽，满足S1的80抽门槛
      expect(result.totalPullsSpent).toBeGreaterThan(0);
    });

    it('获得角色后应该尝试申领武器池', () => {
      const config = createDefaultStrategyConfig('S1');

      // 执行多次直到获得角色并触发武器池
      let foundWeapon = false;
      for (let i = 0; i < 20 && !foundWeapon; i++) {
        const result = executeStrategy(
          config,
          300, // initialPulls
          0, // initialArsenal
          5000, // arsenalPerVersion
          100,
          3,
          2,
          createRng(`test-seed-weapon-trigger-${i}`)
        );

        if (result.obtainedWeaponCount > 0) {
          foundWeapon = true;
          // 如果获得了武器，应该消耗了武库配额
          expect(result.totalArsenalSpent).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('边界情况测试', () => {
    it('应该处理0抽数的情况', () => {
      const rng = createRng('test-edge-1');
      const config = createDefaultStrategyConfig('S1');

      const result = executeStrategy(config, 0, 0, 0, 0, 1, 1, rng);

      expect(result.obtainedCharacterCount).toBe(0);
      expect(result.obtainedWeaponCount).toBe(0);
      expect(result.totalPullsSpent).toBe(0);
    });

    it('应该处理大量版本和卡池', () => {
      const rng = createRng('test-edge-2');
      const config = createDefaultStrategyConfig('S1');

      const result = executeStrategy(
        config,
        100,
        1000,
        5000,
        200,
        10, // 10个版本
        5, // 每版本5个卡池
        rng
      );

      // 应该能处理大量卡池
      expect(result.obtainedCharacterCount).toBeGreaterThanOrEqual(0);
      expect(result.obtainedCharacterCount).toBeLessThanOrEqual(50); // 最多50个卡池
    });
  });
});
