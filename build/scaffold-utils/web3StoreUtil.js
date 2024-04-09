"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3StoreUtil = void 0;
const utils_1 = require("valtio/utils");
const vanilla_1 = require("valtio/vanilla");
// -- State --------------------------------------------- //
const state = (0, vanilla_1.proxy)({
    provider: undefined,
    providerType: undefined,
    address: undefined,
    chainId: undefined,
    isConnected: false
});
// -- StoreUtil ---------------------------------------- //
exports.Web3StoreUtil = {
    state,
    subscribeKey(key, callback) {
        return (0, utils_1.subscribeKey)(state, key, callback);
    },
    subscribe(callback) {
        return (0, vanilla_1.subscribe)(state, () => callback(state));
    },
    setProvider(provider) {
        if (provider) {
            state.provider = (0, vanilla_1.ref)(provider);
        }
    },
    setProviderType(providerType) {
        state.providerType = providerType;
    },
    setAddress(address) {
        state.address = address;
    },
    setChainId(chainId) {
        state.chainId = chainId;
    },
    setIsConnected(isConnected) {
        state.isConnected = isConnected;
    },
    setError(error) {
        state.error = error;
    },
    reset() {
        state.provider = undefined;
        state.address = undefined;
        state.chainId = undefined;
        state.providerType = undefined;
        state.isConnected = false;
        state.error = undefined;
    }
};
