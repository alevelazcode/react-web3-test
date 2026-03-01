import { NETWORK_NAME } from "@constants";
import axios from "axios";
import localForage from "localforage";

enum ListedIn {
  CoinGecko = "coingecko",
  OneInch = "1inch",
  LiFinance = "lifinance",
  SushiSwap = "sushiswap",
  OpenOcean = "openocean",
  Uniswap = "uniswap",
  Rubic = "rubic",
  XyFinance = "xyfinance",
  ElkFinance = "elkfinance",
  ArbitrumBridge = "arbitrum_bridge",
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI: string;
  coingeckoId: string | null;
  listedIn: ListedIn[];
}

interface CachedTokens {
  tokens: Token[];
  timestamp: number;
}

const TOKEN_LISTS = Object.freeze({
  [NETWORK_NAME.ETHEREUM]:
    "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/ethereum.json",
  [NETWORK_NAME.POLYGON]:
    "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/polygon.json",
} as const);

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getTokens = async (
  chain: NETWORK_NAME = NETWORK_NAME.ETHEREUM
): Promise<Token[]> => {
  const cacheKey = `tokens[${chain}]`;

  try {
    const cached = await localForage.getItem<CachedTokens>(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.tokens;
    }
  } catch {
    // Cache read failed, proceed to fetch
  }

  const tokenSource = TOKEN_LISTS[chain];
  try {
    const res = await axios.get<Token[]>(tokenSource);
    const tokens = res.data;
    await localForage.setItem(cacheKey, { tokens, timestamp: Date.now() });
    return tokens;
  } catch (error) {
    // If fetch fails but we have stale cache, return it
    try {
      const stale = await localForage.getItem<CachedTokens>(cacheKey);
      if (stale) return stale.tokens;
    } catch {
      // Stale cache read also failed
    }
    throw new Error(`Failed to fetch token list for ${chain}`, {
      cause: error,
    });
  }
};
