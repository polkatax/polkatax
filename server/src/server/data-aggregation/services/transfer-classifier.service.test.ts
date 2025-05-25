import { expect, it, jest, describe, beforeEach } from "@jest/globals";

import { PricedTransfer } from "../model/priced-transfer";
import { PricedTransaction } from "../model/priced-transaction";
import { TransferMerger } from "../helper/transfer-merger";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { TransferClassifier } from "./transfer-classifier.service";

// Mocks
jest.mock("../helper/is-evm-address", () => ({
  isEvmAddress: jest.fn<any>(),
}));
jest.mock("../helper/get-native-token", () => ({
  getNativeToken: jest.fn<any>(),
}));
jest.mock("../../../common/util/process-function-name", () => ({
  processFunctionName: (label: string) => label?.toUpperCase(),
}));

describe("TransferClassifier", () => {
  let service: TransferClassifier;
  let mockMerger: jest.Mocked<TransferMerger>;
  let mockSubscan: jest.Mocked<SubscanService>;

  beforeEach(() => {
    mockMerger = {
      mergeTxAndTranfersToObject: jest.fn(),
    } as any;

    mockSubscan = {
      mapToSubstrateAccount: jest.fn(),
      fetchAccounts: jest.fn(),
    } as any;

    service = new TransferClassifier(mockMerger, mockSubscan);
  });

  it("should extract payments only when no swap conditions are met", async () => {
    const address = "some-address";
    const chainName = "polkadot";
    const transactions: PricedTransaction[] = [];
    const transfers: PricedTransfer[] = [];

    const mockMergedTransfers = {
      tx1: {
        label: "transfer",
        tokens: {
          DOT: {
            amount: 10,
            symbol: "DOT",
            price: 5,
            fiatValue: 50,
            tokenId: null,
            from: "userA",
            to: "userB",
            timestamp: 123456,
            block: 1000,
            coingeckoId: "polkadot",
            extrinsic_index: "1-1",
            label: "transfer",
          },
        },
      },
    };

    require("../helper/is-evm-address").isEvmAddress.mockReturnValue(false);
    require("../helper/get-native-token").getNativeToken.mockReturnValue("DOT");
    mockSubscan.fetchAccounts.mockResolvedValue(["alias1"]);
    mockMerger.mergeTxAndTranfersToObject.mockReturnValue(
      mockMergedTransfers as any,
    );

    const { payments, swaps } = await service.extractSwapsAndPayments(
      address,
      chainName,
      transactions,
      transfers,
    );

    expect(swaps).toHaveLength(0);
    expect(payments).toHaveLength(1);
    expect(payments[0].label).toBe("TRANSFER");
    expect(mockSubscan.fetchAccounts).toHaveBeenCalledWith(address, chainName);
  });

  it("should extract swaps when both positive and negative amounts are present", async () => {
    const address = "evm-address";
    const chainName = "moonbeam";
    const transactions: PricedTransaction[] = [];
    const transfers: PricedTransfer[] = [];

    const mockMergedTransfers = {
      tx2: {
        label: "swap",
        tokens: {
          GLMR: {
            amount: -10,
            symbol: "GLMR",
            price: 1,
            fiatValue: -10,
            tokenId: null,
            from: "userA",
            to: "dex",
            timestamp: 123456,
            block: 1000,
            coingeckoId: "moonbeam",
            extrinsic_index: "2-1",
            label: "swap",
          },
          USDC: {
            amount: 10,
            symbol: "USDC",
            price: 1,
            fiatValue: 10,
            tokenId: null,
            from: "dex",
            to: "userA",
            timestamp: 123456,
            block: 1000,
            coingeckoId: "usd-coin",
            extrinsic_index: "2-1",
            label: "swap",
          },
        },
      },
    };

    require("../helper/is-evm-address").isEvmAddress.mockReturnValue(true);
    require("../helper/get-native-token").getNativeToken.mockReturnValue(
      "GLMR",
    );
    mockSubscan.mapToSubstrateAccount.mockResolvedValue("substrate-alias");
    mockMerger.mergeTxAndTranfersToObject.mockReturnValue(
      mockMergedTransfers as any,
    );

    const { payments, swaps } = await service.extractSwapsAndPayments(
      address,
      chainName,
      transactions,
      transfers,
    );

    expect(payments).toHaveLength(0);
    expect(swaps).toHaveLength(1);
    expect(swaps[0].transfers).toHaveLength(2);
    expect(swaps[0].label).toBe("SWAP");
    expect(mockSubscan.mapToSubstrateAccount).toHaveBeenCalledWith(
      chainName,
      address,
    );
  });
});
