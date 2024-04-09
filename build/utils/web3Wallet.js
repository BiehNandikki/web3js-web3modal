"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Wallet = void 0;
const web3_1 = __importDefault(require("web3"));
// web3js wallet with extended methods for wallet
class Web3Wallet {
    constructor(provider) {
        this.web3 = new web3_1.default(provider);
        this.web3.extend({
            methods: [
                {
                    name: 'switchEthereumChain',
                    call: 'wallet_switchEthereumChain',
                },
                {
                    name: 'addEthereumChain',
                    call: 'wallet_addEthereumChain',
                }
            ]
        });
    }
}
exports.Web3Wallet = Web3Wallet;
