import { EXTERNAL_METHODS, NETWORK_NAME } from "@constants";
import { AVAILABLE_TOKEN, AvailableToken } from "@constants/availableToken";
import { EXPLORER_BASE_URL } from "@constants/baseExplorer";
import { BLOCKCHAIN_ENVIRONMENT } from "@constants/blockchainEnvironment";
import { chainId } from "@constants/chainIds";
import {
  contractAddress,
  defaultTestnetContractAddress,
} from "@constants/contractAddress";
import { rpcUrls, testnetDefaultRpcUrls } from "@constants/rpcUrls";
import { TESTNET_NETWORKS } from "@constants/testnetNetworks";
import { CRYPTO_UNITS } from "@constants/unit";
import { UnitNetwork } from "@constants/unitNetwork";
import { WEI_DECIMAL } from "@constants/weiDecimal";
import { ABI_ERC20, AppError } from "@utils";
import { areAddressesEqual } from "@utils/address";
import {
  BrowserProvider,
  Contract,
  ethers,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
  WebSocketProvider,
} from "ethers";
import {
  ConstructorExternalMethod,
  ExternalConnectMethod,
} from "./externalConnect";

export const metamaskSupport = () =>
  Boolean(typeof window !== "undefined" && window.ethereum?.isMetaMask);
const isConstructor = Symbol("IsConstructor");

type Constructor = Omit<
  ConstructorExternalMethod<EXTERNAL_METHODS.METAMASK>,
  "method"
>;
interface MetamaskError extends Error {
  message: string;
  code: number;
  data?: unknown;
}
type Balance = {
  value: number;
  symbol: string;
  valueInWei: bigint;
  decimals: number;
  name: string;
};

type CallbackTransfer = (
  from: string,
  to: string,
  value: string,
  event: {
    blockNumber: number;
    transactionIndex: number;
    transactionHash: string;
    logIndex: number;
    log: {
      address: string;
      blockHash: string;
      blockNumber: number;
      data: string;
      logIndex: number;
      removed: boolean;
      topics: string[];
      transactionHash: string;
    };
    removed: boolean;
  }
) => void;
export class MetamaskClassService extends ExternalConnectMethod<EXTERNAL_METHODS.METAMASK> {
  readonly provider: BrowserProvider;

  readonly chainId: string;

  readonly rpcUrls: readonly string[];

  readonly contractAddress: Record<string, string>;
  readonly websocketProvider: WebSocketProvider;

  constructor(
    {
      blockchain,
      environment,
      provider,
      testnetNetwork,
    }: Constructor & {
      provider: BrowserProvider;
    },
    symbol: symbol
  ) {
    if (symbol !== isConstructor) throw new Error("Invalid constructor");
    super({
      blockchain,
      environment,
      method: EXTERNAL_METHODS.METAMASK,
      testnetNetwork,
    });
    this.provider = provider;

    // This is the chainId for the network you want to connect
    // We need to convert it to hexadecimal
    const getChainId = () => {
      let id = chainId[environment][blockchain];
      if (
        environment === BLOCKCHAIN_ENVIRONMENT.TESTNET &&
        TESTNET_NETWORKS[blockchain] &&
        typeof id !== "string"
      ) {
        id = id[this.testnetNetwork as keyof typeof id];
      }
      return id.toString(16);
    };
    this.chainId = `0x${getChainId()}`;

    this.rpcUrls =
      environment === BLOCKCHAIN_ENVIRONMENT.TESTNET
        ? testnetDefaultRpcUrls[`${blockchain}`]
        : rpcUrls[`${environment}`][`${blockchain}`];

    this.contractAddress =
      environment === BLOCKCHAIN_ENVIRONMENT.TESTNET
        ? defaultTestnetContractAddress[`${blockchain}`]
        : contractAddress[`${environment}`][`${blockchain}`];

    const wsUrl = this.rpcUrls.find((url: string) => url.startsWith("wss://"));
    this.websocketProvider = wsUrl
      ? new WebSocketProvider(wsUrl)
      : new WebSocketProvider(this.rpcUrls[1] ?? this.rpcUrls[0]);
  }

  getAccounts = async (): Promise<string> => {
    await this.provider.send("wallet_requestPermissions", [
      { eth_accounts: {} },
    ]);
    try {
      await this.provider.send("wallet_switchEthereumChain", [
        { chainId: this.chainId },
      ]);
    } catch (error) {
      const e = error as MetamaskError;
      if (e.code === 4001) {
        throw new Error("User rejected request", { cause: error });
      }
      if (e.code === 4902) {
        try {
          await this.provider.send("wallet_addEthereumChain", [
            {
              chainId: this.chainId,
              chainName: this.blockchain,
              rpcUrls: this.rpcUrls,
              nativeCurrency: {
                name: this.blockchain,
                symbol: UnitNetwork[this.blockchain],
                decimals: 18,
              },
              blockExplorerUrls: [EXPLORER_BASE_URL.ETHEREUM.TESTNET.SEPOLIA],
            },
          ]);
        } catch {
          throw new Error("Error adding chain to metamask");
        }
      }
    }

    const [sender] = await this.provider.send("eth_requestAccounts", []);
    return sender as string;
  };

