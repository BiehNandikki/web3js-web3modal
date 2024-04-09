import type { W3mFrameProvider } from '@web3modal/wallet'
import {SupportedProviders} from 'web3';

export interface IEthersConfig {
  providers: ProviderType
  defaultChain?: number
  SSR?: boolean
}

export type Address = String;

export type ProviderType = {
  injected?: SupportedProviders
  coinbase?: SupportedProviders
  email?: boolean
  EIP6963?: boolean
  metadata: Metadata
}

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

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

export type CombinedProvider = W3mFrameProvider & Provider

export type Chain = {
  rpcUrl: string
  explorerUrl: string
  currency: string
  name: string
  chainId: number
}
