"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpersUtil = void 0;
const scaffold_utils_1 = require("@web3modal/scaffold-utils");
const ConstantsUtil_js_1 = require("./ConstantsUtil.js");
exports.HelpersUtil = {
    caipNetworkIdToNumber(caipnetworkId) {
        return caipnetworkId ? Number(caipnetworkId.split(':')[1]) : undefined;
    },
    getCaipTokens(tokens) {
        if (!tokens) {
            return undefined;
        }
        const caipTokens = {};
        Object.entries(tokens).forEach(([id, token]) => {
            caipTokens[`${ConstantsUtil_js_1.ConstantsUtil.EIP155}:${id}`] = token;
        });
        return caipTokens;
    },
    getCaipDefaultChain(chain) {
        if (!chain) {
            return undefined;
        }
        return {
            id: `${ConstantsUtil_js_1.ConstantsUtil.EIP155}:${chain.chainId}`,
            name: chain.chainName,
            imageId: scaffold_utils_1.PresetsUtil.EIP155NetworkImageIds[chain.chainId]
        };
    },
};
