import { CRYPTO_UNITS } from "@constants/unit";
import { useWalletStore, WalletState } from "@store";
import { StatePrices, usePriceStore } from "@store/prices";
import { FCC } from "@types";
import { createContext, useCallback, useEffect, useMemo, useRef } from "react";

const currency = "usd";
const secondsTimeToRefresh = 240;
interface PriceContextProps {
  prices: StatePrices;
  wallet: WalletState & {
    balanceWithPrices: WalletState["balance"] &
      {
        value: number;
        price: number;
        percentage24h: number;
        currency: string;
      }[];
  };
  totalAmount: number;
}

export const PriceContext = createContext<PriceContextProps>(
  {} as PriceContextProps
);
export const PriceProvider: FCC = ({ children }) => {
  const { getPrices, prices } = usePriceStore(state => state);
  const wallet = useWalletStore(state => state.wallet);
  const intervalRef = useRef<number | null>(null);

  const tokenSymbols = useMemo(
    () => wallet.balance.map(token => token.symbol),
    [wallet.balance]
  );

  const fetchPrices = useCallback(() => {
    getPrices(tokenSymbols, currency);
  }, [getPrices, tokenSymbols]);

  const balanceWithPrices = useMemo(() => {
    return wallet.balance.map(token => {
      const price =
        prices.prices[token.symbol.toUpperCase() as CRYPTO_UNITS] || {};
      return {
        ...token,
        price: price?.price || 0,
        value: Number(token.balance) * (price?.price ?? 1),
        currency,
        percentage24h: price?.percentage24h ?? 0,
      };
    });
  }, [prices.prices, wallet.balance]);

  const totalAmount = balanceWithPrices.reduce(
    (acc, token) => acc + token.value,
    0
  );

  useEffect(() => {
    fetchPrices();
    const milliseconds = secondsTimeToRefresh * 1000;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(fetchPrices, milliseconds);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchPrices]);

  const value = useMemo<PriceContextProps>(
    () => ({
      prices,
      wallet: { ...wallet, balanceWithPrices },
      totalAmount,
    }),
    [prices, wallet, balanceWithPrices, totalAmount]
  );
  return (
    <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
  );
};
