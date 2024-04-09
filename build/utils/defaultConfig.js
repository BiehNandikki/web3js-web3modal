"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
require("@web3modal/polyfills");
const wallet_sdk_1 = require("@coinbase/wallet-sdk");
function defaultConfig(options) {
    const { enableEIP6963 = true, enableInjected = true, enableCoinbase = true, enableEmail = false, metadata, rpcUrl, defaultChainId } = options;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let injectedProvider = undefined;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let coinbaseProvider = undefined;
    const providers = { metadata };
    function getInjectedProvider() {
        if (injectedProvider) {
            return injectedProvider;
        }
        if (typeof window === 'undefined') {
            return undefined;
        }
        if (!window.ethereum) {
            return undefined;
        }
        injectedProvider = window.ethereum;
        return injectedProvider;
    }
    function getCoinbaseProvider() {
        if (coinbaseProvider) {
            return coinbaseProvider;
        }
        if (typeof window === 'undefined') {
            return undefined;
        }
        const coinbaseWallet = new wallet_sdk_1.CoinbaseWalletSDK({
            appName: metadata.name,
            appLogoUrl: metadata.icons[0],
            darkMode: false
        });
        coinbaseProvider = coinbaseWallet.makeWeb3Provider(rpcUrl, defaultChainId);
        return coinbaseProvider;
    }
    if (enableInjected) {
        providers.injected = getInjectedProvider();
    }
    if (enableCoinbase && rpcUrl && defaultChainId) {
        providers.coinbase = getCoinbaseProvider();
    }
    if (enableEIP6963) {
        providers.EIP6963 = true;
    }
    if (enableEmail) {
        providers.email = true;
    }
    return providers;
}
exports.defaultConfig = defaultConfig;
