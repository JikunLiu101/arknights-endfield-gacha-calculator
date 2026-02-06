"use strict";
/**
 * 明日方舟：终末地 武器池核心引擎
 *
 * 实现武器池的保底、井、申领等核心机制
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
exports.ARSENAL_COST_PER_CLAIM = void 0;
exports.simulateWeaponSinglePull = simulateWeaponSinglePull;
exports.simulateWeaponClaim = simulateWeaponClaim;
exports.createInitialWeaponBannerState = createInitialWeaponBannerState;
// ============ 常量定义 ============
/** 6星基础概率 */
var PROB_6_STAR = 0.04;
/** 5星基础概率 */
var PROB_5_STAR = 0.15;
/** UP专武占6星概率的比例 */
var RATE_UP_RATIO = 0.25;
/** 保底触发门槛（连续3次申领未出6星后触发） */
var WEAPON_PITY_THRESHOLD = 3;
/** 井触发门槛（第8次申领强制UP） */
var WEAPON_SPARK_THRESHOLD = 7;
/** 每次申领的抽数 */
var PULLS_PER_CLAIM = 10;
/** 每次申领消耗的武库配额 */
exports.ARSENAL_COST_PER_CLAIM = 1980;
// ============ 辅助函数 ============
/**
 * 根据概率抽取武器稀有度
 */
function rollWeaponRarity(rng) {
    var r = rng.nextFloat();
    if (r < PROB_6_STAR)
        return 6;
    if (r < PROB_6_STAR + PROB_5_STAR)
        return 5;
    return 4;
}
/**
 * 判断6星武器是否为UP专武
 */
function isRateUpWeapon(rng) {
    return rng.nextFloat() < RATE_UP_RATIO;
}
// ============ 核心函数 ============
/**
 * 单次武器抽取模拟（最基础的原子操作）
 *
 * @param weaponBannerState 武器池状态
 * @param rng 随机数生成器
 * @param isLastPullOfClaim 是否为本次申领的第10抽
 * @param guaranteeType 触发类型（spark/pity/null）
 * @returns 抽取结果和更新后的状态
 */
function simulateWeaponSinglePull(weaponBannerState, rng, isLastPullOfClaim, guaranteeType) {
    // 复制状态（不可变更新）
    var newWeaponBannerState = __assign({}, weaponBannerState);
    // 初始化结果
    var rarity;
    var isRateUp = false;
    var triggeredPity = false;
    var triggeredSpark = false;
    // 1. 判断是否触发井（井优先级高于保底）
    if (isLastPullOfClaim && guaranteeType === 'spark') {
        // 强制给UP专武
        rarity = 6;
        isRateUp = true;
        triggeredSpark = true;
        newWeaponBannerState.weaponPityCounter = 0; // 重置保底
        newWeaponBannerState.gotRateUpInThisBanner = true;
    }
    // 2. 判断是否触发保底
    else if (isLastPullOfClaim && guaranteeType === 'pity') {
        // 强制给6星武器（但按25%概率判断是否UP）
        rarity = 6;
        isRateUp = isRateUpWeapon(rng);
        triggeredPity = true;
        newWeaponBannerState.weaponPityCounter = 0; // 重置保底
        if (isRateUp) {
            newWeaponBannerState.gotRateUpInThisBanner = true;
        }
    }
    // 3. 正常抽取流程
    else {
        rarity = rollWeaponRarity(rng);
        // 如果是6星，判断是否UP
        if (rarity === 6) {
            isRateUp = isRateUpWeapon(rng);
            newWeaponBannerState.weaponPityCounter = 0; // 重置保底计数器
            if (isRateUp) {
                newWeaponBannerState.gotRateUpInThisBanner = true;
            }
        }
    }
    // 构建结果
    var result = {
        rarity: rarity,
        isRateUp: isRateUp,
        triggeredPity: triggeredPity,
        triggeredSpark: triggeredSpark,
    };
    return {
        result: result,
        newWeaponBannerState: newWeaponBannerState,
    };
}
/**
 * 一次申领模拟（10连抽，必得至少1个5星+）
 *
 * @param weaponBannerState 武器池状态
 * @param rng 随机数生成器
 * @returns 申领结果和更新后的状态
 */
