import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { TokenPriceConversionService } from "./token-price-conversion.service";

// __mocks__/crypto-currency-prices.service.ts
export const mockCryptoService = {
  fetchCurrentPrices: jest.fn<any>(),
  fetchHistoricalPrices: jest.fn<any>(),
};

// __mocks__/fiat-exchange-rate.service.ts
export const mockFiatService = {
  fetchExchangeRates: jest.fn<any>(),
};
jest.mock("../../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("TokenPriceConversionService", () => {
  let service: TokenPriceConversionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenPriceConversionService(
      mockCryptoService as any,
      mockFiatService as any,
    );
  });

  it("returns quotes in preferred quote currency (eur)", async () => {
    const tokenIds = ["btc"];
    const currency = "eur";

    const historicalQuotes: CurrencyQuotes = {
      quotes: {
        timestamp: 1234567890,
        "1234567890": 50000,
      },
      currency: "eur",
    };

    const latestPrices = {
      btc: 51000,
    };

    mockCryptoService.fetchCurrentPrices.mockResolvedValue(latestPrices);
    mockCryptoService.fetchHistoricalPrices.mockResolvedValue(historicalQuotes);

    const result = await service.fetchQuotesForTokens(tokenIds, currency);

    expect(result.btc.quotes.latest).toBe(51000);
    expect(mockCryptoService.fetchCurrentPrices).toHaveBeenCalled();
    expect(mockCryptoService.fetchHistoricalPrices).toHaveBeenCalledWith(
      "btc",
      "eur",
    );
  });

  it("converts quotes to non-preferred currency (idr)", async () => {
    const tokenIds = ["btc"];
    const currency = "dong";

    const historicalQuotes: CurrencyQuotes = {
      quotes: {
        timestamp: 1234567890,
        "1234567890": 50000,
      },
      currency: "usd",
    };

    const latestPrices = {
      btc: 51000,
    };

    const exchangeRates = {
      "1234567890": {
        DONG: 0.9,
      },
    };

    mockCryptoService.fetchCurrentPrices.mockResolvedValue(latestPrices);
    mockCryptoService.fetchHistoricalPrices.mockResolvedValue(historicalQuotes);
    mockFiatService.fetchExchangeRates.mockResolvedValue(exchangeRates);

    const result = await service.fetchQuotesForTokens(tokenIds, currency);

    expect(result.btc.currency).toBe("dong");
    expect(result.btc.quotes["1234567890"]).toBeCloseTo(50000 * 0.9);
    expect(result.btc.quotes.latest).toBe(51000);
  });

  it("handles historical price fetch failure gracefully", async () => {
    const tokenIds = ["eth"];
    const currency = "usd";

    mockCryptoService.fetchCurrentPrices.mockResolvedValue({ eth: 3000 });
    mockCryptoService.fetchHistoricalPrices.mockRejectedValue(
      new Error("fail"),
    );

    const result = await service.fetchQuotesForTokens(tokenIds, currency);

    expect(result.eth).toBeUndefined();
  });
});
