'use client'

import type { Web3ModalOptions } from '../client.js'
import { Web3Modal } from '../client.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { EthersStoreUtil } from '@web3modal/scaffold-utils/ethers'
import { getWeb3Modal } from '@web3modal/scaffold-react'
import { useSnapshot } from 'valtio'
// @TODO: to be updated
// @ts-expect-error: Eip6963ProvidersMap is declared but never used
import {Eip1193Compatible} from 'web3'
// import type { Eip1193Provider } from 'ethers'

export type { Chain } from '../utils/types.js'
// -- Types -------------------------------------------------------------------
export type { Web3ModalOptions } from '../client.js'

// -- Setup -------------------------------------------------------------------
let modal: Web3Modal | undefined = undefined

export function createWeb3Modal(options: Web3ModalOptions) {
  if (!modal) {
    modal = new Web3Modal({
      ...options,
      // @TODO: remove casting to any after updating web3modal types
      _sdkVersion: `react-web3js-${ConstantsUtil.VERSION}` as any
    })
  }
  getWeb3Modal(modal)

  return modal
}

// -- Hooks -------------------------------------------------------------------
export function useWeb3ModalProvider() {
  const { provider, providerType } = useSnapshot(EthersStoreUtil.state)

  const walletProvider = provider as Eip1193Compatible | undefined
  const walletProviderType = providerType

  return {
    walletProvider,
    walletProviderType
  }
}

export function useDisconnect() {
  async function disconnect() {
    await modal?.disconnect()
  }

  return {
    disconnect
  }
}

export function useSwitchNetwork() {
  async function switchNetwork(chainId: number) {
    await modal?.switchNetwork(chainId)
  }

  return {
    switchNetwork
  }
}

export function useWeb3ModalAccount() {
  const { address, isConnected, chainId } = useSnapshot(EthersStoreUtil.state)

  return {
    address,
    isConnected,
    chainId
  }
}

export function useWeb3ModalError() {
  const { error } = useSnapshot(EthersStoreUtil.state)

  return {
    error
  }
}

export {
  useWeb3ModalTheme,
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalEvents
} from '@web3modal/scaffold-react'

// -- Universal Exports -------------------------------------------------------
export { defaultConfig } from '../utils/defaultConfig.js'