import type { CaipNetworkId, Tokens, CaipNetwork } from '@web3modal/core'
import type { W3mFrameProvider } from '@web3modal/wallet'
import { PresetsUtil } from '@web3modal/scaffold-utils';
import { ConstantsUtil } from './ConstantsUtil.js'
import { Chain } from '../utils/types.js';

export const HelpersUtil = {
  caipNetworkIdToNumber(caipnetworkId?: CaipNetworkId) {
    return caipnetworkId ? Number(caipnetworkId.split(':')[1]) : undefined
  },
  getCaipTokens(tokens?: Tokens) {
    if (!tokens) {
      return undefined
    }

    const caipTokens: Tokens = {}
    Object.entries(tokens).forEach(([id, token]) => {
      caipTokens[`${ConstantsUtil.EIP155}:${id}`] = token
    })

    return caipTokens
  },
  getCaipDefaultChain(chain?: Chain) {
    if (!chain) {
      return undefined
    }

    return {
      id: `${ConstantsUtil.EIP155}:${chain.chainId}`,
      name: chain.chainName,
      imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId]
    } as CaipNetwork
  },
}