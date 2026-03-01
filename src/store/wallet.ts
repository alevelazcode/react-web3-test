import { BLOCKCHAIN_ENVIRONMENT, NETWORK_NAME } from "@constants";
import { chainId } from "@constants/chainIds";
import { TESTNET_NETWORKS, TestnetNetwork } from "@constants/testnetNetworks";
import { UnitNetwork } from "@constants/unitNetwork";
import { MetamaskClassService, metamaskSupport } from "@services";
import { BlockchainService } from "@services/blockchain";
import { showError } from "@utils";
import { JsonRpcSigner } from "ethers";
import { create } from "zustand";
import { Balance, HistoricalData } from "./wallet.types";

interface HistoricalState {
  isLoading: boolean;
  historical: HistoricalData[];
}

let metamaskInstance: MetamaskClassService | null = null;
let blockchainInstance: BlockchainService | null = null;
interface SendTokensPayload {
  address: string;
  amount: number;
  token: string;
}
export interface WalletState {
  network: NETWORK_NAME;
  networkEnvironment: {
    environment: BLOCKCHAIN_ENVIRONMENT;
    testnetNetwork: TestnetNetwork[NETWORK_NAME.ETHEREUM];
  };
  address?: string;
  balance: Balance[];
  contractAddress: Record<string, string>;
  percentage24h: number;
  newAmount24h: number;
  transactionLoading: boolean;
  isLoading: boolean;
  metamaskSupported: boolean;
  historical: HistoricalState;
}
interface WalletStoreState {
  connectViaMetamask: () => Promise<void>;
  checkInitialConnectionMetamask: () => Promise<void>;
  getAllTokens: (address: string) => Promise<Balance[] | void | undefined>;
  getHistoricalData: () => Promise<HistoricalData[] | void | undefined>;
  getGasPrice: () => Promise<string | undefined>;
  sendToken: (payload: SendTokensPayload) => Promise<void>;
  estimateGas: (payload: SendTokensPayload) => Promise<string | void>;
  getMetamaskInstance: () => MetamaskClassService;
  getBlockchainInstance: () => BlockchainService;
  onDisconnectMetamask: () => void;
  onAccountsChanged: (accounts: string[]) => void;
  onChainChanged: (chainId: string) => void;
  subscribeMetamaskEvents: () => void;
  unSubscribeMetamaskEvents: () => void;
  onSubscribeContractTransfer: () => void;
  unSubscribeContractTransfer: () => void;
  wallet: WalletState;
}

const getEnvironmentNetwork = ({
  network,
  networkEnvironment,
}: WalletState) => {
  return networkEnvironment.environment === BLOCKCHAIN_ENVIRONMENT.TESTNET
    ? networkEnvironment.testnetNetwork
    : network;
};

const initialState: WalletState = {
  network: NETWORK_NAME.ETHEREUM,
  networkEnvironment: {
    environment: BLOCKCHAIN_ENVIRONMENT.TESTNET,
    testnetNetwork: TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA,
  },
  address: undefined,
  contractAddress: {},
  balance: [],
  historical: {
    isLoading: false,
    historical: [],
  },
  isLoading: false,
  transactionLoading: false,
  percentage24h: 0,
  metamaskSupported: metamaskSupport(),
  newAmount24h: 0,
};

