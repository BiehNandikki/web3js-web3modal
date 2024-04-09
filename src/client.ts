import { 
  LibraryOptions,
	Token,
	NetworkControllerClient,
  ConnectionControllerClient,
	CaipNetwork,
	CaipNetworkId,
	CaipAddress,
  PublicStateControllerState,
	Connector,
  } from '@web3modal/scaffold';
import EthereumProvider from '@walletconnect/ethereum-provider'
import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import { W3mFrameProvider } from '@web3modal/wallet'

import { PresetsUtil } from '@web3modal/scaffold-utils'
import { Web3ModalScaffold } from '@web3modal/scaffold';
import type { Web3ModalSIWEClient } from '@web3modal/siwe'
import { W3mFrameHelpers, W3mFrameRpcConstants } from '@web3modal/wallet'
import Web3, {SupportedProviders, Address, EIP1193Provider, Eip1193Compatible} from 'web3';
import { Web3Wallet } from './utils/web3Wallet'
import {Chain, Metadata, ProviderType, Eip6963ProvidersMap} from './utils/types';
import { Web3StoreUtil } from './scaffold-utils/web3StoreUtil';
import { ConstantsUtil } from './scaffold-utils/ConstantsUtil';
import { HelpersUtil as Web3HelpersUtil} from './scaffold-utils/HelpersUtil';
import { CombinedProvider } from './scaffold-utils/web3TypesUtil';


export interface Web3ModalClientOptions extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
	web3Config: ProviderType
	chains: Chain[]
	siweConfig?: Web3ModalSIWEClient
	defaultChain?: Chain
	chainImages?: Record<number, string>
	connectorImages?: Record<string, string>
	tokens?: Record<number, Token>
	enableSmartAccounts?: boolean
  }


interface Info {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface Wallet {
  info: Info
  provider: SupportedProviders
}

// @ts-expect-error: Overriden state type is correct
interface Web3ModalState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {

	private options: Web3ModalClientOptions | undefined = undefined
	private web3Wallet: Web3Wallet;
	private chains: Chain[];
	
	private projectId: string

	private walletConnectProvider?: EthereumProvider

	private walletConnectProviderInitPromise?: Promise<void>

  private EIP6963Providers: SupportedProviders[] = []

	private metadata?: Metadata

	private hasSyncedConnectedAccount: boolean;

	private emailProvider?: W3mFrameProvider
  

  constructor(options: Web3ModalClientOptions) {
    const {
      web3Config,
      siweConfig,
      chains,
      defaultChain,
      tokens,
      chainImages,
      _sdkVersion,
      ...w3mOptions
    } = options


    if (!w3mOptions.projectId) {
		throw new Error('web3modal:constructor - projectId is undefined')
	  }
	
	const networkControllerClient: NetworkControllerClient = {
		switchCaipNetwork: async caipNetwork => {
		  const chainId = Web3HelpersUtil.caipNetworkIdToNumber(caipNetwork?.id)
		  if (chainId) {
			try {
				await this.switchNetwork(chainId)
			} catch (error) {
			  throw new Error('networkControllerClient:switchCaipNetwork - unable to switch chain')
			}
		  }
		},
  
		getApprovedCaipNetworksData: async () =>
		  new Promise(async resolve => {
			const walletChoice = localStorage.getItem(ConstantsUtil.WALLET_ID)
			if (walletChoice?.includes(ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID)) {
			  const provider = await this.getWalletConnectProvider()
			  if (!provider) {
				throw new Error(
				  'networkControllerClient:getApprovedCaipNetworks - connector is undefined'
				)
			  }
			  const ns = provider.signer?.session?.namespaces
			  const nsMethods = ns?.[ConstantsUtil.EIP155]?.methods
			  const nsChains = ns?.[ConstantsUtil.EIP155]?.chains
  
			  const result = {
				supportsAllNetworks: nsMethods?.includes(ConstantsUtil.ADD_CHAIN_METHOD) ?? false,
				approvedCaipNetworkIds: nsChains as CaipNetworkId[] | undefined
			  }
  
			  resolve(result)
			} else {
			  const result = {
				approvedCaipNetworkIds: undefined,
				supportsAllNetworks: true
			  }
  
			  resolve(result)
			}
		  })
	  }

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const WalletConnectProvider = await this.getWalletConnectProvider()
        if (!WalletConnectProvider) {
          throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined')
        }

        WalletConnectProvider.on('display_uri', (uri: string) => {
          onUri(uri)
        })

        await WalletConnectProvider.connect()
        await this.setWalletConnectProvider()
      },

