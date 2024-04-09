"use strict";
'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.useWeb3ModalEvents = exports.useWeb3ModalState = exports.useWeb3Modal = exports.useWeb3ModalTheme = exports.useWeb3ModalError = exports.useWeb3ModalAccount = exports.useSwitchNetwork = exports.useDisconnect = exports.useWeb3ModalProvider = exports.createWeb3Modal = void 0;
const client_js_1 = require("../client.js");
const scaffold_utils_1 = require("@web3modal/scaffold-utils");
const ethers_1 = require("@web3modal/scaffold-utils/ethers");
const scaffold_react_1 = require("@web3modal/scaffold-react");
const valtio_1 = require("valtio");
// -- Setup -------------------------------------------------------------------
let modal = undefined;
function createWeb3Modal(options) {
    if (!modal) {
        modal = new client_js_1.Web3Modal(Object.assign(Object.assign({}, options), { _sdkVersion: `react-ethers-${scaffold_utils_1.ConstantsUtil.VERSION}` }));
    }
    (0, scaffold_react_1.getWeb3Modal)(modal);
    return modal;
}
exports.createWeb3Modal = createWeb3Modal;
// -- Hooks -------------------------------------------------------------------
function useWeb3ModalProvider() {
    const { provider, providerType } = (0, valtio_1.useSnapshot)(ethers_1.EthersStoreUtil.state);
    const walletProvider = provider;
    const walletProviderType = providerType;
    return {
        walletProvider,
        walletProviderType
    };
}
exports.useWeb3ModalProvider = useWeb3ModalProvider;
function useDisconnect() {
    function disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (modal === null || modal === void 0 ? void 0 : modal.disconnect());
        });
    }
    return {
        disconnect
    };
}
exports.useDisconnect = useDisconnect;
function useSwitchNetwork() {
    function switchNetwork(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (modal === null || modal === void 0 ? void 0 : modal.switchNetwork(chainId));
        });
    }
    return {
        switchNetwork
    };
}
exports.useSwitchNetwork = useSwitchNetwork;
function useWeb3ModalAccount() {
    const { address, isConnected, chainId } = (0, valtio_1.useSnapshot)(ethers_1.EthersStoreUtil.state);
    return {
        address,
        isConnected,
        chainId
    };
}
exports.useWeb3ModalAccount = useWeb3ModalAccount;
function useWeb3ModalError() {
    const { error } = (0, valtio_1.useSnapshot)(ethers_1.EthersStoreUtil.state);
    return {
        error
    };
}
exports.useWeb3ModalError = useWeb3ModalError;
var scaffold_react_2 = require("@web3modal/scaffold-react");
Object.defineProperty(exports, "useWeb3ModalTheme", { enumerable: true, get: function () { return scaffold_react_2.useWeb3ModalTheme; } });
Object.defineProperty(exports, "useWeb3Modal", { enumerable: true, get: function () { return scaffold_react_2.useWeb3Modal; } });
Object.defineProperty(exports, "useWeb3ModalState", { enumerable: true, get: function () { return scaffold_react_2.useWeb3ModalState; } });
Object.defineProperty(exports, "useWeb3ModalEvents", { enumerable: true, get: function () { return scaffold_react_2.useWeb3ModalEvents; } });
// -- Universal Exports -------------------------------------------------------
var defaultConfig_js_1 = require("../utils/defaultConfig.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return defaultConfig_js_1.defaultConfig; } });
