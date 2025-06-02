import { expect, it, jest, describe, beforeEach } from "@jest/globals";

import { SubscanApi } from "../api/subscan.api";
import { RequestHelper } from "../../../../common/util/request.helper";

jest.mock("../../../../common/util/request.helper");

describe("SubscanApi", () => {
  let api: SubscanApi;

  beforeEach(() => {
    process.env.SUBSCAN_API_KEY = "test-key";
    (RequestHelper as jest.Mock).mockImplementation(() => ({
      req: jest.fn(),
      defaultHeader: {},
    }));
    api = new SubscanApi();
    // Override internal request method to avoid throttling
    (api as any).request = jest.fn((url, method, body) =>
      Promise.resolve({ data: mockResponses[url as any] || {} }),
    );
  });

  const mockResponses = {
    "https://testchain.api.subscan.io/api/scan/metadata": {
      avgBlockTime: 6,
      blockNum: 100000,
    },
    "https://testchain.api.subscan.io/api/scan/token": {
      detail: {
        DOT: {
          asset_type: "native",
          symbol: "DOT",
          price: 5.0,
          decimals: 10,
        },
      },
    },
    "https://testchain.api.subscan.io/api/scan/block": {
      block_num: 123,
      block_timestamp: 1717171,
    },
    "https://testchain.api.subscan.io/api/v2/scan/blocks": {
      blocks: [{ block_num: 1, block_timestamp: 1717000 }],
    },
    "https://testchain.api.subscan.io/api/v2/scan/extrinsics": {
      extrinsics: [
        {
          extrinsic_hash: "0x123",
          account_display: { address: "addr1" },
          block_timestamp: 1710000,
          block_num: 10,
          call_module: "balances",
          call_module_function: "transfer",
        },
      ],
    },
    "https://testchain.api.subscan.io/api/scan/account/reward_slash": {
      list: [
        {
          event_id: "staking.Reward",
          amount: "10000000000",
          block_timestamp: 1710000,
          extrinsic_index: "10-1",
          extrinsic_hash: "0xabc",
        },
      ],
    },
  };

  it("fetches metadata", async () => {
    const result = await api.fetchMetadata("testchain");
    expect(result).toEqual({ avgBlockTime: 6, blockNum: 100000 });
  });

  it("fetches native token", async () => {
    const result = await api.fetchNativeToken("testchain");
    expect(result.price).toBe(5.0);
  });

  it("fetches a block", async () => {
    const result = await api.fetchBlock("testchain", 123);
    expect(result.block_num).toBe(123);
    expect(result.block_timestamp).toBe(1717171000); // ms
  });

  it("fetches block list", async () => {
    const result = await api.fetchBlockList("testchain");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].block_timestamp).toBe(1717000000); // ms
  });

  it("fetches extrinsics", async () => {
    const result = await api.fetchExtrinsics("testchain", "addr1");
    expect(result.list.length).toBe(1);
    expect(result.list[0].label).toContain("balances");
  });

  it("fetches staking rewards", async () => {
    const result = await api.fetchStakingRewards(
      "testchain",
      "addr1",
      0,
      false,
      1700000,
    );
    expect(result.list[0].amount.toString()).toBe("10000000000");
  });
});