      //  @ts-expect-error TODO expected types in arguments are incomplete
      connectExternal: async ({
        id,
        info,
        provider
      }: {
        id: string
        info: Info
        provider: SupportedProviders
      }) => {
        if (id === ConstantsUtil.INJECTED_CONNECTOR_ID) {
          const InjectedProvider = web3Config.injected
          if (!InjectedProvider) {
            throw new Error('connectionControllerClient:connectInjected - provider is undefined')
          }
          try {
            this.web3Wallet.web3.setProvider(InjectedProvider);
            await this.web3Wallet.web3.eth.getAccounts();
            this.setInjectedProvider(web3Config)
          } catch (error) {
            // set error
          }
        } else if (id === ConstantsUtil.EIP6963_CONNECTOR_ID && info && provider) {
          try {
            const EIP6963Provider = provider;
            await this.web3Wallet.web3.eth.getAccounts();
            this.setEIP6963Provider(EIP6963Provider as Eip1193Compatible, info.name)
          } catch (error) {
          } 
        } else if (id === ConstantsUtil.COINBASE_CONNECTOR_ID) {
          const CoinbaseProvider = web3Config.coinbase as Eip1193Compatible;
          if (!CoinbaseProvider) {
            throw new Error('connectionControllerClient:connectCoinbase - connector is undefined')
          }

          try {
            this.web3Wallet.web3.setProvider(CoinbaseProvider);
            await this.web3Wallet.web3.eth.getAccounts();
            this.setCoinbaseProvider(CoinbaseProvider)
          } catch (error) {
            // EthersStoreUtil.setError(error)
          }
        } else if (id === ConstantsUtil.EMAIL_CONNECTOR_ID) {
          this.setEmailProvider()
        }
      },

      checkInstalled(ids) {
        if (!ids) {
          return Boolean(window.ethereum)
        }

        if (web3Config.injected) {
          if (!window?.ethereum) {
            return false
          }
        }

        return ids.some(id => Boolean(window.ethereum?.[String(id)]))
      },

      disconnect: async () => {
        const provider = Web3StoreUtil.state.provider
        const providerType = Web3StoreUtil.state.providerType
        localStorage.removeItem(ConstantsUtil.WALLET_ID)
        Web3StoreUtil.reset()
        if (siweConfig?.options?.signOutOnDisconnect) {
          await siweConfig.signOut()
        }
        if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
          const WalletConnectProvider = provider
          await (WalletConnectProvider as unknown as EthereumProvider).disconnect()
          provider?.emit('disconnect')
          // eslint-disable-next-line no-negated-condition
        } else if (providerType !== ConstantsUtil.EMAIL_CONNECTOR_ID) {
          provider?.emit('disconnect')
        } else {
          this.emailProvider?.disconnect()
        }
        provider?.emit('disconnect')
      },

