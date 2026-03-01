import { API_KEYS } from "@config";
import { NETWORK_NAME } from "@constants";
import { BLOCKCHAIN_ENVIRONMENT } from "@constants/blockchainEnvironment";
import {
  ETHERSCAN_API_BASE_URL,
  EXPLORER_BASE_URL,
} from "@constants/baseExplorer";
import { contractAddress } from "@constants/contractAddress";
import { TESTNET_NETWORKS } from "@constants/testnetNetworks";
import { UnitNetwork } from "@constants/unitNetwork";
import { Balance, HistoricalData } from "@store/wallet.types";
import { ABI_ERC20 } from "@utils";
import axios from "axios";
import { Contract, formatEther, formatUnits, JsonRpcProvider, parseEther } from "ethers";

const withAlchemyFallback = (
  host: string,
  key: string,
  fallback: string
): string => (key ? `https://${host}/v2/${key}` : fallback);

const RPC_URL_MAP = Object.freeze({
  [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA]: withAlchemyFallback(
    "eth-sepolia.g.alchemy.com",
    API_KEYS.alchemy.ETHEREUM.SEPOLIA,
    "https://ethereum-sepolia-rpc.publicnode.com"
  ),
  [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].GOERLI]:
    "https://ethereum-goerli.publicnode.com",
  [TESTNET_NETWORKS[NETWORK_NAME.POLYGON].MUMBAI]:
    "https://polygon-mumbai-bor.publicnode.com",
  [NETWORK_NAME.ETHEREUM]: withAlchemyFallback(
    "eth-mainnet.g.alchemy.com",
    API_KEYS.alchemy.ETHEREUM.MAINNET,
    "https://ethereum.publicnode.com"
  ),
  [NETWORK_NAME.POLYGON]: "https://polygon.llamarpc.com",
});

const ETHERSCAN_API_MAP = Object.freeze({
  [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA]:
    ETHERSCAN_API_BASE_URL.ETHEREUM.TESTNET[TESTNET_NETWORKS.ETHEREUM.SEPOLIA],
  [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].GOERLI]:
    ETHERSCAN_API_BASE_URL.ETHEREUM.TESTNET[TESTNET_NETWORKS.ETHEREUM.GOERLI],
  [TESTNET_NETWORKS[NETWORK_NAME.POLYGON].MUMBAI]:
    ETHERSCAN_API_BASE_URL.POLYGON.TESTNET,
  [NETWORK_NAME.ETHEREUM]: ETHERSCAN_API_BASE_URL.ETHEREUM.MAINNET,
  [NETWORK_NAME.POLYGON]: ETHERSCAN_API_BASE_URL.POLYGON.MAINNET,
} as const);

export type Network = keyof typeof RPC_URL_MAP;

interface TokenBalanceResult {
  contractAddress: string;
  tokenBalance: string;
  _metadata: { decimals: number; symbol: string; name: string };
}

interface EtherscanTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  isError?: string;
}

export class BlockchainService {
  provider: JsonRpcProvider;
  network: Network;
  explorerBaseUrl: string;
  etherscanApiUrl: string;

  constructor({
    network = TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA,
  }:
    | {
        network?: keyof typeof RPC_URL_MAP;
      }
    | undefined = {}) {
    this.provider = new JsonRpcProvider(RPC_URL_MAP[network]);
    this.network = network;
    this.explorerBaseUrl =
      EXPLORER_BASE_URL.ETHEREUM.TESTNET[TESTNET_NETWORKS.ETHEREUM.SEPOLIA];
    this.etherscanApiUrl = ETHERSCAN_API_MAP[network];
  }

  getBalance = async (
    address: string,
    blockTag: string | undefined = "latest"
  ) => {
    const balance = formatEther(
      await this.provider.getBalance(address, blockTag)
    );
    return {
      balance: Number(balance),
      name: NETWORK_NAME.ETHEREUM,
      symbol: UnitNetwork[NETWORK_NAME.ETHEREUM],
    };
  };

