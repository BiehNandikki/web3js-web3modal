import type {SupportedProviders, Web3APISpec, EIP1193Provider} from 'web3';
import type { W3mFrameProvider } from '@web3modal/wallet'


export interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Provider {
  request: <T>(args: RequestArguments) => Promise<T>
  on: <T>(event: string, listener: (data: T) => void) => void
  removeListener: <T>(event: string, listener: (data: T) => void) => void
  emit: (event: string) => void
}

export type CombinedProvider = W3mFrameProvider & Provider

export type Chain = {
    chainId: number,
    blockExplorerUrls?: string[],
    chainName: string,
    iconUrls?: string[],
    nativeCurrency: {
        decimals: number,
        name?: string,
        symbol: string
    },
    rpcUrls: string[]
}

export type Metadata = {
    name: string
    description: string
    url: string
    icons: string[]
  }

export type Web3Config = {
    provider: SupportedProviders,
    metadata: Metadata
};

export type ProviderType = {
    injected?: SupportedProviders
    coinbase?: SupportedProviders
    email?: boolean
    EIP6963?: boolean
    metadata: Metadata
  }


  export interface EIP6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  }

export interface EIP6963ProviderDetail<API = Web3APISpec> {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider<API>;
  }
  
export type Eip6963ProvidersMap = Map<string, EIP6963ProviderDetail>;