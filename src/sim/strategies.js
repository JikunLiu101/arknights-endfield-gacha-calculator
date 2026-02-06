"use strict";
/**
 * 明日方舟：终末地 抽卡策略系统
 *
 * 实现基础策略和附加策略的配置和执行逻辑
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADDON_STRATEGIES = exports.BASE_STRATEGIES = exports.WEAPON_SPARK_CLAIMS = exports.WEAPON_CLAIM_COST = exports.BANNER_BONUS_PULLS = void 0;
exports.createDefaultStrategyConfig = createDefaultStrategyConfig;
exports.getStrategyName = getStrategyName;
exports.shouldTriggerAddonA2 = shouldTriggerAddonA2;
exports.getAddonA2PullCost = getAddonA2PullCost;
exports.shouldTriggerAddonA3 = shouldTriggerAddonA3;
exports.getAddonA3PullCost = getAddonA3PullCost;
exports.canEnterCharacterBanner = canEnterCharacterBanner;
exports.canEnterWeaponBanner = canEnterWeaponBanner;
exports.pullCharacterBanner = pullCharacterBanner;
exports.claimWeaponBanner = claimWeaponBanner;
exports.executeStrategy = executeStrategy;
// ============ 常量配置 ============
/** 卡池赠送抽数 */
exports.BANNER_BONUS_PULLS = 10;
/** 武器池单次申领消耗 */
exports.WEAPON_CLAIM_COST = 1980;
/** 武器池井机制申领次数 */
exports.WEAPON_SPARK_CLAIMS = 8;
// ============ 基础策略配置 ============
/**
 * 基础策略配置
 */
exports.BASE_STRATEGIES = {
    S1: {
        id: 'S1',
        name: '保底派',
        characterBannerThreshold: 80,
        weaponBannerThreshold: exports.WEAPON_SPARK_CLAIMS * exports.WEAPON_CLAIM_COST, // 15840
    },
    S2: {
        id: 'S2',
        name: '井派',
        characterBannerThreshold: 120,
        weaponBannerThreshold: exports.WEAPON_SPARK_CLAIMS * exports.WEAPON_CLAIM_COST, // 15840
    },
};
/**
 * 附加策略配置
 */
exports.ADDON_STRATEGIES = {
    A1: {
        id: 'A1',
        name: '永远使用情报书和卡池赠送抽数',
        defaultEnabled: true,
    },
    A2: {
        id: 'A2',
        name: '凑加急寻访',
        defaultEnabled: false,
    },
    A3: {
        id: 'A3',
        name: '凑情报书',
        defaultEnabled: false,
    },
    A4: {
        id: 'A4',
        name: '最后版本用光所有资源',
        defaultEnabled: false,
    },
};
// ============ 策略配置工具函数 ============
/**
 * 创建默认策略配置
 */
function createDefaultStrategyConfig(baseStrategyId) {
    var baseStrategy = exports.BASE_STRATEGIES[baseStrategyId];
    return {
        baseStrategy: baseStrategyId,
        characterBannerThreshold: baseStrategy.characterBannerThreshold,
        weaponBannerThreshold: baseStrategy.weaponBannerThreshold,
        addonStrategies: {
            A1_alwaysUseIntelReport: exports.ADDON_STRATEGIES.A1.defaultEnabled,
            A2_pullForFastTrack: exports.ADDON_STRATEGIES.A2.defaultEnabled,
            A3_pullForIntelReport: exports.ADDON_STRATEGIES.A3.defaultEnabled,
            A4_useAllInLastVersion: exports.ADDON_STRATEGIES.A4.defaultEnabled,
        },
    };
}
/**
 * 获取策略配置的显示名称
 */
function getStrategyName(config) {
    var baseName = exports.BASE_STRATEGIES[config.baseStrategy].name;
    var addons = [];
    if (config.addonStrategies.A1_alwaysUseIntelReport) {
        addons.push('A1');
    }
    if (config.addonStrategies.A2_pullForFastTrack) {
        addons.push('A2');
    }
    if (config.addonStrategies.A3_pullForIntelReport) {
        addons.push('A3');
    }
    if (addons.length === 0) {
        return baseName;
    }
    return "".concat(baseName, " + [").concat(addons.join(', '), "]");
}
// ============ 附加策略判断函数 ============
/**
 * 判断是否应该触发附加策略二（凑加急寻访）
 *
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数
 * @param threshold 基础策略门槛（80 or 120）
 * @param hasIntelReport 是否有情报书
 * @returns 是否触发附加策略二
 */