  getAllTokensBalance = async (
    address: string
  ): Promise<TokenBalanceResult[]> => {
    const knownContracts = this.getKnownContractAddresses();

    const results = await Promise.allSettled(
      knownContracts.map(async contractAddr => {
        const contract = new Contract(contractAddr, ABI_ERC20, this.provider);
        const [tokenBalance, decimals, symbol, name] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.symbol(),
          contract.name(),
        ]);
        return {
          contractAddress: contractAddr,
          tokenBalance: tokenBalance.toString(),
          _metadata: {
            decimals: Number(decimals),
            symbol: symbol as string,
            name: name as string,
          },
        };
      })
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<TokenBalanceResult> =>
          r.status === "fulfilled"
      )
      .map(r => r.value);
  };

  getAllTokensNonZeroBalance = async (address: string) => {
    const balances = await this.getAllTokensBalance(address);
    return balances.filter(token => {
      return Number(token.tokenBalance) > 0;
    });
  };

  getCurrentGasPrice = async () => {
    const feeData = await this.provider.getFeeData();
    if (!feeData.gasPrice) throw new Error("Error getting gas price");
    return formatUnits(feeData.gasPrice, "gwei");
  };

  estimateGasOfTx = async (tx: { to: string }) => {
    const res = await this.provider.estimateGas({
      to: tx.to,
      data: "0xd0e30db0",
      value: parseEther("1.0"),
    });
    return res;
  };

  getAllTokens = async (balances: TokenBalanceResult[]) => {
    const contractAddressMap = {} as Record<string, string>;
    const res = balances
      .map(token => {
        const metadata = token._metadata;
        if (
          !metadata ||
          metadata.decimals === null ||
          metadata.decimals === undefined ||
          isNaN(metadata.decimals)
        )
          return null;

        const balance =
          Number(token.tokenBalance) / Math.pow(10, metadata.decimals);
        const symbol = metadata.symbol.toUpperCase();
        contractAddressMap[symbol] = token.contractAddress;
        return {
          name: metadata.name,
          balance,
          symbol,
        };
      })
      .filter((t): t is Balance => t !== null);

    return { balances: res, contractAddress: contractAddressMap };
  };

  getAllBalances = async (address: string) => {
    const [{ balances, contractAddress: contractAddressMap }, balanceETH] =
      await Promise.all([
        this.getAllTokensBalance(address).then(tokens =>
          this.getAllTokens(tokens)
        ),
        this.getBalance(address),
      ]);
    return {
      balance: [balanceETH as Balance].concat(balances),
      contractAddress: contractAddressMap,
    };
  };

  getHistoricalData = async (address: string): Promise<HistoricalData[]> => {
    const apiKey = API_KEYS.etherscan;
    const baseUrl = this.etherscanApiUrl;
    const lowerAddress = address.toLowerCase();

    const commonParams = {
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 100,
      sort: "desc" as const,
      apikey: apiKey,
    };

    const [normalTxRes, internalTxRes, erc20TxRes] = await Promise.all([
      axios.get<{ result: EtherscanTx[] }>(baseUrl, {
        params: { module: "account", action: "txlist", ...commonParams },
      }),
      axios.get<{ result: EtherscanTx[] }>(baseUrl, {
        params: {
          module: "account",
          action: "txlistinternal",
          ...commonParams,
        },
      }),
      axios.get<{ result: EtherscanTx[] }>(baseUrl, {
        params: { module: "account", action: "tokentx", ...commonParams },
      }),
    ]);

    const mapTx = (tx: EtherscanTx, category: string): HistoricalData => {
      const receive = tx.to.toLowerCase() === lowerAddress;
      const isToken = category === "ERC 20";
      const decimals =
        isToken && tx.tokenDecimal ? Number(tx.tokenDecimal) : 18;
      const rawValue = Number(tx.value) / Math.pow(10, decimals);
      return {
        date: Number(tx.timeStamp) * 1000,
        amount: receive ? rawValue : -rawValue,
        category,
        symbol: isToken
          ? (tx.tokenSymbol || "").toUpperCase()
          : UnitNetwork[NETWORK_NAME.ETHEREUM],
        fromAddress: tx.from,
        toAddress: tx.to,
        receive,
        addr: receive ? tx.from : tx.to,
        urlExplorer: `${this.explorerBaseUrl}tx/${tx.hash}`,
        txHash: tx.hash,
      };
    };

    const normalTxs: HistoricalData[] = (
      Array.isArray(normalTxRes.data.result) ? normalTxRes.data.result : []
    )
      .filter((tx: EtherscanTx) => tx.isError !== "1")
      .map((tx: EtherscanTx) => mapTx(tx, "External"));

    const internalTxs: HistoricalData[] = (
      Array.isArray(internalTxRes.data.result)
        ? internalTxRes.data.result
        : []
    ).map((tx: EtherscanTx) => mapTx(tx, "Internal"));

    const erc20Txs: HistoricalData[] = (
      Array.isArray(erc20TxRes.data.result) ? erc20TxRes.data.result : []
    ).map((tx: EtherscanTx) => mapTx(tx, "ERC 20"));

    return [...normalTxs, ...internalTxs, ...erc20Txs];
  };

  getNetwork(): Network {
    return this.network;
  }

  private getKnownContractAddresses(): string[] {
    const network = this.network;

    const contracts: Record<string, string> | undefined = (() => {
      if (network === TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA) {
        return contractAddress[BLOCKCHAIN_ENVIRONMENT.TESTNET][
          NETWORK_NAME.ETHEREUM
        ][TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA] as Record<
          string,
          string
        >;
      }
      if (network === TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].GOERLI) {
        return contractAddress[BLOCKCHAIN_ENVIRONMENT.TESTNET][
          NETWORK_NAME.ETHEREUM
        ][TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].GOERLI] as Record<
          string,
          string
        >;
      }
      if (network === TESTNET_NETWORKS[NETWORK_NAME.POLYGON].MUMBAI) {
        return contractAddress[BLOCKCHAIN_ENVIRONMENT.TESTNET][
          NETWORK_NAME.POLYGON
        ][TESTNET_NETWORKS[NETWORK_NAME.POLYGON].MUMBAI] as Record<
          string,
          string
        >;
      }
      if (network === NETWORK_NAME.ETHEREUM) {
        return contractAddress[BLOCKCHAIN_ENVIRONMENT.MAINNET][
          NETWORK_NAME.ETHEREUM
        ] as Record<string, string>;
      }
      if (network === NETWORK_NAME.POLYGON) {
        return contractAddress[BLOCKCHAIN_ENVIRONMENT.MAINNET][
          NETWORK_NAME.POLYGON
        ] as Record<string, string>;
      }
      return undefined;
    })();

    return contracts ? Object.values(contracts) : [];
  }
}
