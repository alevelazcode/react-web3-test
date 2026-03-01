import { API_KEYS } from "@config";
import { BLOCKCHAIN_ENVIRONMENT } from "./blockchainEnvironment";
import { NETWORK_NAME } from "./networkName";
import { TESTNET_NETWORKS, defaultTestnetNetwork } from "./testnetNetworks";

const sepoliaAlchemyKey = API_KEYS.alchemy.ETHEREUM.SEPOLIA;
const mainnetAlchemyKey = API_KEYS.alchemy.ETHEREUM.MAINNET;

export const rpcUrls = Object.freeze({
  [BLOCKCHAIN_ENVIRONMENT.TESTNET]: {
    [NETWORK_NAME.ETHEREUM]: {
      [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].GOERLI]: [
        "https://ethereum-goerli.publicnode.com",
        "https://endpoints.omniatech.io/v1/eth/goerli/public",
      ],
      [TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA]: [
        sepoliaAlchemyKey
          ? `https://eth-sepolia.g.alchemy.com/v2/${sepoliaAlchemyKey}`
          : "https://ethereum-sepolia-rpc.publicnode.com",
        sepoliaAlchemyKey
          ? `wss://eth-sepolia.g.alchemy.com/v2/${sepoliaAlchemyKey}`
          : "wss://ethereum-sepolia-rpc.publicnode.com",
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://endpoints.omniatech.io/v1/eth/sepolia/public",
      ],
    },
    [NETWORK_NAME.POLYGON]: {
      [TESTNET_NETWORKS[NETWORK_NAME.POLYGON].MUMBAI]: [
        "https://polygon-mumbai-bor.publicnode.com",
        "https://endpoints.omniatech.io/v1/matic/mumbai/public",
      ],
    },
  },
  [BLOCKCHAIN_ENVIRONMENT.MAINNET]: {
    [NETWORK_NAME.ETHEREUM]: [
      mainnetAlchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${mainnetAlchemyKey}`
        : "https://ethereum.publicnode.com",
      mainnetAlchemyKey
        ? `wss://eth-mainnet.g.alchemy.com/v2/${mainnetAlchemyKey}`
        : "wss://ethereum-rpc.publicnode.com",
      "https://ethereum.publicnode.com",
      "https://eth.llamarpc.com",
      "https://rpc.mevblocker.io",
    ],
    [NETWORK_NAME.POLYGON]: [
      "https://polygon.llamarpc.com",
      "https://polygon-bor.publicnode.com",
      "https://1rpc.io/matic",
    ],
  },
} as const);

export const testnetDefaultRpcUrls = Object.freeze({
  [NETWORK_NAME.ETHEREUM]:
    rpcUrls[BLOCKCHAIN_ENVIRONMENT.TESTNET][NETWORK_NAME.ETHEREUM][
      defaultTestnetNetwork[NETWORK_NAME.ETHEREUM]
    ],
  [NETWORK_NAME.POLYGON]:
    rpcUrls[BLOCKCHAIN_ENVIRONMENT.TESTNET][NETWORK_NAME.POLYGON][
      defaultTestnetNetwork[NETWORK_NAME.POLYGON]
    ],
} as const);