function shouldTriggerAddonA2(currentPulls, pullsNextVersion, threshold, hasIntelReport) {
    var B = exports.BANNER_BONUS_PULLS; // 10
    var I = hasIntelReport ? 10 : 0;
    // 条件1：当前库存不满足基础策略（不考虑卡池赠送抽数）
    // 注意：如果currentPulls本身就>threshold，说明基础策略可以进入，不需要附加策略
    if (currentPulls > threshold) {
        return false;
    }
    // 条件2：下个版本后预计盈余足够（考虑卡池赠送抽数）
    var surplus = currentPulls + B + I + pullsNextVersion - threshold;
    var requiredSurplus = hasIntelReport ? 10 : 20;
    return surplus > requiredSurplus;
}
/**
 * 计算附加策略二需要消耗的库存抽数
 *
 * @param hasIntelReport 是否有情报书
 * @returns 需要消耗的库存抽数（10 or 20）
 */
function getAddonA2PullCost(hasIntelReport) {
    // 卡池赠送10 + 情报书10 + 库存10 = 30（触发加急）
    // 卡池赠送10 + 库存20 = 30（触发加急）
    return hasIntelReport ? 10 : 20;
}
/**
 * 判断是否应该触发附加策略三（凑情报书）
 *
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数
 * @param threshold 基础策略门槛（80 or 120）
 * @param hasIntelReport 是否有情报书
 * @returns 是否触发附加策略三
 */
function shouldTriggerAddonA3(currentPulls, pullsNextVersion, threshold, hasIntelReport) {
    var B = exports.BANNER_BONUS_PULLS; // 10
    var I = hasIntelReport ? 10 : 0;
    // 条件1：当前库存不满足基础策略（不考虑卡池赠送抽数）
    if (currentPulls > threshold) {
        return false;
    }
    // 条件2：下个版本后预计盈余足够（考虑卡池赠送抽数）
    var surplus = currentPulls + B + I + pullsNextVersion - threshold;
    var requiredSurplus = hasIntelReport ? 40 : 50;
    return surplus > requiredSurplus;
}
/**
 * 计算附加策略三需要消耗的库存抽数
 *
 * @param hasIntelReport 是否有情报书
 * @returns 需要消耗的库存抽数（40 or 50）
 */
function getAddonA3PullCost(hasIntelReport) {
    // 卡池赠送10 + 情报书10 + 库存40 = 60（触发情报书）
    // 卡池赠送10 + 库存50 = 60（触发情报书）
    return hasIntelReport ? 40 : 50;
}
/**
 * 判断是否满足基础策略的进入条件
 *
 * @param currentPulls 当前库存抽数
 * @param threshold 基础策略门槛（80 or 120）
 * @returns 是否满足进入条件
 */
function canEnterCharacterBanner(currentPulls, threshold) {
    return currentPulls + exports.BANNER_BONUS_PULLS > threshold;
}
/**
 * 判断是否满足武器池进入条件
 *
 * @param arsenalPoints 当前武库配额
 * @param hasCorrespondingCharacter 是否有对应角色
 * @param threshold 武器池进入门槛（默认15840）
 * @returns 是否满足进入条件
 */
function canEnterWeaponBanner(arsenalPoints, hasCorrespondingCharacter, threshold) {
    return hasCorrespondingCharacter && arsenalPoints >= threshold;
}
var gacha_core_1 = require("./gacha-core");
/**
 * 角色池完整模拟函数
 * 整合策略逻辑和核心抽卡机制
 *
 * @param config 策略配置
 * @param currentPulls 当前库存抽数（不含卡池赠送）
 * @param pullsNextVersion 下个版本抽数（用于附加策略判断）
 * @param globalState 全局状态
 * @param hasIntelReport 是否有寻访情报书
 * @param isLastVersion 是否为最后一个版本
 * @param isLastBanner 是否为当前版本的最后一个卡池
 * @param rng 随机数生成器
 * @returns 卡池模拟结果
 */
