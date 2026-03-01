import type { Eip1193Provider } from "ethers";
import type { PhantomProvider } from "models";

import type { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
    ethereum: Eip1193Provider & MetaMaskInpageProvider;
    solana: PhantomProvider;
    primeToast: import("primereact/toast").Toast | undefined | null;
  }
  // maybe
  interface Array<T> {
    mapFilter<U>(
      callback: (value: T, index: number, array: T[]) => U,
      condition: (value: T, index: number, array: T[]) => boolean
    ): U[];
  }
}