function simulateWeaponClaim(weaponBannerState, rng) {
    var currentWeaponBannerState = __assign({}, weaponBannerState);
    var pullResults = [];
    // 1. 判断本次申领是否触发保底/井
    var guaranteeType = null;
    // 井优先级高于保底
    if (currentWeaponBannerState.weaponSparkCounter === WEAPON_SPARK_THRESHOLD &&
        !currentWeaponBannerState.gotRateUpInThisBanner) {
        guaranteeType = 'spark';
    }
    else if (currentWeaponBannerState.weaponPityCounter === WEAPON_PITY_THRESHOLD) {
        guaranteeType = 'pity';
    }
    // 2. 执行前9次抽取（如果触发保底/井，前9抽都是正常抽取）
    for (var i = 0; i < PULLS_PER_CLAIM - 1; i++) {
        var _a = simulateWeaponSinglePull(currentWeaponBannerState, rng, false, null), result_1 = _a.result, newWeaponBannerState = _a.newWeaponBannerState;
        pullResults.push(result_1);
        currentWeaponBannerState = newWeaponBannerState;
    }
    // 3. 第10抽：根据保底/井检查前9抽，决定是否强制给出
    var got6StarInFirst9 = pullResults.some(function (r) { return r.rarity === 6; });
    var gotRateUpInFirst9 = pullResults.some(function (r) { return r.rarity === 6 && r.isRateUp; });
    if (guaranteeType === 'spark' && !gotRateUpInFirst9) {
        // 井触发且前9抽未得UP：第10抽强制给UP
        pullResults.push({
            rarity: 6,
            isRateUp: true,
            triggeredPity: false,
            triggeredSpark: true,
        });
        currentWeaponBannerState.weaponPityCounter = 0;
        currentWeaponBannerState.gotRateUpInThisBanner = true;
    }
    else if (guaranteeType === 'pity' && !got6StarInFirst9) {
        // 保底触发且前9抽未得6星：第10抽强制给6星（按25%概率判断是否UP）
        var isUp = isRateUpWeapon(rng);
        pullResults.push({
            rarity: 6,
            isRateUp: isUp,
            triggeredPity: true,
            triggeredSpark: false,
        });
        currentWeaponBannerState.weaponPityCounter = 0;
        if (isUp) {
            currentWeaponBannerState.gotRateUpInThisBanner = true;
        }
    }
    else {
        // 无需触发保底/井，或前9抽已满足条件：正常抽取第10抽
        var _b = simulateWeaponSinglePull(currentWeaponBannerState, rng, true, null), result_2 = _b.result, newWeaponBannerState = _b.newWeaponBannerState;
        pullResults.push(result_2);
        currentWeaponBannerState = newWeaponBannerState;
    }
    // 4. 保证至少1个5星+（在保底/井处理后检查）
    var has5StarOrAbove = pullResults.some(function (r) { return r.rarity === 5 || r.rarity === 6; });
    if (!has5StarOrAbove) {
        // 如果第10抽没有被保底/井占用，则强制修正为5星
        if (!pullResults[9].triggeredPity && !pullResults[9].triggeredSpark) {
            pullResults[9] = {
                rarity: 5,
                isRateUp: false,
                triggeredPity: false,
                triggeredSpark: false,
            };
        }
        has5StarOrAbove = true;
    }
    // 5. 更新计数器
    var gotSixStar = pullResults.some(function (r) { return r.rarity === 6; });
    var gotRateUp = pullResults.some(function (r) { return r.rarity === 6 && r.isRateUp; });
    var triggeredPity = pullResults.some(function (r) { return r.triggeredPity; });
    var triggeredSpark = pullResults.some(function (r) { return r.triggeredSpark; });
    // 如果没有获得6星，保底计数器+1
    if (!gotSixStar) {
        currentWeaponBannerState.weaponPityCounter++;
    }
    // 如果没有获得UP，井计数器+1
    if (!gotRateUp) {
        currentWeaponBannerState.weaponSparkCounter++;
    }
    else {
        // 获得UP，重置井计数器
        currentWeaponBannerState.weaponSparkCounter = 0;
    }
    // 申领次数+1
    currentWeaponBannerState.claimsInBanner++;
    // 6. 构建结果
    var result = {
        pullResults: pullResults,
        gotSixStar: gotSixStar,
        gotRateUp: gotRateUp,
        triggeredPity: triggeredPity,
        triggeredSpark: triggeredSpark,
    };
    return {
        result: result,
        newWeaponBannerState: currentWeaponBannerState,
    };
}
/**
 * 创建初始武器池状态
 */
function createInitialWeaponBannerState() {
    return {
        weaponPityCounter: 0,
        weaponSparkCounter: 0,
        gotRateUpInThisBanner: false,
        claimsInBanner: 0,
    };
}