function pullCharacterBanner(config, currentPulls, pullsNextVersion, globalState, hasIntelReport, isLastVersion, isLastBanner, rng) {
    var threshold = config.characterBannerThreshold;
    var currentGlobalState = __assign({}, globalState);
    var bannerState = (0, gacha_core_1.createInitialBannerState)();
    var pullResults = [];
    var fastTrackResult = null;
    var pullsSpent = 0;
    var arsenalGained = 0;
    var usedIntelReport = false;
    var generatedIntelReport = false;
    // ========== 判断是否进入卡池 ==========
    var shouldEnter = false;
    var pullsToSpend = 0; // 计划消耗的库存抽数
    // 0. 检查附加策略四（最后版本用光资源）- 最高优先级
    if (config.addonStrategies.A4_useAllInLastVersion &&
        isLastVersion &&
        isLastBanner &&
        currentPulls > 0) {
        shouldEnter = true;
        pullsToSpend = currentPulls; // 用光所有抽数
    }
    // 1. 检查基础策略进入条件
    else if (canEnterCharacterBanner(currentPulls, threshold)) {
        shouldEnter = true;
        pullsToSpend = currentPulls; // 基础策略：持续抽到UP或抽数耗尽
    }
    // 2. 检查附加策略三（凑情报书）- 优先级高于附加策略二
    else if (config.addonStrategies.A3_pullForIntelReport &&
        shouldTriggerAddonA3(currentPulls, pullsNextVersion, threshold, hasIntelReport)) {
        shouldEnter = true;
        pullsToSpend = getAddonA3PullCost(hasIntelReport); // 消耗40或50抽
    }
    // 3. 检查附加策略二（凑加急寻访）
    else if (config.addonStrategies.A2_pullForFastTrack &&
        shouldTriggerAddonA2(currentPulls, pullsNextVersion, threshold, hasIntelReport)) {
        shouldEnter = true;
        pullsToSpend = getAddonA2PullCost(hasIntelReport); // 消耗10或20抽
    }
    // 如果不进入卡池，返回空结果
    if (!shouldEnter) {
        return {
            gotRateUp: false,
            pullsSpent: 0,
            pullResults: [],
            fastTrackResult: null,
            arsenalGained: 0,
            finalGlobalState: currentGlobalState,
            finalBannerState: bannerState,
            newGlobalState: currentGlobalState,
            generatedIntelReport: false,
        };
    }
    // ========== 开始抽卡流程 ==========
    // 1. 使用卡池赠送的10抽（不消耗库存）
    for (var i = 0; i < exports.BANNER_BONUS_PULLS; i++) {
        var _a = (0, gacha_core_1.simulateSinglePull)(currentGlobalState, bannerState, rng, false), result = _a.result, newGlobalState = _a.newGlobalState, newBannerState = _a.newBannerState;
        pullResults.push(result);
        currentGlobalState = newGlobalState;
        bannerState = newBannerState;
        bannerState.pullsInBanner++;
        arsenalGained += result.arsenalPoints;
        // 检查是否触发加急招募（30抽）
        if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
            var fastTrack = (0, gacha_core_1.simulateFastTrack)(currentGlobalState, rng);
            fastTrackResult = fastTrack.result;
            currentGlobalState = fastTrack.newGlobalState;
            arsenalGained += fastTrack.result.arsenalGained;
            bannerState.fastTrackUsed = true;
        }
        // 检查是否获得UP，如果是基础策略则立即停止
        if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
            return {
                gotRateUp: true,
                pullsSpent: pullsSpent,
                pullResults: pullResults,
                fastTrackResult: fastTrackResult,
                arsenalGained: arsenalGained,
                finalGlobalState: currentGlobalState,
                finalBannerState: bannerState,
                newGlobalState: currentGlobalState,
                generatedIntelReport: generatedIntelReport,
            };
        }
    }
    // 2. 使用寻访情报书（如果启用A1且有情报书）
    if (config.addonStrategies.A1_alwaysUseIntelReport &&
        hasIntelReport &&
        !usedIntelReport) {
        for (var i = 0; i < exports.BANNER_BONUS_PULLS; i++) {
            var _b = (0, gacha_core_1.simulateSinglePull)(currentGlobalState, bannerState, rng, false), result = _b.result, newGlobalState = _b.newGlobalState, newBannerState = _b.newBannerState;
            pullResults.push(result);
            currentGlobalState = newGlobalState;
            bannerState = newBannerState;
            bannerState.pullsInBanner++;
            arsenalGained += result.arsenalPoints;
            // 检查是否触发加急招募（30抽）
            if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
                var fastTrack = (0, gacha_core_1.simulateFastTrack)(currentGlobalState, rng);
                fastTrackResult = fastTrack.result;
                currentGlobalState = fastTrack.newGlobalState;
                arsenalGained += fastTrack.result.arsenalGained;
                bannerState.fastTrackUsed = true;
            }
            // 检查是否获得UP，如果是基础策略则立即停止
            if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
                return {
                    gotRateUp: true,
                    pullsSpent: pullsSpent,
                    pullResults: pullResults,
                    fastTrackResult: fastTrackResult,
                    arsenalGained: arsenalGained,
                    finalGlobalState: currentGlobalState,
                    finalBannerState: bannerState,
                    newGlobalState: currentGlobalState,
                    generatedIntelReport: generatedIntelReport,
                };
            }
        }
        usedIntelReport = true;
    }
    // 3. 持续单抽，直到达到目标抽数或获得UP
    while (pullsSpent < pullsToSpend) {
        var _c = (0, gacha_core_1.simulateSinglePull)(currentGlobalState, bannerState, rng, false), result = _c.result, newGlobalState = _c.newGlobalState, newBannerState = _c.newBannerState;
        pullResults.push(result);
        currentGlobalState = newGlobalState;
        bannerState = newBannerState;
        bannerState.pullsInBanner++;
        pullsSpent++;
        arsenalGained += result.arsenalPoints;
        // 检查是否触发加急招募（30抽）
        if (bannerState.pullsInBanner === 30 && !bannerState.fastTrackUsed) {
            var fastTrack = (0, gacha_core_1.simulateFastTrack)(currentGlobalState, rng);
            fastTrackResult = fastTrack.result;
            currentGlobalState = fastTrack.newGlobalState;
            arsenalGained += fastTrack.result.arsenalGained;
            bannerState.fastTrackUsed = true;
        }
        // 检查是否触发寻访情报书（60抽）
        if (bannerState.pullsInBanner === 60 && !bannerState.intelReportUsed) {
            generatedIntelReport = true;
            bannerState.intelReportUsed = true;
        }
        // 检查是否获得UP，如果是基础策略则立即停止
        if (result.rarity === 6 && result.isRateUp && pullsToSpend === currentPulls) {
            return {
                gotRateUp: true,
                pullsSpent: pullsSpent,
                pullResults: pullResults,
                fastTrackResult: fastTrackResult,
                arsenalGained: arsenalGained,
                finalGlobalState: currentGlobalState,
                finalBannerState: bannerState,
                newGlobalState: currentGlobalState,
                generatedIntelReport: generatedIntelReport,
            };
        }
    }
    // 判断是否获得UP
    var gotRateUp = pullResults.some(function (r) { return r.rarity === 6 && r.isRateUp; });
    return {
        gotRateUp: gotRateUp,
        pullsSpent: pullsSpent,
        pullResults: pullResults,
        fastTrackResult: fastTrackResult,
        arsenalGained: arsenalGained,
        finalGlobalState: currentGlobalState,
        finalBannerState: bannerState,
        newGlobalState: currentGlobalState,
        generatedIntelReport: generatedIntelReport,
    };
}
var weapon_gacha_core_1 = require("./weapon-gacha-core");
/**
 * 武器池完整模拟函数
 * 按照策略执行武器池申领
 *
 * @param config 策略配置
 * @param arsenalPoints 当前武库配额
 * @param hasCorrespondingCharacter 是否有对应角色
 * @param rng 随机数生成器
 * @returns 武器池模拟结果
 */