      signMessage: async (message: string) => {
        const provider = Web3StoreUtil.state.provider
        if (!provider) {
          throw new Error('connectionControllerClient:signMessage - provider is undefined')
        }
        if(typeof(Web3StoreUtil.state.address) === 'string')
        {
          const s =  await this.web3Wallet.web3.eth.sign(message, Web3StoreUtil.state.address);
          if (typeof(s) === 'string')
          return s
        else{
          return s.signature;
        }
        } else {
          throw new Error('cant sign message');
        }
        
      }
    }

	super({
		networkControllerClient,
		connectionControllerClient,
		siweControllerClient: siweConfig,
		defaultChain: Web3HelpersUtil.getCaipDefaultChain(defaultChain),
		tokens: Web3HelpersUtil.getCaipTokens(tokens),
		_sdkVersion: _sdkVersion ?? `html-web3-${ConstantsUtil.VERSION}`,
		...w3mOptions
	  })
	  this.web3Wallet = new Web3Wallet("");
	  this.chains = chains;

	  this.metadata = web3Config.metadata

	  this.projectId = w3mOptions.projectId

	  this.createProvider()

	  this.hasSyncedConnectedAccount = false;

	  Web3StoreUtil.subscribeKey('address', () => {
		this.syncAccount()
	  })
  
	  Web3StoreUtil.subscribeKey('chainId', () => {
		this.syncNetwork(chainImages)
	  })
  
	  this.syncRequestedNetworks(chains, chainImages)
	  this.syncConnectors(web3Config)

	  if (web3Config.EIP6963) {
      if (typeof window !== 'undefined') {
        const currentActiveWallet = window?.localStorage.getItem(ConstantsUtil.WALLET_ID)
        let providers = await Web3.requestEIP6963Providers() as Eip6963ProvidersMap;
        for (const [_, value] of providers) {
          if (value.info.name === currentActiveWallet){
            this.setEIP6963Provider(value.provider as Eip1193Compatible, value.info.name)
          }
        }
      };
	  }
  
	  if (web3Config.email) {
		this.syncEmailConnector(w3mOptions.projectId)
	  }
  
	  if (web3Config.injected) {
		this.checkActiveInjectedProvider(web3Config)
	  }
  }


  // @ts-expect-error: Overriden state type is correct
  public override subscribeState(callback: (state: Web3ModalState) => void) {
    return super.subscribeState(state =>
      callback({
        ...state,
        selectedNetworkId: Web3HelpersUtil.caipNetworkIdToNumber(state.selectedNetworkId)
      })
    )
  }

  public async switchNetwork(chainId: number) {
    const { provider, providerType } = Web3StoreUtil.state;
    if (this.chains){
    const chain = this.chains.find(c => c.chainId === chainId)

    if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID && chain) {
      const WalletConnectProvider = provider as unknown as EthereumProvider;
  
      if (WalletConnectProvider) {
        try {
          this.web3Wallet.web3.setProvider(WalletConnectProvider);
          await this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
          Web3StoreUtil.setChainId(chainId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (switchError: any) {
          await this.web3Wallet.web3.addEthereumChain(chain);
          
        } 
      }
    }  else if (providerType === ConstantsUtil.INJECTED_CONNECTOR_ID && chain) {
      const InjectedProvider = provider
      if (InjectedProvider) {
        try {
        this.web3Wallet.web3.setProvider(InjectedProvider);
        await this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
        Web3StoreUtil.setChainId(chain.chainId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (switchError: any) {
          await this.web3Wallet.web3.addEthereumChain(chain)
        
        }
      }
      } else if (providerType === ConstantsUtil.EIP6963_CONNECTOR_ID && chain) {
      const EIP6963Provider = provider
      if (EIP6963Provider) {
        try {
        this.web3Wallet.web3.setProvider(EIP6963Provider);
        await this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
        Web3StoreUtil.setChainId(chain.chainId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (switchError: any) {
          await this.web3Wallet.web3.addEthereumChain(chain)
        
        }
      }
      } else if (providerType === ConstantsUtil.COINBASE_CONNECTOR_ID && chain) {
      const CoinbaseProvider = provider
      if (CoinbaseProvider) {
        try {

        this.web3Wallet.web3.setProvider(CoinbaseProvider);
        await this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
        Web3StoreUtil.setChainId(chain.chainId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (switchError: any) {
          await this.web3Wallet.web3.addEthereumChain(chain)
        
        }
      }
			  } else if (providerType === ConstantsUtil.EMAIL_CONNECTOR_ID) {
				const emailProvider = provider
				if (emailProvider && chain?.chainId) {
				  try {
					await this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
					Web3StoreUtil.setChainId(chain.chainId)
				  } catch {
					throw new Error('Switching chain failed')
				  }
				}
			}	
		}		
	}

  private async syncEmailConnector(projectId: string) {
    if (typeof window !== 'undefined') {
      this.emailProvider = new W3mFrameProvider(projectId)

      this.addConnector({
        id: ConstantsUtil.EMAIL_CONNECTOR_ID,
        type: 'EMAIL',
        name: 'Email',
        provider: this.emailProvider
      })

      super.setLoading(true)
      const isLoginEmailUsed = this.emailProvider.getLoginEmailUsed()
      super.setLoading(isLoginEmailUsed)
      const isConnected = await this.emailProvider.isConnected()

      if (isConnected) {
        this.setEmailProvider()
      } else {
        super.setLoading(false)
      }
    }
  }

  private watchEIP6963(provider: Eip1193Compatible) {
    function disconnectHandler() {
      localStorage.removeItem(ConstantsUtil.WALLET_ID)
      Web3StoreUtil.reset()
      
      provider.removeListener('disconnect', disconnectHandler)
      provider.removeListener('accountsChanged', accountsChangedHandler)
      provider.removeListener('chainChanged', chainChangedHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        Web3StoreUtil.setAddress(currentAccount)
      } else {
        localStorage.removeItem(ConstantsUtil.WALLET_ID)
        Web3StoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain =
          typeof chainId === 'string'
            ? Web3.utils.hexToNumber(chainId)
            : chainId
        Web3StoreUtil.setChainId(Number(chain))
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private async getWalletConnectProvider() {
    if (!this.walletConnectProvider) {
      try {
        await this.createProvider()
      } catch (error) {
      }
    }

    return this.walletConnectProvider
  }

  private createProvider() {
    if (!this.walletConnectProviderInitPromise && typeof window !== 'undefined') {
      this.walletConnectProviderInitPromise = this.initWalletConnectProvider()
    }

    return this.walletConnectProviderInitPromise
  }


  private watchModal() {
    if (this.emailProvider) {
      this.subscribeState(val => {
        if (!val.open) {
          this.emailProvider?.rejectRpcRequest()
        }
      })
    }
  }

  private async syncAccount() {
    const address = Web3StoreUtil.state.address
    const chainId = Web3StoreUtil.state.chainId
    const isConnected = Web3StoreUtil.state.isConnected

    this.resetAccount()

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`

      this.setIsConnected(isConnected)

      this.setCaipAddress(caipAddress)

      await Promise.all([
        this.syncProfile(address),
        this.syncBalance(address),
        this.fetchTokenBalance(),
        this.getApprovedCaipNetworksData()
      ])

      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.resetWcConnection()
      this.resetNetwork()
    }
  }

  private async syncBalance(address: string) {
    const chainId = Web3StoreUtil.state.chainId
    if (chainId && this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
		const web3 = new Web3(chain.rpcUrls[0]);
		const balance = await web3.eth.getBalance(address)
		// may need to format balance

		this.setBalance(balance.toString(), chain.nativeCurrency.name)
      }
    }
  }

  private async syncProfile(address: string) {
    const chainId = Web3StoreUtil.state.chainId

    if (chainId === 1) {
      const web3 = new Web3("https://eth.llamarpc.com");
      const name = await web3.eth.ens.getName(address)
      const avatar = await web3.eth.ens.getText(address, "avatar");

      if (name) {
        this.setProfileName(name)
      }
      if (avatar) {
        this.setProfileImage(avatar)
      }
    } else {
      this.setProfileName(null)
      this.setProfileImage(null)
    }
  }

  private async syncNetwork(chainImages?: Web3ModalClientOptions['chainImages']) {
    const address = Web3StoreUtil.state.address
    const chainId = Web3StoreUtil.state.chainId
    const isConnected = Web3StoreUtil.state.isConnected
    if (this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
        const caipChainId: CaipNetworkId = `${ConstantsUtil.EIP155}:${chain.chainId}`

        this.setCaipNetwork({
          id: caipChainId,
          name: chain.nativeCurrency.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId]
        })
        if (isConnected && address) {
          const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`
          this.setCaipAddress(caipAddress)
          if (chain.blockExplorerUrls) { // todo go through list
            const url = `${chain.blockExplorerUrls[0]}/address/${address}`
            this.setAddressExplorerUrl(url)
          } else {
            this.setAddressExplorerUrl(undefined)
          }
          if (this.hasSyncedConnectedAccount) {
            await this.syncProfile(address)
            await this.syncBalance(address)
          }
        }
      } else if (isConnected) {
        this.setCaipNetwork({
          id: `${ConstantsUtil.EIP155}:${chainId}`
        })
      }
    }
  }


  private syncConnectors(config: ProviderType) {
    const w3mConnectors: Connector[] = []

    const connectorType = PresetsUtil.ConnectorTypesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID]
    if (connectorType) {
      w3mConnectors.push({
        id: ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        type: connectorType
      })
    }

    if (config.injected) {
      const injectedConnectorType =
        PresetsUtil.ConnectorTypesMap[ConstantsUtil.INJECTED_CONNECTOR_ID]
      if (injectedConnectorType) {
        w3mConnectors.push({
          id: ConstantsUtil.INJECTED_CONNECTOR_ID,
          explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.INJECTED_CONNECTOR_ID],
          imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.INJECTED_CONNECTOR_ID],
          imageUrl: this.options?.connectorImages?.[ConstantsUtil.INJECTED_CONNECTOR_ID],
          name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.INJECTED_CONNECTOR_ID],
          type: injectedConnectorType
        })
      }
    }

    if (config.coinbase) {
      w3mConnectors.push({
        id: ConstantsUtil.COINBASE_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.COINBASE_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.COINBASE_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.COINBASE_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.COINBASE_CONNECTOR_ID],
        type: 'EXTERNAL'
      })
    }

    this.setConnectors(w3mConnectors)
  }

  private syncRequestedNetworks(
    chains: Web3ModalClientOptions['chains'],
    chainImages?: Web3ModalClientOptions['chainImages']
  ) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${ConstantsUtil.EIP155}:${chain.chainId}`,
          name: chain.chainName,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId]
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async setEIP6963Provider(provider: Eip1193Compatible, name: string) {
    window?.localStorage.setItem(ConstantsUtil.WALLET_ID, name)

    if (provider) {
      const chainId = await this.web3Wallet.web3.eth.getChainId();
      const address = await this.web3Wallet.web3.eth.getAccounts();
      if (address && chainId) {
        Web3StoreUtil.setChainId(Number(chainId));
        Web3StoreUtil.setProviderType('injected')
        // Web3StoreUtil.setProvider(config.injected)
        Web3StoreUtil.setIsConnected(true)
        Web3StoreUtil.setAddress(address[0])
        this.watchEIP6963(provider)
      }
    }
  }

  private async setCoinbaseProvider(coinbase: Eip1193Compatible) {
    window?.localStorage.setItem(ConstantsUtil.WALLET_ID, ConstantsUtil.COINBASE_CONNECTOR_ID)
    const coinbaseProvider = coinbase

    if (coinbaseProvider) {
      const chainId = await this.web3Wallet.web3.eth.getChainId();
      const address = await this.web3Wallet.web3.eth.getAccounts();
      if (address && chainId) {
        Web3StoreUtil.setChainId(Number(chainId));
        Web3StoreUtil.setProviderType('coinbaseWallet')
        Web3StoreUtil.setIsConnected(true)
        Web3StoreUtil.setAddress(address[0])
        this.watchCoinbase(coinbaseProvider)
      }
    }
  }

  private watchCoinbase(config: Eip1193Compatible) {
    const provider = config
    const walletId = localStorage.getItem(ConstantsUtil.WALLET_ID)

    function disconnectHandler() {
      localStorage.removeItem(ConstantsUtil.WALLET_ID)
      Web3StoreUtil.reset()

      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('chainChanged', chainChangedHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        Web3StoreUtil.setAddress(currentAccount)
      } else {
        localStorage.removeItem(ConstantsUtil.WALLET_ID)
        Web3StoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId && walletId === ConstantsUtil.COINBASE_CONNECTOR_ID) {
        const chain = Number(chainId)
        Web3StoreUtil.setChainId(chain)
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private checkActiveInjectedProvider(config: ProviderType) {
    this.web3Wallet.web3.setProvider(config.injected);
    const walletId = localStorage.getItem(ConstantsUtil.WALLET_ID)

    if (walletId === ConstantsUtil.INJECTED_CONNECTOR_ID && config.injected) {
      this.setInjectedProvider(config)
      this.watchInjected(config.injected)
    
    }
  }

  private async setEmailProvider() {
    window?.localStorage.setItem(ConstantsUtil.WALLET_ID, ConstantsUtil.EMAIL_CONNECTOR_ID)
    if (this.emailProvider) {
      const { address, chainId } = await this.emailProvider.connect()
      super.setLoading(false)
      if (address && chainId) {
        Web3StoreUtil.setChainId(chainId)
        Web3StoreUtil.setProviderType(ConstantsUtil.EMAIL_CONNECTOR_ID as 'w3mEmail')
        Web3StoreUtil.setProvider(this.emailProvider as CombinedProvider)
        Web3StoreUtil.setIsConnected(true)
        const { isDeployed, address: smartAccountAddress } = await this.initSmartAccount(chainId)
        this.setSmartAccountDeployed(isDeployed)
        if (isDeployed && smartAccountAddress) {
          Web3StoreUtil.setAddress(smartAccountAddress as Address)
        } else {
          Web3StoreUtil.setAddress(address as Address)
        }

        this.watchEmail()
        this.watchModal()
      }
    }
  }


  private watchEmail() {
    if (this.emailProvider) {
      this.emailProvider.onRpcRequest(request => {
        // We only open the modal if it's not a safe (auto-approve)
        if (W3mFrameHelpers.checkIfRequestExists(request)) {
          if (!W3mFrameHelpers.checkIfRequestIsAllowed(request)) {
            super.open({ view: 'ApproveTransaction' })
          }
        } else {
          this.emailProvider?.rejectRpcRequest()
          super.open()
          const method = W3mFrameHelpers.getRequestMethod(request)
          // eslint-disable-next-line no-console
          console.error(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, { method })
          setTimeout(() => {
            this.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
          }, 300)
        }
      })
      this.emailProvider.onRpcResponse(() => {
        super.close()
      })
      this.emailProvider.onNotConnected(() => {
        this.setIsConnected(false)
        super.setLoading(false)
      })
      this.emailProvider.onIsConnected(() => {
        super.setLoading(false)
      })
    }
  }

  private async initSmartAccount(
    chainId: number
  ): Promise<{ isDeployed: boolean; address?: string }> {
    if (!this.emailProvider || !this.options?.enableSmartAccounts) {
      return { isDeployed: false }
    }
    const { smartAccountEnabledNetworks } =
      await this.emailProvider.getSmartAccountEnabledNetworks()

    if (!smartAccountEnabledNetworks.includes(chainId)) {
      return { isDeployed: false }
    }

    return await this.emailProvider.initSmartAccount()
  }

  private async setInjectedProvider(config: ProviderType) {
    window?.localStorage.setItem(ConstantsUtil.WALLET_ID, ConstantsUtil.INJECTED_CONNECTOR_ID)
    const InjectedProvider = config.injected

    if (InjectedProvider) {
		const chainId = await this.web3Wallet.web3.eth.getChainId();
		const address = await this.web3Wallet.web3.eth.getAccounts();
      if (address && chainId) {
        Web3StoreUtil.setChainId(Number(chainId));
        Web3StoreUtil.setProviderType('injected')
        Web3StoreUtil.setIsConnected(true)
        Web3StoreUtil.setAddress(address[0])
        this.watchInjected(InjectedProvider);
      }
    }
  }

  private async watchInjected(config: SupportedProviders) {
    const provider = config as Eip1193Compatible;
    if (provider)
    {
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
      provider.on('disconnect', disconnectHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        Web3StoreUtil.setAddress(currentAccount)
      } else {
        localStorage.removeItem(ConstantsUtil.WALLET_ID)
        Web3StoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain =
          typeof chainId === 'string'
            ? Web3.utils.hexToNumber(chainId)
            : chainId
        Web3StoreUtil.setChainId(Number(chain))
      }
    }

    function disconnectHandler() {
      localStorage.removeItem(ConstantsUtil.WALLET_ID)
      Web3StoreUtil.reset()

      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('chainChanged', chainChangedHandler)
    }

  }



  private async initWalletConnectProvider() {
    const walletConnectProviderOptions: EthereumProviderOptions = {
      projectId: this.projectId,
      showQrModal: false,
      rpcMap: this.chains
        ? this.chains.reduce<Record<number, string>>((map, chain) => {
            map[chain.chainId] = chain.rpcUrls[0]

            return map
          }, {})
        : ({} as Record<number, string>),
      optionalChains: [...this.chains.map(chain => chain.chainId)] as [number],
      metadata: {
        name: this.metadata ? this.metadata.name : '',
        description: this.metadata ? this.metadata.description : '',
        url: this.metadata ? this.metadata.url : '',
        icons: this.metadata ? this.metadata.icons : ['']
      }
    }

    this.walletConnectProvider = await EthereumProvider.init(walletConnectProviderOptions)

    await this.checkActiveWalletConnectProvider()
}

private async checkActiveWalletConnectProvider() {
    const WalletConnectProvider = await this.getWalletConnectProvider()
    const walletId = localStorage.getItem(ConstantsUtil.WALLET_ID)

    if (WalletConnectProvider) {
      if (walletId === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        await this.setWalletConnectProvider()
      }
    }
  }

  private async disconnectHandler() {
    localStorage.removeItem(ConstantsUtil.WALLET_ID)
    Web3StoreUtil.reset()
  }

  

  private async accountsChangedHandler(accounts: string[]) {
    const currentAccount = accounts?.[0];
    if (currentAccount) {
      Web3StoreUtil.setAddress(currentAccount as Address)
    } else {
      localStorage.removeItem(ConstantsUtil.WALLET_ID)
      Web3StoreUtil.reset()
    }
  }

  private async chainChangedHandler(chainId: string) {
    if (chainId) {
      Web3StoreUtil.setChainId(Number(this.web3Wallet.web3.utils.toNumber(chainId)));
    }
  }

  private async setWalletConnectProvider() {
    window?.localStorage.setItem(
      ConstantsUtil.WALLET_ID,
      ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
    )
    const WalletConnectProvider = await this.getWalletConnectProvider()
    if (WalletConnectProvider) {
      Web3StoreUtil.setChainId(WalletConnectProvider.chainId)
      Web3StoreUtil.setProviderType('walletConnect')
      Web3StoreUtil.setProvider(WalletConnectProvider as Eip1193Compatible)
      Web3StoreUtil.setIsConnected(true)
      Web3StoreUtil.setAddress(WalletConnectProvider.accounts?.[0])
      this.watchWalletConnect()
    }
  }

  private async watchWalletConnect() {
    const provider = await this.getWalletConnectProvider()

    function disconnectHandler() {
      localStorage.removeItem(ConstantsUtil.WALLET_ID)
      Web3StoreUtil.reset()

      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('chainChanged', chainChangedHandler)
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain = Number(Web3.utils.hexToNumber(chainId))
        Web3StoreUtil.setChainId(chain)
      }
    }

    const accountsChangedHandler = async (accounts: string[]) => {
      if (accounts.length > 0) {
        await this.setWalletConnectProvider()
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }
}
 