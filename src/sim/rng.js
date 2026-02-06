"use strict";
// 简单、可复现的 PRNG（xorshift32）
// 说明：这不是加密 RNG；仅用于模拟复现。
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRng = createRng;
function hashStringToUint32(seed) {
    // FNV-1a 32-bit
    var h = 0x811c9dc5;
    for (var i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
function createRng(seed) {
    var state = seed ? hashStringToUint32(seed) : (Date.now() >>> 0);
    var nextUint32 = function () {
        // xorshift32
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return state >>> 0;
    };
    return {
        nextFloat: function () { return nextUint32() / Math.pow(2, 32); },
    };
}
