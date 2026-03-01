import { BLOCKCHAIN_ENVIRONMENT } from "./blockchainEnvironment";
import { NETWORK_NAME } from "./networkName";
import { TESTNET_NETWORKS } from "./testnetNetworks";

export enum EXPLORER_CATEGORY {
  "TRANSACTION" = "TRANSACTION",
  "ADDRESS" = "ADDRESS",
}

export const ETHERSCAN_API_BASE_URL = Object.freeze({
  [NETWORK_NAME.ETHEREUM]: {
    [BLOCKCHAIN_ENVIRONMENT.MAINNET]: "https://api.etherscan.io/api",
    [BLOCKCHAIN_ENVIRONMENT.TESTNET]: {
      [TESTNET_NETWORKS.ETHEREUM.GOERLI]: "https://api-goerli.etherscan.io/api",
      [TESTNET_NETWORKS.ETHEREUM.SEPOLIA]:
        "https://api-sepolia.etherscan.io/api",
    },
  },
  [NETWORK_NAME.POLYGON]: {
    [BLOCKCHAIN_ENVIRONMENT.MAINNET]: "https://api.polygonscan.com/api",
    [BLOCKCHAIN_ENVIRONMENT.TESTNET]: "https://api-testnet.polygonscan.com/api",
  },
});

// This is the base URL for the explorer of each network
// Avoid magic strings
export const EXPLORER_BASE_URL = Object.freeze({
  [NETWORK_NAME.ETHEREUM]: {
    [BLOCKCHAIN_ENVIRONMENT.MAINNET]: "https://etherscan.io/",
    [BLOCKCHAIN_ENVIRONMENT.TESTNET]: {
      [TESTNET_NETWORKS.ETHEREUM.GOERLI]: "https://goerli.etherscan.io/",
      [TESTNET_NETWORKS.ETHEREUM.SEPOLIA]: "https://sepolia.etherscan.io/",
    },
  },
  [NETWORK_NAME.POLYGON]: {
    [BLOCKCHAIN_ENVIRONMENT.TESTNET]: "https://mumbai.polygonscan.com/",
    [BLOCKCHAIN_ENVIRONMENT.MAINNET]: "https://polygonscan.com/",
  },
});
