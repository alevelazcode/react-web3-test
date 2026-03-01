import { CRYPTO_UNITS } from "@constants/unit";
import { Currency, getPrices } from "@services/prices";
import { create } from "zustand";

interface Price {
  symbol: CRYPTO_UNITS;
  price: number;
  percentage24h: number;
}
export interface StatePrices {
  prices: Record<CRYPTO_UNITS, Price>;
  isLoading: boolean;
}
const initialState: StatePrices = {
  prices: {} as Record<CRYPTO_UNITS, Price>,
  isLoading: false,
};
interface PriceStoreState {
  getPrices: (tokenSymbols: string[], currency?: Currency) => void;
  prices: StatePrices;
}
export const usePriceStore = create<PriceStoreState>(set => ({
  prices: initialState,
  getPrices: async (tokenSymbols, currency) => {
    if (tokenSymbols.length === 0) return;
    set(state => ({ prices: { ...state.prices, isLoading: true } }));
    try {
      const prices = await getPrices({ keys: tokenSymbols, currency });
      set(state => ({
        prices: {
          ...state.prices,
          prices: prices.reduce(
            (acc, { unit, value, percentage }) => {
              acc[unit] = {
                symbol: unit,
                price: value,
                percentage24h: percentage,
              };
              return acc;
            },
            {} as Record<CRYPTO_UNITS, Price>
          ),
          isLoading: false,
        },
      }));
    } catch {
      set(state => ({ prices: { ...state.prices, isLoading: false } }));
    }
  },
}));