function claimWeaponBanner(config, arsenalPoints, hasCorrespondingCharacter, rng) {
    var threshold = config.weaponBannerThreshold;
    var currentArsenalPoints = arsenalPoints;
    var weaponBannerState = (0, weapon_gacha_core_1.createInitialWeaponBannerState)();
    var claimResults = [];
    var arsenalSpent = 0;
    // 检查是否满足进入条件
    if (!canEnterWeaponBanner(currentArsenalPoints, hasCorrespondingCharacter, threshold)) {
        return {
            gotRateUp: false,
            claimsSpent: 0,
            arsenalSpent: 0,
            claimResults: [],
            finalWeaponBannerState: weaponBannerState,
            finalArsenalPoints: currentArsenalPoints,
        };
    }
    // 持续申领，直到获得UP或达到上限
    var maxClaims = exports.WEAPON_SPARK_CLAIMS; // 8次
    var claimsSpent = 0;
    while (claimsSpent < maxClaims &&
        currentArsenalPoints >= exports.WEAPON_CLAIM_COST &&
        !weaponBannerState.gotRateUpInThisBanner) {
        var _a = (0, weapon_gacha_core_1.simulateWeaponClaim)(weaponBannerState, rng), result = _a.result, newWeaponBannerState = _a.newWeaponBannerState;
        claimResults.push(result);
        weaponBannerState = newWeaponBannerState;
        currentArsenalPoints -= exports.WEAPON_CLAIM_COST;
        arsenalSpent += exports.WEAPON_CLAIM_COST;
        claimsSpent++;
        // 如果获得UP，立即停止
        if (result.gotRateUp) {
            break;
        }
    }
    var gotRateUp = weaponBannerState.gotRateUpInThisBanner;
    return {
        gotRateUp: gotRateUp,
        claimsSpent: claimsSpent,
        arsenalSpent: arsenalSpent,
        claimResults: claimResults,
        finalWeaponBannerState: weaponBannerState,
        finalArsenalPoints: currentArsenalPoints,
    };
}
// ============ 完整策略执行流程 ============
var gacha_core_2 = require("./gacha-core");
/**
 * 完整策略执行流程
 * 从初始资源到最后一个卡池的完整模拟
 *
 * @param config 策略配置
 * @param initialPulls 初始抽数
 * @param arsenalPerVersion 每版本武库配额
 * @param pullsPerVersion 每版本抽数
 * @param versionCount 版本数
 * @param bannersPerVersion 每版本卡池数
 * @param rng 随机数生成器
 * @returns 策略执行结果
 */