export const useWalletStore = create<WalletStoreState>((set, get) => ({
  wallet: initialState,
  onAccountsChanged: async accounts => {
    if (accounts.length > 0) {
      const blockchain = get().getBlockchainInstance();
      const account = accounts[0];
      const [{ balance, contractAddress }, historical] = await Promise.all([
        blockchain.getAllBalances(account),
        blockchain.getHistoricalData(account),
      ]);
      set(state => ({
        wallet: {
          ...state.wallet,
          address: account,
          historical: { isLoading: false, historical },
          balance,
          contractAddress,
          isLoading: false,
        },
      }));
    } else get().onDisconnectMetamask();
  },
  onSubscribeContractTransfer: () => {
    const metamask = get().getMetamaskInstance();
    const blockchain = get().getBlockchainInstance();
    const { address, contractAddress } = get().wallet;
    if (!address || !contractAddress) return;
    const contracts = Object.values(contractAddress);
    const fnCallback = async () => {
      const [{ balance, contractAddress }, historical] = await Promise.all([
        blockchain.getAllBalances(address),
        blockchain.getHistoricalData(address),
      ]);
      set(state => ({
        wallet: {
          ...state.wallet,
          address,
          historical: { isLoading: false, historical },
          balance,
          contractAddress,
          isLoading: false,
        },
      }));
    };
    metamask.subscribeTransactions(address, fnCallback);
    for (const contract of contracts) {
      metamask.subscribeContract(contract, address, fnCallback);
    }
  },
  unSubscribeContractTransfer: () => {
    const metamask = get().getMetamaskInstance();
    metamask.unSubscribeTransaction();
    Object.values(get().wallet.contractAddress).forEach(
      metamask.unSubscribeContract
    );
  },
  onChainChanged: async () => {
    const metamask = get().getMetamaskInstance();
    const id = await metamask.getChainId();
    if (id !== chainId.TESTNET.ETHEREUM.SEPOLIA) {
      showError(
        "Please switch to Sepolia network. Other networks are not supported."
      );
    }
  },
  onDisconnectMetamask: () => {
    set(state => ({
      wallet: {
        ...state.wallet,
        address: undefined,
        balance: [],
        contractAddress: {},
        historical: {
          isLoading: false,
          historical: [],
        },
      },
    }));
  },
  subscribeMetamaskEvents: () => {
    const { onDisconnectMetamask, onAccountsChanged, onChainChanged } = get();
    const metamask = get().getMetamaskInstance();
    metamask.onDisconnect(onDisconnectMetamask);
    metamask.onAccountsChanged(onAccountsChanged);
    metamask.onChainChanged(onChainChanged);
  },
  unSubscribeMetamaskEvents: () => {
    const metamask = get().getMetamaskInstance();
    metamask.removeDisconnect(get().onDisconnectMetamask);
    metamask.removeAccountsChanged(get().onAccountsChanged);
    metamask.removeChainChanged(get().onChainChanged);
  },
  getMetamaskInstance: () => {
    if (metamaskInstance) return metamaskInstance;
    metamaskInstance = MetamaskClassService.initialize({
      blockchain: get().wallet.network,
      environment: get().wallet.networkEnvironment.environment,
    });
    return metamaskInstance;
  },
  getBlockchainInstance: () => {
    if (blockchainInstance) return blockchainInstance;
    blockchainInstance = new BlockchainService({
      network: getEnvironmentNetwork(get().wallet),
    });
    return blockchainInstance;
  },
  networkEnvironment: () => {
    const { networkEnvironment, network } = get().wallet;
    return networkEnvironment?.environment === BLOCKCHAIN_ENVIRONMENT.TESTNET
      ? network
      : networkEnvironment.testnetNetwork;
  },
  estimateGas: async ({ address: toAddr, amount, token }) => {
    const { address: addr, network } = get().wallet;
    if (!addr || !toAddr || !amount || !token) return;
    try {
      if (token !== UnitNetwork[network]) return;
      const service = get().getMetamaskInstance();
      return (
        await service.getGasRate({ to: toAddr, from: addr, value: amount })
      ).gasRate;
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Error fetching gas price."
      );
    }
  },
  getGasPrice: async () => {
    try {
      const metamask = get().getMetamaskInstance();
      const gasPrice = await metamask.getGasPrice();
      return gasPrice;
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Error fetching gas price."
      );
    }
  },
  sendToken: async payload => {
    const { address, amount, token } = payload;
    const { networkEnvironment, network, contractAddress } = get().wallet;
    if (!address || !amount || !token || !networkEnvironment) return;
    const fromAddr = get().wallet.address;
    if (!fromAddr) return;
    set(state => ({ wallet: { ...state.wallet, transactionLoading: true } }));
    try {
      const metamask = get().getMetamaskInstance();

      const nonce = await metamask.getTransactionCount(fromAddr);

      const res = await (token !== UnitNetwork[network]
        ? metamask.sendTokenTransaction(
            {
              nonce,
              to: address,
              from: fromAddr,
              value: amount,
            },
            contractAddress[token]
          )
        : metamask.sendTransaction({
            nonce,
            to: address,
            from: fromAddr,
            value: amount,
          }));
      await metamask.waitForTransaction(res);

      set(state => ({
        wallet: { ...state.wallet, transactionLoading: false },
      }));
    } catch (error) {
      set(state => ({
        wallet: { ...state.wallet, transactionLoading: false },
      }));
      showError(
        error instanceof Error
          ? error.message
          : "Error sending tokens to the address."
      );
    }
  },
  checkInitialConnectionMetamask: async () => {
    let metamask: MetamaskClassService | null;
    let account: JsonRpcSigner | undefined;
    set(state => ({ wallet: { ...state.wallet, isLoading: true } }));
    try {
      metamask = get().getMetamaskInstance();
      account = await metamask?.getAccount();
      if (!account) throw new Error();
    } catch {
      set(state => ({ wallet: { ...state.wallet, isLoading: false } }));
      return;
    }
    try {
      const blockchain = get().getBlockchainInstance();
      const { balance, contractAddress } = await blockchain.getAllBalances(
        account.address
      );
      set(state => ({
        wallet: {
          ...state.wallet,
          address: account.address,
          balance,
          contractAddress,
          isLoading: false,
        },
      }));
    } catch (error) {
      showError(error instanceof Error ? error.message : "");
      set(state => ({ wallet: { ...state.wallet, isLoading: false } }));
    }
  },
  getAllTokens: async () => {
    const { address, networkEnvironment, network } = get().wallet;
    if (!address || !network || !networkEnvironment) return;
    set(state => ({ wallet: { ...state.wallet, isLoading: true } }));
    try {
      const blockchain = get().getBlockchainInstance();
      const { balance, contractAddress } =
        await blockchain.getAllBalances(address);
      set(state => ({
        wallet: {
          ...state.wallet,
          balance,
          contractAddress,
          isLoading: false,
        },
      }));
      return balance;
    } catch (error) {
      set(state => ({ wallet: { ...state.wallet, isLoading: false } }));
      showError(
        error instanceof Error
          ? error.message
          : "Error fetching token balances."
      );
    }
  },
  getHistoricalData: async () => {
    const wallet = get().wallet;
    if (!wallet.address) return;

    set(state => ({
      wallet: {
        ...state.wallet,
        historical: { ...state.wallet.historical, isLoading: true },
      },
    }));

    try {
      const blockchain = new BlockchainService({
        network: getEnvironmentNetwork(wallet),
      });
      const historical = await blockchain.getHistoricalData(wallet.address);

      set(state => ({
        wallet: {
          ...state.wallet,
          historical: { isLoading: false, historical },
        },
      }));
      return historical;
    } catch (error) {
      set(state => ({
        wallet: {
          ...state.wallet,
          historical: { isLoading: false, historical: [] },
        },
      }));
      showError(
        error instanceof Error
          ? error.message
          : "Error fetching historical data."
      );
    }
  },
  connectViaMetamask: async () => {
    set(state => ({ wallet: { ...state.wallet, isLoading: true } }));
    try {
      const metamask = get().getMetamaskInstance();
      if (!metamask)
        throw new Error("Metamask not supported or not installed.");
      const address = await metamask.connect();
      const blockchain = get().getBlockchainInstance();
      const { balance, contractAddress } =
        await blockchain.getAllBalances(address);
      set(state => ({
        wallet: {
          ...state.wallet,
          address,
          isLoading: false,
          balance,
          contractAddress,
        },
      }));
    } catch (error) {
      set(state => ({ wallet: { ...state.wallet, isLoading: false } }));
      showError(
        error instanceof Error ? error.message : "Error connecting to Metamask."
      );
    }
  },
}));
