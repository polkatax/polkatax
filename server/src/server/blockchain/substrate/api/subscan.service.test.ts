import { expect, it, jest, describe, beforeEach } from "@jest/globals";

import { SubscanService } from "./subscan.service";
import { SubscanApi } from "./subscan.api";
import { Token } from "../model/token";
import { Transaction } from "../model/transaction";
import { SubscanEvent } from "../model/subscan-event";
import { RawStakingReward } from "../model/staking-reward";

jest.mock("./subscan.api");

describe("SubscanService", () => {
  let service: SubscanService;
  let api: jest.Mocked<SubscanApi>;

  beforeEach(() => {
    api = new SubscanApi() as jest.Mocked<SubscanApi>;
    service = new SubscanService(api);
  });

  it("should map to substrate account", async () => {
    api.mapToSubstrateAccount.mockResolvedValue("substrate-address");
    const result = await service.mapToSubstrateAccount(
      "polkadot",
      "some-evm-addr",
    );
    expect(result).toBe("substrate-address");
    expect(api.mapToSubstrateAccount).toHaveBeenCalled();
  });

  it("should fetch native token", async () => {
    const mockToken: Token = { symbol: "DOT", decimals: 10 } as any;
    api.fetchNativeToken.mockResolvedValue(mockToken);
    const result = await service.fetchNativeToken("polkadot");
    expect(result).toEqual(mockToken);
  });

  it("should search all events", async () => {
    api.searchEvents.mockImplementation(async (_c, _a, _m, _e, page) => ({
      list: page < 1 ? [{ event_id: "1" } as SubscanEvent] : [],
      hasNext: page < 1,
    }));
    const result = await service.searchAllEvents(
      "polkadot",
      "addr",
      "staking",
      "Reward",
      0,
    );
    expect(result.length).toBe(1);
  });

  it("should fetch all staking rewards", async () => {
    api.fetchStakingRewards.mockImplementation(async (_c, _a, page) => ({
      list:
        page < 1
          ? [
              {
                event_id: "1",
                amount: 1000,
                timestamp: Date.now(),
                block: "1",
                hash: "abc",
              } as unknown as RawStakingReward,
            ]
          : [],
      hasNext: page < 1,
    }));
    const result = await service.fetchAllStakingRewards("polkadot", "addr", 0);
    expect(result.length).toBe(1);
  });

  it("should fetch all extrinsics", async () => {
    api.fetchExtrinsics.mockImplementation(async (_c, _a, page) => ({
      list:
        page < 1
          ? [
              {
                hash: "tx1",
                block_num: 1,
                label: "label",
              } as unknown as Transaction,
            ]
          : [],
      hasNext: page < 1,
    }));
    const result = await service.fetchAllTx("polkadot", "addr");
    expect(result.length).toBe(1);
  });

  it("should fetch all transfers from", async () => {
    api.fetchTransfersFrom.mockImplementation(
      async (_c, _a, page) =>
        ({
          list:
            page < 1
              ? [
                  {
                    symbol: "DOT",
                    amount: "1000",
                    from: "a",
                    to: "b",
                    block_num: 1,
                    timestamp: Date.now(),
                    hash: "h1",
                    extrinsic_index: "0-1",
                  },
                ]
              : [],
          hasNext: page < 1,
        }) as any,
    );
    const result = await service.fetchAllTransfersFrom("polkadot", "addr", 0);
    expect(result.length).toBe(1);
    expect(result[0].symbol).toBe("DOT");
  });

  it("should fetch all accounts", async () => {
    api.fetchAccounts.mockResolvedValue(["a1", "a2"]);
    const result = await service.fetchAccounts("a", "polkadot");
    expect(result).toEqual(["a1", "a2"]);
  });
});