function executeStrategy(config, initialPulls, initialArsenal, arsenalPerVersion, pullsPerVersion, versionCount, bannersPerVersion, rng) {
    // 初始化资源和状态
    var currentPulls = initialPulls;
    var globalState = (0, gacha_core_2.createInitialGlobalState)();
    globalState.arsenalPoints = initialArsenal; // 设置初始武库配额
    var hasIntelReport = false;
    var obtainedCharacterCount = 0;
    var obtainedWeaponCount = 0;
    var totalPullsSpent = 0;
    var totalArsenalSpent = 0;
    // 按版本循环
    for (var version = 0; version < versionCount; version++) {
        // 在版本开始时发放资源
        currentPulls += pullsPerVersion;
        globalState.arsenalPoints += arsenalPerVersion;
        // 按卡池顺序处理每个角色池
        for (var banner = 0; banner < bannersPerVersion; banner++) {
            // 计算下个版本的抽数（用于附加策略判断）
            var remainingVersions = versionCount - version - 1;
            var pullsNextVersion = remainingVersions > 0 ? pullsPerVersion : 0;
            // 判断是否为最后一个版本和最后一个卡池
            var isLastVersion = version === versionCount - 1;
            var isLastBanner = banner === bannersPerVersion - 1;
            // 执行角色池模拟
            var bannerOutcome = pullCharacterBanner(config, currentPulls, pullsNextVersion, globalState, hasIntelReport, isLastVersion, isLastBanner, rng);
            // 更新资源和状态
            currentPulls -= bannerOutcome.pullsSpent;
            globalState = bannerOutcome.newGlobalState;
            totalPullsSpent += bannerOutcome.pullsSpent;
            hasIntelReport = bannerOutcome.generatedIntelReport;
            // 如果获得UP角色，计数+1
            if (bannerOutcome.gotRateUp) {
                obtainedCharacterCount++;
            }
            // 在角色池后检查是否应该申领武器池
            // 1. 如果获得了新的UP角色
            // 2. 或者附加策略A2/A3触发且抽到了6星限定
            var got6StarLimited = bannerOutcome.pullResults.some(function (r) { return r.rarity === 6 && r.isRateUp; });
            // 判断是否应该尝试申领武器池
            var shouldTryWeaponBanner = false;
            // 条件1: 获得了UP角色（基础策略）
            if (bannerOutcome.gotRateUp) {
                shouldTryWeaponBanner = true;
            }
            // 条件2: 附加策略A2/A3触发且抽到6星限定
            else if ((config.addonStrategies.A2_pullForFastTrack ||
                config.addonStrategies.A3_pullForIntelReport) &&
                got6StarLimited) {
                shouldTryWeaponBanner = true;
            }
            // 如果满足条件，尝试申领武器池
            if (shouldTryWeaponBanner) {
                var weaponOutcome = claimWeaponBanner(config, globalState.arsenalPoints, true, // 假设有对应角色
                rng);
                // 更新资源和状态
                globalState.arsenalPoints = weaponOutcome.finalArsenalPoints;
                totalArsenalSpent += weaponOutcome.arsenalSpent;
                // 如果获得UP专武，计数+1
                if (weaponOutcome.gotRateUp) {
                    obtainedWeaponCount++;
                }
            }
        }
    }
    // 计算总卡池数
    var totalBanners = versionCount * bannersPerVersion;
    // 返回统计结果
    return {
        obtainedCharacterCount: obtainedCharacterCount,
        obtainedWeaponCount: obtainedWeaponCount,
        totalPullsSpent: totalPullsSpent,
        totalArsenalSpent: totalArsenalSpent,
        remainingPulls: currentPulls,
        remainingArsenal: globalState.arsenalPoints,
        obtainedAllCharacters: obtainedCharacterCount === totalBanners,
        obtainedAllWeapons: obtainedWeaponCount === totalBanners,
    };
}
