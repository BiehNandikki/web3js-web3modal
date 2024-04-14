
import { Web3 } from 'web3';
import { type SupportedProviders} from 'web3';
import type { Chain } from './types';
declare module 'web3' {
	interface Web3Context {
        switchEthereumChain(chainId:String): Promise<null>;
        addEthereumChain(chain:Chain): Promise<null>;
    }
}

// web3js wallet with extended methods for wallet
export class Web3Wallet {
    web3: Web3;
    constructor(provider: SupportedProviders | string){
        this.web3 = new Web3(provider);
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
        })
    }
}