  estimateGasOfTx = async ({
    to,
    from,
    value,
  }: {
    to: string;
    from: string;
    value: string | number;
  }) => {
    const gasLimit = await this.provider.estimateGas({
      to,
      from,
      value: parseEther(value.toString()),
    });
    return gasLimit;
  };

  getGasRate = async ({
    to,
    from,
    value,
  }: {
    to: string;
    from: string;
    value: string | number;
  }) => {
    return Promise.all([
      this.estimateGasOfTx({ to, from, value }),
      this.getCurrentFeeData(),
    ]).then(([gasLimit, { gasPrice }]) => {
      return {
        gasLimit,
        gasPrice,
        gasRate: gasLimit
          ? formatEther((gasLimit as bigint) * gasPrice)
          : undefined,
      };
    });
  };

  getSigner = async () => {
    return this.provider.getSigner();
  };

  sendTokenTransaction = async (
    tx: TransactionRequest,
    contractAddr: string
  ): Promise<string> => {
    const signer = await this.getSigner();
    const contract = new Contract(contractAddr, ABI_ERC20, signer);
    const decimals: number = await contract.decimals();
    if (!tx.value) throw new Error("Value is required");
    const amount = parseUnits(tx.value.toString(), decimals);
    const txResponse = await contract.transfer(tx.to, amount);
    return txResponse.hash;
  };

  getCurrentFeeData = async () => {
    const feeData = await this.provider.getFeeData();
    if (!feeData.gasPrice) throw new Error("Error getting gas price");
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  };

  getGasPrice = async () => {
    try {
      const feeData = await this.provider.getFeeData();
      if (!feeData.gasPrice) throw new Error("Error getting gas price");
      return formatUnits(feeData.gasPrice, "gwei");
    } catch {
      throw new Error("Error getting gas price");
    }
  };

  static initialize({ blockchain, environment, testnetNetwork }: Constructor) {
    if (!metamaskSupport()) throw new Error("not metamask support");
    const provider = new BrowserProvider(window.ethereum);
    return new this(
      { blockchain, environment, provider, testnetNetwork },
      isConstructor
    );
  }

  isValidUnit = (
    unit: CRYPTO_UNITS
  ): unit is AvailableToken<NETWORK_NAME.ETHEREUM> => {
    return AVAILABLE_TOKEN[this.blockchain].some(value => value === unit);
  };

  subscribeBlock = async (callback: (blockNumber: number) => void) => {
    this.provider.on("block", callback);
  };

  unSubscribeBlock = async () => {
    this.provider.removeAllListeners("block");
  };

  subscribeContract = async (
    contract: string,
    addr: string,
    callback: (receipt: TransactionReceipt | null) => void
  ) => {
    const contractInstance = new Contract(
      contract,
      ABI_ERC20,
      this.websocketProvider
    );
    contractInstance.on("Transfer", (async (from, to, _, eventData) => {
      if (!areAddressesEqual(addr, from) && !areAddressesEqual(addr, to))
        return;
      const hash = eventData.transactionHash || eventData.log.transactionHash;
      this.waitForTransaction(hash).then(callback);
    }) as CallbackTransfer);
  };

  subscribeTransactions = async (
    addr: string,
    callback: (
      transaction: TransactionResponse,
      receipt: TransactionReceipt | null
    ) => void
  ) => {
    this.websocketProvider.on("pending", async (txHash: string) => {
      const transaction = await this.provider.getTransaction(txHash);
      if (!transaction) return;
      if (
        !areAddressesEqual(transaction?.from, addr) &&
        !areAddressesEqual(transaction?.to, addr)
      )
        return;
      const receipt = await this.waitForTransaction(txHash);
      callback(transaction, receipt);
    });
  };

  unSubscribeContract = async (contract: string) => {
    const contractInstance = new Contract(
      contract,
      ABI_ERC20,
      this.websocketProvider
    );
    contractInstance.removeAllListeners("Transfer");
  };

  unSubscribeTransaction = async () => {
    this.websocketProvider.removeAllListeners("pending");
  };

  getContractAddress = (
    unit: AvailableToken<NETWORK_NAME.ETHEREUM> = CRYPTO_UNITS.USDC
  ) => {
    // if (!this.isValidUnit(unit)) throw new Error(`Invalid Unit`);
    const address = this.contractAddress[unit] as string;
    if (!address) throw new Error(`Invalid payment unit`);
    return address;
  };

  getTransactionReceipts = async (
    txId: string
  ): Promise<TransactionReceipt | null> =>
    this.provider.getTransactionReceipt(txId);

  getCryptoBalance = async (
    account: string | ethers.JsonRpcSigner
  ): Promise<Balance> => {
    const balance = await this.provider.getBalance(account);
    return {
      value: Number(formatEther(balance)),
      symbol: UnitNetwork[this.blockchain],
      valueInWei: balance,
      name: this.blockchain,
      decimals: WEI_DECIMAL, // <--- This is the default value for the decimals of the crypto currency in the network (18 for Ethereum (ETH) and Polygon (MATIC)),
    };
  };

