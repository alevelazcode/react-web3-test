# Implementation Plan: Fix Button Styling + SOLID / Best Practices

## Phase 1: Fix Button Visual Regression (Critical)
Tailwind v4 removed `bg-opacity-*` utilities. Buttons now render as solid color blocks.

1. **CustomBtn.types.ts** - Move `hover:bg-color/10` and `focus:bg-color/10` into each `btnClassNames` variant, remove `bg-<color>` from them
2. **CustomBtn.tsx** - Remove dead `bg-opacity-0`, `hover:bg-opacity-10`, `focus:bg-opacity-10` classes
3. **LinkBtn.tsx** - Same fix as CustomBtn

## Phase 2: Type Safety & Code Quality
4. **error.ts** - Remove `showError()` side effect from `AppError` constructor
5. **useModal.ts** - Add explicit `showError()` call before reject (was relying on AppError side effect)
6. **Portfolio.tsx & TransactionHistory.tsx** - Fix `@ts-expect-error` on `rowClassName` by using a function `() => "custom-datatable-row"`
7. **global.d.ts** - Remove invalid `BrowserProvider` from Window.ethereum type
8. **ConnectView.tsx** - Remove empty `useEffect`
9. **metamak.ts** - Remove dead `estimateGasOfTxOfToken` stub method
10. **wallet.ts** - Remove duplicate `unsubscribeMetamaskEvents` method

## Phase 3: Performance Optimizations
11. **Portfolio.tsx** - Move `percentageOfTotalTemplate` out of render, memoize with `useCallback`
12. **TransactionHistory.tsx** - Memoize `.map()` data transformation with `useMemo`
13. **TokenSelect.tsx** - Move template functions outside component
14. **Tabs.tsx** - Use `tab.id` as key instead of array index, add ARIA attributes

## Phase 4: Service Layer & Architecture
15. **Rename `metamak.ts` → `metamask.ts`** - Fix typo, update all imports
16. **wallet.ts** - Replace `createRef` singleton pattern with module-level variables
17. **metamask.ts** - Fix hardcoded WebSocket URL to derive from constructor params
18. **getTokens.ts** - Add error handling and cache TTL
19. **prices.ts store** - Decouple from walletStore by accepting token symbols as parameter
20. **PriceProvider.tsx** - Pass token symbols to `getPrices()`, fix dependency array
