import { expect, it, jest, describe } from "@jest/globals";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { PricedTransfer } from "../model/priced-transfer";
import { logger } from "../../logger/logger";
import * as dateUtils from "../../../common/util/date-utils";
import { addFiatValuesToTransferList } from "./add-fiat-values-to-transfers";

// Mock logger to suppress actual logging during tests
jest.mock("../../logger/logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

// Mock formatDate function
jest.spyOn(dateUtils, "formatDate").mockImplementation((date: Date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // e.g., "2025-05-20"
});

describe("addFiatValuesToTransferList", () => {
  it("should calculate fiat value using latest price if date is current", () => {
    const transfer: PricedTransfer = {
      amount: 2,
      timestamp: Math.floor(Date.now() / 1000),
      coingeckoId: "bitcoin",
    } as any;

    const quotes: { [tokenId: string]: CurrencyQuotes } = {
      bitcoin: {
        currency: "USD",
        quotes: {
          latest: 30000,
        },
      } as any,
    };

    const result = addFiatValuesToTransferList([transfer], quotes);

    expect(result[0].price).toBe(30000);
    expect(result[0].fiatValue).toBe(60000);
  });

  it("should use historical price if timestamp is not current date", () => {
    const historicalDate = "2025-05-10";
    const timestamp = Math.floor(new Date(historicalDate).getTime() / 1000);

    const transfer: PricedTransfer = {
      amount: 5,
      timestamp,
      coingeckoId: "ethereum",
    } as any;

    const quotes: { [tokenId: string]: CurrencyQuotes } = {
      ethereum: {
        currency: "USD",
        quotes: {
          [historicalDate]: 2000,
        },
      },
    } as any;

    const result = addFiatValuesToTransferList([transfer], quotes);

    expect(result[0].price).toBe(2000);
    expect(result[0].fiatValue).toBe(10000);
  });

  it("should log a warning if no matching quote is found", () => {
    const timestamp = Math.floor(new Date("2025-05-10").getTime() / 1000);

    const transfer: PricedTransfer = {
      amount: 10,
      timestamp,
      coingeckoId: "missingcoin",
    } as any;

    const quotes: { [tokenId: string]: CurrencyQuotes } = {
      missingcoin: {
        currency: "USD",
        quotes: {},
      },
    } as any;

    addFiatValuesToTransferList([transfer], quotes);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No quote found for USD for date"),
    );
  });

  it("should skip transfer if coingeckoId is missing", () => {
    const transfer: PricedTransfer = {
      amount: 1,
      timestamp: Math.floor(Date.now() / 1000),
    } as any;

    const quotes = {};

    const result = addFiatValuesToTransferList([transfer], quotes);

    expect(result[0].price).toBeUndefined();
    expect(result[0].fiatValue).toBeUndefined();
  });
});