  getContractBalance = async (
    account: string | ethers.JsonRpcSigner,
    contractAddr: string
  ): Promise<Balance> => {
    const contract = new ethers.Contract(
      contractAddr,
      ABI_ERC20,
      this.provider
    );
    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(account),
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);
    const formatDecimals = Number(decimals);
    return {
      value: Number(balance) / 10 ** formatDecimals,
      decimals: formatDecimals,
      symbol,
      name,
      valueInWei: balance, // <--- This is the default value for the decimals of the crypto currency in the network (18 for Ethereum (ETH) and Polygon (MATIC)),
    };
  };
  getBalance = async ({
    account,
    symbol = UnitNetwork[
      this.blockchain
    ] as AvailableToken<NETWORK_NAME.ETHEREUM>,
    contractAddress,
  }: {
    account: string | ethers.JsonRpcSigner;
    symbol?: AvailableToken<NETWORK_NAME.ETHEREUM>;
    contractAddress?: string;
  }) => {
    if (symbol === UnitNetwork[this.blockchain])
      return this.getCryptoBalance(account);

    const contract = new ethers.Contract(
      contractAddress || this.getContractAddress(symbol),
      ABI_ERC20,
      this.provider
    );
    if (!contract) throw new Error("Contract not found");
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(account),
      contract.decimals(),
    ]);
    const valueInWei = Number(balance);
    const formatDecimals = Number(decimals);
    return {
      value: valueInWei / 10 ** formatDecimals,
      decimals: formatDecimals,
      symbol,
      valueInWei,
    };
  };

  getAllBalances = async (
    account: string | ethers.JsonRpcSigner,
    contractsAddress: string[] = []
  ) => {
    return Promise.allSettled(
      [this.getCryptoBalance(account)].concat(
        contractsAddress.map(async addr => {
          return this.getContractBalance(account, addr);
        })
      )
    ).then(results => {
      return (
        results.filter(
          result => result.status === "fulfilled"
        ) as PromiseFulfilledResult<ReturnType<this["getBalance"]>>[]
      ).map(result => result.value);
    });
  };

  onAccountsChanged = (callback: (accounts: string[]) => void) => {
    window.ethereum.on("accountsChanged", callback);
  };

  removeAccountsChanged = (callback: (accounts: string[]) => void) => {
    window.ethereum.removeListener("accountsChanged", callback);
  };

  onChainChanged = (callback: (chainId: string) => void) => {
    window.ethereum.on("chainChanged", callback);
  };

  removeChainChanged = (callback: (chainId: string) => void) => {
    window.ethereum.removeListener("chainChanged", callback);
  };

  removeDisconnect = (callback: () => void) => {
    window.ethereum.removeListener("disconnect", callback);
  };

  onDisconnect = (callback: () => void) => {
    window.ethereum.on("disconnect", callback);
  };

  connect = async () => {
    try {
      const res = await this.getAccounts();
      if (!res) throw new Error(`Could not get account information`);
      this.address = res;
      return res;
    } catch (error) {
      throw new AppError("Error connecting to MetaMask.", { cause: error });
    }
  };

  waitForTransaction = async (txId: string) => {
    const receipt = await this.provider.waitForTransaction(txId);
    return receipt;
  };

  // use this method to get the nonce of the account
  getTransactionCount = async (address: string) => {
    const count = await this.provider.getTransactionCount(address, "latest");
    return count;
  };

  signTransaction = async (tx: ethers.TransactionRequest) => {
    const signedTx = await this.provider.send("eth_signTransaction", [tx]);
    return signedTx;
  };

  getChainId = async () => {
    const chainId = await this.provider.getNetwork();
    return Number(chainId.chainId);
  };

  sendTransaction: ExternalConnectMethod<EXTERNAL_METHODS.METAMASK>["sendTransaction"] =
    async ({ chainId = this.chainId, value, ...params }) => {
      // const { hash }: TransactionResponse = await provider.send(
      //   "eth_sendTransaction",
      //   [{ chainId, ...params }]
      // );
      const signer = await this.provider.getSigner();
      const { hash }: TransactionResponse = await signer.sendTransaction({
        chainId,
        value: parseEther((value as number).toString()),
        ...params,
      });
      return hash as string;
    };

  getWalletInfo = async () => {
    try {
      const accounts = await this.provider.listAccounts();
      if (accounts.length === 0) return;
      const account = accounts[0];
      const balances = await this.getAllBalances(account);
      return {
        account,
        balances,
      };
    } catch (error) {
      console.error("Error getting wallet info:", error);
      throw new Error("Error getting wallet information.", { cause: error });
    }
  };

  getAccount = async () => {
    try {
      const accounts = await this.provider.listAccounts();
      if (accounts.length === 0) return;
      return accounts[0];
    } catch (error) {
      throw new Error("Error getting wallet information.", { cause: error });
    }
  };

  getSignature = async () => {
    const signature = await this.provider.send("personal_sign", [
      this.address,
      this.blockchain,
    ]);

    this.signature = signature as string;
    return signature as string;
  };
}
