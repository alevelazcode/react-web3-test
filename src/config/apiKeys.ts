import { BLOCKCHAIN_ENVIRONMENT, NETWORK_NAME } from "@constants";
import { TESTNET_NETWORKS } from "@constants/testnetNetworks";
import zod from "zod";
const apiKeys = {
  alchemy: {
    [NETWORK_NAME.ETHEREUM]: {
      [BLOCKCHAIN_ENVIRONMENT.MAINNET]:
        import.meta.env.VITE_ALCHEMY_API_KEY_ETH_MAINNET ?? "",
      [TESTNET_NETWORKS.ETHEREUM.SEPOLIA]:
        import.meta.env.VITE_ALCHEMY_API_KEY_ETH_SEPOLIA ?? "",
    },
  },
  etherscan: import.meta.env.VITE_ETHERSCAN_API_KEY ?? "",
  coinGecko: import.meta.env.VITE_COINGECKO_API_KEY,
};

const ApiKeysSchema = zod
  .object({
    alchemy: zod
      .object({
        [NETWORK_NAME.ETHEREUM]: zod
          .object({
            [BLOCKCHAIN_ENVIRONMENT.MAINNET]: zod.string().readonly(),
            [TESTNET_NETWORKS.ETHEREUM.SEPOLIA]: zod.string().readonly(),
          })
          .readonly(),
      })
      .readonly(),
    etherscan: zod.string().readonly(),
    coinGecko: zod.string().readonly(),
  })
  .readonly();
export type ApiKeys = zod.infer<typeof ApiKeysSchema>;

export const API_KEYS = ApiKeysSchema.parse(apiKeys);
