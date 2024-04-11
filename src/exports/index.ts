import type { Web3ModalOptions } from '../client.js'
import { Web3Modal } from '../client.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
export { Chain } from '../utils/types.js'
export type { Web3Modal, Web3ModalOptions } from '../client.js'
export { defaultConfig } from '../utils/defaultConfig.js'

export function createWeb3Modal(options: Web3ModalOptions) {
  return new Web3Modal({ ...options, _sdkVersion: `html-ethers-${ConstantsUtil.VERSION}` })
}