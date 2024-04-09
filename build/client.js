"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Modal = void 0;
const ethereum_provider_1 = __importDefault(require("@walletconnect/ethereum-provider"));
const wallet_1 = require("@web3modal/wallet");
const scaffold_utils_1 = require("@web3modal/scaffold-utils");
const scaffold_1 = require("@web3modal/scaffold");
const wallet_2 = require("@web3modal/wallet");
const web3_1 = __importDefault(require("web3"));
const web3Wallet_1 = require("./utils/web3Wallet");
const web3StoreUtil_1 = require("./scaffold-utils/web3StoreUtil");
const ConstantsUtil_1 = require("./scaffold-utils/ConstantsUtil");
const HelpersUtil_1 = require("./scaffold-utils/HelpersUtil");
// -- Client --------------------------------------------------------------------
class Web3Modal extends scaffold_1.Web3ModalScaffold {
    constructor(options) {
        const { web3Config, siweConfig, chains, defaultChain, tokens, chainImages, _sdkVersion } = options, w3mOptions = __rest(options, ["web3Config", "siweConfig", "chains", "defaultChain", "tokens", "chainImages", "_sdkVersion"]);
        if (!w3mOptions.projectId) {
            throw new Error('web3modal:constructor - projectId is undefined');
        }
        const networkControllerClient = {
            switchCaipNetwork: (caipNetwork) => __awaiter(this, void 0, void 0, function* () {
                const chainId = HelpersUtil_1.HelpersUtil.caipNetworkIdToNumber(caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.id);
                if (chainId) {
                    try {
                        yield this.switchNetwork(chainId);
                    }
                    catch (error) {
                        throw new Error('networkControllerClient:switchCaipNetwork - unable to switch chain');
                    }
                }
            }),
            getApprovedCaipNetworksData: () => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e;
                    const walletChoice = localStorage.getItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                    if (walletChoice === null || walletChoice === void 0 ? void 0 : walletChoice.includes(ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID)) {
                        const provider = yield this.getWalletConnectProvider();
                        if (!provider) {
                            throw new Error('networkControllerClient:getApprovedCaipNetworks - connector is undefined');
                        }
                        const ns = (_b = (_a = provider.signer) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.namespaces;
                        const nsMethods = (_c = ns === null || ns === void 0 ? void 0 : ns[ConstantsUtil_1.ConstantsUtil.EIP155]) === null || _c === void 0 ? void 0 : _c.methods;
                        const nsChains = (_d = ns === null || ns === void 0 ? void 0 : ns[ConstantsUtil_1.ConstantsUtil.EIP155]) === null || _d === void 0 ? void 0 : _d.chains;
                        const result = {
                            supportsAllNetworks: (_e = nsMethods === null || nsMethods === void 0 ? void 0 : nsMethods.includes(ConstantsUtil_1.ConstantsUtil.ADD_CHAIN_METHOD)) !== null && _e !== void 0 ? _e : false,
                            approvedCaipNetworkIds: nsChains
                        };
                        resolve(result);
                    }
                    else {
                        const result = {
                            approvedCaipNetworkIds: undefined,
                            supportsAllNetworks: true
                        };
                        resolve(result);
                    }
                }));
            })
        };
        const connectionControllerClient = {
            connectWalletConnect: (onUri) => __awaiter(this, void 0, void 0, function* () {
                const WalletConnectProvider = yield this.getWalletConnectProvider();
                if (!WalletConnectProvider) {
                    throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined');
                }
                WalletConnectProvider.on('display_uri', (uri) => {
                    onUri(uri);
                });
                yield WalletConnectProvider.connect();
                yield this.setWalletConnectProvider();
            }),
            //  @ts-expect-error TODO expected types in arguments are incomplete
            connectExternal: (_f) => __awaiter(this, [_f], void 0, function* ({ id, info, provider }) {
                if (id === ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID) {
                    const InjectedProvider = web3Config.injected;
                    if (!InjectedProvider) {
                        throw new Error('connectionControllerClient:connectInjected - provider is undefined');
                    }
                    try {
                        this.web3Wallet.web3.setProvider(InjectedProvider);
                        yield this.web3Wallet.web3.eth.getAccounts();
                        this.setInjectedProvider(web3Config);
                    }
                    catch (error) {
                        // set error
                    }
                }
                else if (id === ConstantsUtil_1.ConstantsUtil.EIP6963_CONNECTOR_ID && info && provider) {
                    try {
                        const EIP6963Provider = provider;
                        yield this.web3Wallet.web3.eth.getAccounts();
                        this.setEIP6963Provider(EIP6963Provider, info.name);
                    }
                    catch (error) {
                    }
                }
                else if (id === ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID) {
                    const CoinbaseProvider = web3Config.coinbase;
                    if (!CoinbaseProvider) {
                        throw new Error('connectionControllerClient:connectCoinbase - connector is undefined');
                    }
                    try {
                        this.web3Wallet.web3.setProvider(CoinbaseProvider);
                        yield this.web3Wallet.web3.eth.getAccounts();
                        this.setCoinbaseProvider(CoinbaseProvider);
                    }
                    catch (error) {
                        // EthersStoreUtil.setError(error)
                    }
                }
                else if (id === ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID) {
                    this.setEmailProvider();
                }
            }),
            checkInstalled(ids) {
                if (!ids) {
                    return Boolean(window.ethereum);
                }
                if (web3Config.injected) {
                    if (!(window === null || window === void 0 ? void 0 : window.ethereum)) {
                        return false;
                    }
                }
                return ids.some(id => { var _a; return Boolean((_a = window.ethereum) === null || _a === void 0 ? void 0 : _a[String(id)]); });
            },
            disconnect: () => __awaiter(this, void 0, void 0, function* () {
                var _g, _h;
                const provider = web3StoreUtil_1.Web3StoreUtil.state.provider;
                const providerType = web3StoreUtil_1.Web3StoreUtil.state.providerType;
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
                if ((_g = siweConfig === null || siweConfig === void 0 ? void 0 : siweConfig.options) === null || _g === void 0 ? void 0 : _g.signOutOnDisconnect) {
                    yield siweConfig.signOut();
                }
                if (providerType === ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
                    const WalletConnectProvider = provider;
                    yield WalletConnectProvider.disconnect();
                    provider === null || provider === void 0 ? void 0 : provider.emit('disconnect');
                    // eslint-disable-next-line no-negated-condition
                }
                else if (providerType !== ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID) {
                    provider === null || provider === void 0 ? void 0 : provider.emit('disconnect');
                }
                else {
                    (_h = this.emailProvider) === null || _h === void 0 ? void 0 : _h.disconnect();
                }
                provider === null || provider === void 0 ? void 0 : provider.emit('disconnect');
            }),
            signMessage: (message) => __awaiter(this, void 0, void 0, function* () {
                const provider = web3StoreUtil_1.Web3StoreUtil.state.provider;
                if (!provider) {
                    throw new Error('connectionControllerClient:signMessage - provider is undefined');
                }
                if (typeof (web3StoreUtil_1.Web3StoreUtil.state.address) === 'string') {
                    const s = yield this.web3Wallet.web3.eth.sign(message, web3StoreUtil_1.Web3StoreUtil.state.address);
                    if (typeof (s) === 'string')
                        return s;
                    else {
                        return s.signature;
                    }
                }
                else {
                    throw new Error('cant sign message');
                }
            })
        };
        super(Object.assign({ networkControllerClient,
            connectionControllerClient, siweControllerClient: siweConfig, defaultChain: HelpersUtil_1.HelpersUtil.getCaipDefaultChain(defaultChain), tokens: HelpersUtil_1.HelpersUtil.getCaipTokens(tokens), _sdkVersion: _sdkVersion !== null && _sdkVersion !== void 0 ? _sdkVersion : `html-web3-${ConstantsUtil_1.ConstantsUtil.VERSION}` }, w3mOptions));
        this.options = undefined;
        this.EIP6963Providers = [];
        this.web3Wallet = new web3Wallet_1.Web3Wallet("");
        this.chains = chains;
        this.metadata = web3Config.metadata;
        this.projectId = w3mOptions.projectId;
        this.createProvider();
        this.hasSyncedConnectedAccount = false;
        web3StoreUtil_1.Web3StoreUtil.subscribeKey('address', () => {
            this.syncAccount();
        });
        web3StoreUtil_1.Web3StoreUtil.subscribeKey('chainId', () => {
            this.syncNetwork(chainImages);
        });
        this.syncRequestedNetworks(chains, chainImages);
        this.syncConnectors(web3Config);
        if (web3Config.EIP6963) {
            if (typeof window !== 'undefined') {
                this.listenConnectors(web3Config.EIP6963);
                this.checkActive6963Provider();
            }
            ;
        }
        if (web3Config.email) {
            this.syncEmailConnector(w3mOptions.projectId);
        }
        if (web3Config.injected) {
            this.checkActiveInjectedProvider(web3Config);
        }
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const { provider, providerType } = web3StoreUtil_1.Web3StoreUtil.state;
            localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
            web3StoreUtil_1.Web3StoreUtil.reset();
            if (providerType === 'injected' || providerType === 'eip6963') {
                provider === null || provider === void 0 ? void 0 : provider.emit('disconnect');
            }
            else {
                const walletConnectProvider = provider;
                if (walletConnectProvider) {
                    try {
                        web3StoreUtil_1.Web3StoreUtil.setError(undefined);
                        yield walletConnectProvider.disconnect();
                    }
                    catch (error) {
                        web3StoreUtil_1.Web3StoreUtil.setError(error);
                    }
                }
            }
        });
    }
    // @ts-expect-error: Overriden state type is correct
    subscribeState(callback) {
        return super.subscribeState(state => callback(Object.assign(Object.assign({}, state), { selectedNetworkId: HelpersUtil_1.HelpersUtil.caipNetworkIdToNumber(state.selectedNetworkId) })));
    }
    switchNetwork(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { provider, providerType } = web3StoreUtil_1.Web3StoreUtil.state;
            if (this.chains) {
                const chain = this.chains.find(c => c.chainId === chainId);
                if (providerType === ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID && chain) {
                    const WalletConnectProvider = provider;
                    if (WalletConnectProvider) {
                        try {
                            this.web3Wallet.web3.setProvider(WalletConnectProvider);
                            yield this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
                            web3StoreUtil_1.Web3StoreUtil.setChainId(chainId);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }
                        catch (switchError) {
                            yield this.web3Wallet.web3.addEthereumChain(chain);
                        }
                    }
                }
                else if (providerType === ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID && chain) {
                    const InjectedProvider = provider;
                    if (InjectedProvider) {
                        try {
                            this.web3Wallet.web3.setProvider(InjectedProvider);
                            yield this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
                            web3StoreUtil_1.Web3StoreUtil.setChainId(chain.chainId);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }
                        catch (switchError) {
                            yield this.web3Wallet.web3.addEthereumChain(chain);
                        }
                    }
                }
                else if (providerType === ConstantsUtil_1.ConstantsUtil.EIP6963_CONNECTOR_ID && chain) {
                    const EIP6963Provider = provider;
                    if (EIP6963Provider) {
                        try {
                            this.web3Wallet.web3.setProvider(EIP6963Provider);
                            yield this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
                            web3StoreUtil_1.Web3StoreUtil.setChainId(chain.chainId);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }
                        catch (switchError) {
                            yield this.web3Wallet.web3.addEthereumChain(chain);
                        }
                    }
                }
                else if (providerType === ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID && chain) {
                    const CoinbaseProvider = provider;
                    if (CoinbaseProvider) {
                        try {
                            this.web3Wallet.web3.setProvider(CoinbaseProvider);
                            yield this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
                            web3StoreUtil_1.Web3StoreUtil.setChainId(chain.chainId);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }
                        catch (switchError) {
                            yield this.web3Wallet.web3.addEthereumChain(chain);
                        }
                    }
                }
                else if (providerType === ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID) {
                    const emailProvider = provider;
                    if (emailProvider && (chain === null || chain === void 0 ? void 0 : chain.chainId)) {
                        try {
                            yield this.web3Wallet.web3.switchEthereumChain(this.web3Wallet.web3.utils.toHex(chainId));
                            web3StoreUtil_1.Web3StoreUtil.setChainId(chain.chainId);
                        }
                        catch (_a) {
                            throw new Error('Switching chain failed');
                        }
                    }
                }
            }
        });
    }
    syncEmailConnector(projectId) {
        const _super = Object.create(null, {
            setLoading: { get: () => super.setLoading }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window !== 'undefined') {
                this.emailProvider = new wallet_1.W3mFrameProvider(projectId);
                this.addConnector({
                    id: ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID,
                    type: 'EMAIL',
                    name: 'Email',
                    provider: this.emailProvider
                });
                _super.setLoading.call(this, true);
                const isLoginEmailUsed = this.emailProvider.getLoginEmailUsed();
                _super.setLoading.call(this, isLoginEmailUsed);
                const isConnected = yield this.emailProvider.isConnected();
                if (isConnected) {
                    this.setEmailProvider();
                }
                else {
                    _super.setLoading.call(this, false);
                }
            }
        });
    }
    eip6963EventHandler(event) {
        var _a, _b, _c;
        if (event.detail) {
            const { info, provider } = event.detail;
            const connectors = this.getConnectors();
            const existingConnector = connectors.find(c => c.name === info.name);
            if (!existingConnector) {
                const type = scaffold_utils_1.PresetsUtil.ConnectorTypesMap[ConstantsUtil_1.ConstantsUtil.EIP6963_CONNECTOR_ID];
                if (type) {
                    this.addConnector({
                        id: ConstantsUtil_1.ConstantsUtil.EIP6963_CONNECTOR_ID,
                        type,
                        imageUrl: (_a = info.icon) !== null && _a !== void 0 ? _a : (_c = (_b = this.options) === null || _b === void 0 ? void 0 : _b.connectorImages) === null || _c === void 0 ? void 0 : _c[ConstantsUtil_1.ConstantsUtil.EIP6963_CONNECTOR_ID],
                        name: info.name,
                        provider,
                        info
                    });
                    const eip6963ProviderObj = {
                        name: info.name,
                        provider
                    };
                    this.EIP6963Providers.push(eip6963ProviderObj);
                }
            }
        }
    }
    listenConnectors(enableEIP6963) {
        if (typeof window !== 'undefined' && enableEIP6963) {
            const handler = this.eip6963EventHandler.bind(this);
            window.addEventListener(ConstantsUtil_1.ConstantsUtil.EIP6963_ANNOUNCE_EVENT, handler);
            window.dispatchEvent(new Event(ConstantsUtil_1.ConstantsUtil.EIP6963_REQUEST_EVENT));
        }
    }
    watchEIP6963(provider) {
        function disconnectHandler() {
            localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
            web3StoreUtil_1.Web3StoreUtil.reset();
            provider.removeListener('disconnect', disconnectHandler);
            provider.removeListener('accountsChanged', accountsChangedHandler);
            provider.removeListener('chainChanged', chainChangedHandler);
        }
        function accountsChangedHandler(accounts) {
            const currentAccount = accounts === null || accounts === void 0 ? void 0 : accounts[0];
            if (currentAccount) {
                web3StoreUtil_1.Web3StoreUtil.setAddress(currentAccount);
            }
            else {
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
            }
        }
        function chainChangedHandler(chainId) {
            if (chainId) {
                const chain = typeof chainId === 'string'
                    ? web3_1.default.utils.hexToNumber(chainId)
                    : chainId;
                web3StoreUtil_1.Web3StoreUtil.setChainId(Number(chain));
            }
        }
        if (provider) {
            provider.on('disconnect', disconnectHandler);
            provider.on('accountsChanged', accountsChangedHandler);
            provider.on('chainChanged', chainChangedHandler);
        }
    }
    getWalletConnectProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.walletConnectProvider) {
                try {
                    yield this.createProvider();
                }
                catch (error) {
                }
            }
            return this.walletConnectProvider;
        });
    }
    createProvider() {
        if (!this.walletConnectProviderInitPromise && typeof window !== 'undefined') {
            this.walletConnectProviderInitPromise = this.initWalletConnectProvider();
        }
        return this.walletConnectProviderInitPromise;
    }
    watchModal() {
        if (this.emailProvider) {
            this.subscribeState(val => {
                var _a;
                if (!val.open) {
                    (_a = this.emailProvider) === null || _a === void 0 ? void 0 : _a.rejectRpcRequest();
                }
            });
        }
    }
    syncAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const address = web3StoreUtil_1.Web3StoreUtil.state.address;
            const chainId = web3StoreUtil_1.Web3StoreUtil.state.chainId;
            const isConnected = web3StoreUtil_1.Web3StoreUtil.state.isConnected;
            this.resetAccount();
            if (isConnected && address && chainId) {
                const caipAddress = `${ConstantsUtil_1.ConstantsUtil.EIP155}:${chainId}:${address}`;
                this.setIsConnected(isConnected);
                this.setCaipAddress(caipAddress);
                yield Promise.all([
                    this.syncProfile(address),
                    this.syncBalance(address),
                    this.fetchTokenBalance(),
                    this.getApprovedCaipNetworksData()
                ]);
                this.hasSyncedConnectedAccount = true;
            }
            else if (!isConnected && this.hasSyncedConnectedAccount) {
                this.resetWcConnection();
                this.resetNetwork();
            }
        });
    }
    syncBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const chainId = web3StoreUtil_1.Web3StoreUtil.state.chainId;
            if (chainId && this.chains) {
                const chain = this.chains.find(c => c.chainId === chainId);
                if (chain) {
                    const web3 = new web3_1.default(chain.rpcUrls[0]);
                    const balance = yield web3.eth.getBalance(address);
                    // may need to format balance
                    this.setBalance(balance.toString(), chain.nativeCurrency.name);
                }
            }
        });
    }
    syncProfile(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const chainId = web3StoreUtil_1.Web3StoreUtil.state.chainId;
            if (chainId === 1) {
                const web3 = new web3_1.default("https://eth.llamarpc.com");
                const name = yield web3.eth.ens.getName(address);
                const avatar = yield web3.eth.ens.getText(address, "avatar");
                if (name) {
                    this.setProfileName(name);
                }
                if (avatar) {
                    this.setProfileImage(avatar);
                }
            }
            else {
                this.setProfileName(null);
                this.setProfileImage(null);
            }
        });
    }
    syncNetwork(chainImages) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = web3StoreUtil_1.Web3StoreUtil.state.address;
            const chainId = web3StoreUtil_1.Web3StoreUtil.state.chainId;
            const isConnected = web3StoreUtil_1.Web3StoreUtil.state.isConnected;
            if (this.chains) {
                const chain = this.chains.find(c => c.chainId === chainId);
                if (chain) {
                    const caipChainId = `${ConstantsUtil_1.ConstantsUtil.EIP155}:${chain.chainId}`;
                    this.setCaipNetwork({
                        id: caipChainId,
                        name: chain.nativeCurrency.name,
                        imageId: scaffold_utils_1.PresetsUtil.EIP155NetworkImageIds[chain.chainId],
                        imageUrl: chainImages === null || chainImages === void 0 ? void 0 : chainImages[chain.chainId]
                    });
                    if (isConnected && address) {
                        const caipAddress = `${ConstantsUtil_1.ConstantsUtil.EIP155}:${chainId}:${address}`;
                        this.setCaipAddress(caipAddress);
                        if (chain.blockExplorerUrls) { // todo go through list
                            const url = `${chain.blockExplorerUrls[0]}/address/${address}`;
                            this.setAddressExplorerUrl(url);
                        }
                        else {
                            this.setAddressExplorerUrl(undefined);
                        }
                        if (this.hasSyncedConnectedAccount) {
                            yield this.syncProfile(address);
                            yield this.syncBalance(address);
                        }
                    }
                }
                else if (isConnected) {
                    this.setCaipNetwork({
                        id: `${ConstantsUtil_1.ConstantsUtil.EIP155}:${chainId}`
                    });
                }
            }
        });
    }
    syncConnectors(config) {
        var _a, _b, _c, _d, _e, _f;
        const w3mConnectors = [];
        const connectorType = scaffold_utils_1.PresetsUtil.ConnectorTypesMap[ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID];
        if (connectorType) {
            w3mConnectors.push({
                id: ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID,
                explorerId: scaffold_utils_1.PresetsUtil.ConnectorExplorerIds[ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
                imageId: scaffold_utils_1.PresetsUtil.ConnectorImageIds[ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
                imageUrl: (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.connectorImages) === null || _b === void 0 ? void 0 : _b[ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
                name: scaffold_utils_1.PresetsUtil.ConnectorNamesMap[ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
                type: connectorType
            });
        }
        if (config.injected) {
            const injectedConnectorType = scaffold_utils_1.PresetsUtil.ConnectorTypesMap[ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID];
            if (injectedConnectorType) {
                w3mConnectors.push({
                    id: ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID,
                    explorerId: scaffold_utils_1.PresetsUtil.ConnectorExplorerIds[ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID],
                    imageId: scaffold_utils_1.PresetsUtil.ConnectorImageIds[ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID],
                    imageUrl: (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.connectorImages) === null || _d === void 0 ? void 0 : _d[ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID],
                    name: scaffold_utils_1.PresetsUtil.ConnectorNamesMap[ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID],
                    type: injectedConnectorType
                });
            }
        }
        if (config.coinbase) {
            w3mConnectors.push({
                id: ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID,
                explorerId: scaffold_utils_1.PresetsUtil.ConnectorExplorerIds[ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID],
                imageId: scaffold_utils_1.PresetsUtil.ConnectorImageIds[ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID],
                imageUrl: (_f = (_e = this.options) === null || _e === void 0 ? void 0 : _e.connectorImages) === null || _f === void 0 ? void 0 : _f[ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID],
                name: scaffold_utils_1.PresetsUtil.ConnectorNamesMap[ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID],
                type: 'EXTERNAL'
            });
        }
        this.setConnectors(w3mConnectors);
    }
    checkActive6963Provider() {
        const currentActiveWallet = window === null || window === void 0 ? void 0 : window.localStorage.getItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
        if (currentActiveWallet) {
            const currentProvider = this.EIP6963Providers.find(provider => provider.name === currentActiveWallet);
            if (currentProvider) {
                this.setEIP6963Provider(currentProvider.provider, currentProvider.name);
            }
        }
    }
    syncRequestedNetworks(chains, chainImages) {
        const requestedCaipNetworks = chains === null || chains === void 0 ? void 0 : chains.map(chain => ({
            id: `${ConstantsUtil_1.ConstantsUtil.EIP155}:${chain.chainId}`,
            name: chain.chainName,
            imageId: scaffold_utils_1.PresetsUtil.EIP155NetworkImageIds[chain.chainId],
            imageUrl: chainImages === null || chainImages === void 0 ? void 0 : chainImages[chain.chainId]
        }));
        this.setRequestedCaipNetworks(requestedCaipNetworks !== null && requestedCaipNetworks !== void 0 ? requestedCaipNetworks : []);
    }
    setEIP6963Provider(provider, name) {
        return __awaiter(this, void 0, void 0, function* () {
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID, name);
            if (provider) {
                const chainId = yield this.web3Wallet.web3.eth.getChainId();
                const address = yield this.web3Wallet.web3.eth.getAccounts();
                if (address && chainId) {
                    web3StoreUtil_1.Web3StoreUtil.setChainId(Number(chainId));
                    web3StoreUtil_1.Web3StoreUtil.setProviderType('injected');
                    // Web3StoreUtil.setProvider(config.injected)
                    web3StoreUtil_1.Web3StoreUtil.setIsConnected(true);
                    web3StoreUtil_1.Web3StoreUtil.setAddress(address[0]);
                    this.watchEIP6963(provider);
                }
            }
        });
    }
    setCoinbaseProvider(coinbase) {
        return __awaiter(this, void 0, void 0, function* () {
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID, ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID);
            const coinbaseProvider = coinbase;
            if (coinbaseProvider) {
                const chainId = yield this.web3Wallet.web3.eth.getChainId();
                const address = yield this.web3Wallet.web3.eth.getAccounts();
                if (address && chainId) {
                    web3StoreUtil_1.Web3StoreUtil.setChainId(Number(chainId));
                    web3StoreUtil_1.Web3StoreUtil.setProviderType('coinbaseWallet');
                    web3StoreUtil_1.Web3StoreUtil.setIsConnected(true);
                    web3StoreUtil_1.Web3StoreUtil.setAddress(address[0]);
                    this.watchCoinbase(coinbaseProvider);
                }
            }
        });
    }
    watchCoinbase(config) {
        const provider = config;
        const walletId = localStorage.getItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
        function disconnectHandler() {
            localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
            web3StoreUtil_1.Web3StoreUtil.reset();
            provider === null || provider === void 0 ? void 0 : provider.removeListener('disconnect', disconnectHandler);
            provider === null || provider === void 0 ? void 0 : provider.removeListener('accountsChanged', accountsChangedHandler);
            provider === null || provider === void 0 ? void 0 : provider.removeListener('chainChanged', chainChangedHandler);
        }
        function accountsChangedHandler(accounts) {
            const currentAccount = accounts === null || accounts === void 0 ? void 0 : accounts[0];
            if (currentAccount) {
                web3StoreUtil_1.Web3StoreUtil.setAddress(currentAccount);
            }
            else {
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
            }
        }
        function chainChangedHandler(chainId) {
            if (chainId && walletId === ConstantsUtil_1.ConstantsUtil.COINBASE_CONNECTOR_ID) {
                const chain = Number(chainId);
                web3StoreUtil_1.Web3StoreUtil.setChainId(chain);
            }
        }
        if (provider) {
            provider.on('disconnect', disconnectHandler);
            provider.on('accountsChanged', accountsChangedHandler);
            provider.on('chainChanged', chainChangedHandler);
        }
    }
    checkActiveInjectedProvider(config) {
        this.web3Wallet.web3.setProvider(config.injected);
        const walletId = localStorage.getItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
        if (walletId === ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID && config.injected) {
            this.setInjectedProvider(config);
            this.watchInjected(config.injected);
        }
    }
    setEmailProvider() {
        const _super = Object.create(null, {
            setLoading: { get: () => super.setLoading }
        });
        return __awaiter(this, void 0, void 0, function* () {
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID, ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID);
            if (this.emailProvider) {
                const { address, chainId } = yield this.emailProvider.connect();
                _super.setLoading.call(this, false);
                if (address && chainId) {
                    web3StoreUtil_1.Web3StoreUtil.setChainId(chainId);
                    web3StoreUtil_1.Web3StoreUtil.setProviderType(ConstantsUtil_1.ConstantsUtil.EMAIL_CONNECTOR_ID);
                    web3StoreUtil_1.Web3StoreUtil.setProvider(this.emailProvider);
                    web3StoreUtil_1.Web3StoreUtil.setIsConnected(true);
                    const { isDeployed, address: smartAccountAddress } = yield this.initSmartAccount(chainId);
                    this.setSmartAccountDeployed(isDeployed);
                    if (isDeployed && smartAccountAddress) {
                        web3StoreUtil_1.Web3StoreUtil.setAddress(smartAccountAddress);
                    }
                    else {
                        web3StoreUtil_1.Web3StoreUtil.setAddress(address);
                    }
                    this.watchEmail();
                    this.watchModal();
                }
            }
        });
    }
    watchEmail() {
        if (this.emailProvider) {
            this.emailProvider.onRpcRequest(request => {
                var _a;
                // We only open the modal if it's not a safe (auto-approve)
                if (wallet_2.W3mFrameHelpers.checkIfRequestExists(request)) {
                    if (!wallet_2.W3mFrameHelpers.checkIfRequestIsAllowed(request)) {
                        super.open({ view: 'ApproveTransaction' });
                    }
                }
                else {
                    (_a = this.emailProvider) === null || _a === void 0 ? void 0 : _a.rejectRpcRequest();
                    super.open();
                    const method = wallet_2.W3mFrameHelpers.getRequestMethod(request);
                    // eslint-disable-next-line no-console
                    console.error(wallet_2.W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, { method });
                    setTimeout(() => {
                        this.showErrorMessage(wallet_2.W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE);
                    }, 300);
                }
            });
            this.emailProvider.onRpcResponse(() => {
                super.close();
            });
            this.emailProvider.onNotConnected(() => {
                this.setIsConnected(false);
                super.setLoading(false);
            });
            this.emailProvider.onIsConnected(() => {
                super.setLoading(false);
            });
        }
    }
    initSmartAccount(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.emailProvider || !((_a = this.options) === null || _a === void 0 ? void 0 : _a.enableSmartAccounts)) {
                return { isDeployed: false };
            }
            const { smartAccountEnabledNetworks } = yield this.emailProvider.getSmartAccountEnabledNetworks();
            if (!smartAccountEnabledNetworks.includes(chainId)) {
                return { isDeployed: false };
            }
            return yield this.emailProvider.initSmartAccount();
        });
    }
    setInjectedProvider(config) {
        return __awaiter(this, void 0, void 0, function* () {
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID, ConstantsUtil_1.ConstantsUtil.INJECTED_CONNECTOR_ID);
            const InjectedProvider = config.injected;
            if (InjectedProvider) {
                const chainId = yield this.web3Wallet.web3.eth.getChainId();
                const address = yield this.web3Wallet.web3.eth.getAccounts();
                if (address && chainId) {
                    web3StoreUtil_1.Web3StoreUtil.setChainId(Number(chainId));
                    web3StoreUtil_1.Web3StoreUtil.setProviderType('injected');
                    web3StoreUtil_1.Web3StoreUtil.setIsConnected(true);
                    web3StoreUtil_1.Web3StoreUtil.setAddress(address[0]);
                    this.watchInjected(InjectedProvider);
                }
            }
        });
    }
    watchInjected(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = config;
            if (provider) {
                provider.on('accountsChanged', accountsChangedHandler);
                provider.on('chainChanged', chainChangedHandler);
                provider.on('disconnect', disconnectHandler);
            }
            function accountsChangedHandler(accounts) {
                const currentAccount = accounts === null || accounts === void 0 ? void 0 : accounts[0];
                if (currentAccount) {
                    web3StoreUtil_1.Web3StoreUtil.setAddress(currentAccount);
                }
                else {
                    localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                    web3StoreUtil_1.Web3StoreUtil.reset();
                }
            }
            function chainChangedHandler(chainId) {
                if (chainId) {
                    const chain = typeof chainId === 'string'
                        ? web3_1.default.utils.hexToNumber(chainId)
                        : chainId;
                    web3StoreUtil_1.Web3StoreUtil.setChainId(Number(chain));
                }
            }
            function disconnectHandler() {
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
                provider === null || provider === void 0 ? void 0 : provider.removeListener('disconnect', disconnectHandler);
                provider === null || provider === void 0 ? void 0 : provider.removeListener('accountsChanged', accountsChangedHandler);
                provider === null || provider === void 0 ? void 0 : provider.removeListener('chainChanged', chainChangedHandler);
            }
        });
    }
    initWalletConnectProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            const walletConnectProviderOptions = {
                projectId: this.projectId,
                showQrModal: false,
                rpcMap: this.chains
                    ? this.chains.reduce((map, chain) => {
                        map[chain.chainId] = chain.rpcUrls[0];
                        return map;
                    }, {})
                    : {},
                optionalChains: [...this.chains.map(chain => chain.chainId)],
                metadata: {
                    name: this.metadata ? this.metadata.name : '',
                    description: this.metadata ? this.metadata.description : '',
                    url: this.metadata ? this.metadata.url : '',
                    icons: this.metadata ? this.metadata.icons : ['']
                }
            };
            this.walletConnectProvider = yield ethereum_provider_1.default.init(walletConnectProviderOptions);
            yield this.checkActiveWalletConnectProvider();
        });
    }
    checkActiveWalletConnectProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            const WalletConnectProvider = yield this.getWalletConnectProvider();
            const walletId = localStorage.getItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
            if (WalletConnectProvider) {
                if (walletId === ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
                    yield this.setWalletConnectProvider();
                }
            }
        });
    }
    disconnectHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
            web3StoreUtil_1.Web3StoreUtil.reset();
        });
    }
    accountsChangedHandler(accounts) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentAccount = accounts === null || accounts === void 0 ? void 0 : accounts[0];
            if (currentAccount) {
                web3StoreUtil_1.Web3StoreUtil.setAddress(currentAccount);
            }
            else {
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
            }
        });
    }
    chainChangedHandler(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (chainId) {
                web3StoreUtil_1.Web3StoreUtil.setChainId(Number(this.web3Wallet.web3.utils.toNumber(chainId)));
            }
        });
    }
    setWalletConnectProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID, ConstantsUtil_1.ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID);
            const WalletConnectProvider = yield this.getWalletConnectProvider();
            if (WalletConnectProvider) {
                web3StoreUtil_1.Web3StoreUtil.setChainId(WalletConnectProvider.chainId);
                web3StoreUtil_1.Web3StoreUtil.setProviderType('walletConnect');
                web3StoreUtil_1.Web3StoreUtil.setProvider(WalletConnectProvider);
                web3StoreUtil_1.Web3StoreUtil.setIsConnected(true);
                web3StoreUtil_1.Web3StoreUtil.setAddress((_a = WalletConnectProvider.accounts) === null || _a === void 0 ? void 0 : _a[0]);
                this.watchWalletConnect();
            }
        });
    }
    watchWalletConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = yield this.getWalletConnectProvider();
            function disconnectHandler() {
                localStorage.removeItem(ConstantsUtil_1.ConstantsUtil.WALLET_ID);
                web3StoreUtil_1.Web3StoreUtil.reset();
                provider === null || provider === void 0 ? void 0 : provider.removeListener('disconnect', disconnectHandler);
                provider === null || provider === void 0 ? void 0 : provider.removeListener('accountsChanged', accountsChangedHandler);
                provider === null || provider === void 0 ? void 0 : provider.removeListener('chainChanged', chainChangedHandler);
            }
            function chainChangedHandler(chainId) {
                if (chainId) {
                    const chain = Number(web3_1.default.utils.hexToNumber(chainId));
                    web3StoreUtil_1.Web3StoreUtil.setChainId(chain);
                }
            }
            const accountsChangedHandler = (accounts) => __awaiter(this, void 0, void 0, function* () {
                if (accounts.length > 0) {
                    yield this.setWalletConnectProvider();
                }
            });
            if (provider) {
                provider.on('disconnect', disconnectHandler);
                provider.on('accountsChanged', accountsChangedHandler);
                provider.on('chainChanged', chainChangedHandler);
            }
        });
    }
}
exports.Web3Modal = Web3Modal;
