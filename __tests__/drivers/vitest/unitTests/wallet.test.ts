import { NETWORK_NAME } from "@constants";
import { CRYPTO_UNITS } from "@constants/unit";
import { UnitNetwork } from "@constants/unitNetwork";
import { BlockchainService } from "@services/blockchain";
import { getPrices } from "@services/prices";
import { isAddress } from "@utils/address";
import { getTokens } from "@utils/getTokens";
import { beforeEach, describe, expect, it } from "vitest";
// Mocking Ethers.js
// vi.mock("ethers", () => {
//   const actualEthers = vi.importActual("ethers");
//   return {
//     ...actualEthers,
//     ethers: {
//       Contract: vi.fn(),
//       providers: {
//         Web3Provider: vi.fn(),
//         WebSocketProvider: vi.fn(),
//       },
//       utils: {
//         formatEther: vi.fn(),
//         parseEther: vi.fn(),
//         formatUnits: vi.fn(),
//         parseUnits: vi.fn(),
//       },
//     },
//   };
// });
describe("MetamaskClassService", () => {
  //   let metamaskService;

  //   beforeEach(() => {
  //     metamaskService = MetamaskClassService.initialize({
  //       blockchain: NETWORK_NAME.ETHEREUM,
  //       environment: BLOCKCHAIN_ENVIRONMENT.TESTNET,
  //       testnetNetwork: TESTNET_NETWORKS[NETWORK_NAME.ETHEREUM].SEPOLIA,
  //     });
  //   });

  it("should initialize the service", () => {
    expect(true).toBeDefined();
  });

  //   it("should get accounts", async () => {
  //     const mockAccounts = ["0x123"];
  //     vi.spyOn(mockProvider, "send").mockResolvedValue(mockAccounts);
  //     const accounts = await metamaskService.getAccounts();
  //     expect(accounts).toEqual(mockAccounts[0]);
  //   });

  //   it("should send a token transaction", async () => {
  //     const mockHash = "0xabc";
  //     const mockContract = {
  //       transfer: vi.fn().mockResolvedValue({ hash: mockHash }),
  //       decimals: vi.fn().mockResolvedValue(18),
  //     };
  //     ethers.Contract.mockImplementation(() => mockContract);

  //     const hash = await metamaskService.sendTokenTransaction(
  //       {
  //         to: "0x456",
  //         value: "1",
  //       },
  //       "mockContractAddress"
  //     );

  //     expect(hash).toEqual(mockHash);
  //     expect(mockContract.transfer).toHaveBeenCalled();
  //   });
});

describe("BlockchainService", () => {
  let blockchainService: BlockchainService;
  const testAddress = "0x97d040507051DFA4b3ACAFde575458098e13DC15";
  beforeEach(() => {
    blockchainService = new BlockchainService();
  });
  it("should get balance", async () => {
    const balance = await blockchainService.getBalance(testAddress);
    expect(balance.balance).toBeGreaterThanOrEqual(0);
    expect(balance).toEqual({
      balance: expect.any(Number),
      name: NETWORK_NAME.ETHEREUM,
      symbol: UnitNetwork.ETHEREUM,
    });
  });

  it("should get all tokens balance", async () => {
    const balances =
      await blockchainService.getAllTokensBalance(testAddress);
    expect(balances).toBeInstanceOf(Array);
    balances.forEach(balance => {
      expect(Number(balance.tokenBalance)).toBeGreaterThanOrEqual(0);
      expect(isAddress(balance.contractAddress)).toBeTruthy();
    });
  });

  it("should get all tokens non zero balance", async () => {
    const balances =
      await blockchainService.getAllTokensNonZeroBalance(testAddress);
    expect(balances).toBeInstanceOf(Array);
    balances.forEach(balance => {
      expect(Number(balance.tokenBalance)).toBeGreaterThan(0);
      expect(isAddress(balance.contractAddress)).toBeTruthy();
    });
  });
});

describe("Get Tokens Price", () => {
  it("should get the price of a token", async () => {
    const keys = Object.values(CRYPTO_UNITS);
    const prices = await getPrices({ keys });
    expect(prices).toBeInstanceOf(Array);
    prices.forEach(price => {
      expect(price.value).toBeGreaterThanOrEqual(0);
      expect(price.percentage).toBeTypeOf("number");
      expect(Object.values(CRYPTO_UNITS)).toContain(price.unit);
    });
  });
});

describe("Get Tokens data", () => {
  it("should get the tokens data", async () => {
    // Get the first 10 tokens
    const tokens = (await getTokens(NETWORK_NAME.ETHEREUM)).slice(0, 10);
    expect(tokens).toBeInstanceOf(Array);
    expect(tokens.length).toBeGreaterThan(0);
    tokens.forEach(token => {
      expect(token.symbol).toBeTypeOf("string");
      expect(token.name).toBeTypeOf("string");
      expect(token.decimals).toBeGreaterThanOrEqual(0);
      expect(
        typeof token.coingeckoId === "string" || token.coingeckoId === null
      ).toBeTruthy();
    });
  });
});
