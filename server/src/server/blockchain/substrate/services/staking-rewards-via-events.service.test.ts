import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { StakingRewardsViaEventsService } from "./staking-rewards-via-events.service";
import { SubscanService } from "../api/subscan.service";
import { SubscanEvent } from "../model/subscan-event";
import { Transfer } from "../model/raw-transfer";

jest.mock("../api/subscan.service");

describe("StakingRewardsViaEventsService", () => {
  let service: StakingRewardsViaEventsService;
  let subscanService: jest.Mocked<SubscanService>;

  beforeEach(() => {
    subscanService = new SubscanService(null) as jest.Mocked<SubscanService>;
    service = new StakingRewardsViaEventsService(subscanService);
  });

  it("should return matching staking rewards from transfers and events", async () => {
    const mockEvents: SubscanEvent[] = [
      { extrinsic_hash: "hash1" } as SubscanEvent,
      { extrinsic_hash: "hash2" } as SubscanEvent,
    ];

    const mockTransfers: Transfer[] = [
      {
        hash: "hash1",
        amount: 1000,
        timestamp: 111111,
        extrinsic_index: "123-1",
        from: "a",
        to: "b",
        symbol: "DOT",
        block: 123,
        label: "Reward",
      },
      {
        hash: "hash2",
        amount: -500,
        timestamp: 222222,
        extrinsic_index: "124-1",
        from: "a",
        to: "b",
        symbol: "DOT",
        block: 124,
        label: "Slash",
      },
      {
        hash: "hash3",
        amount: 999,
        timestamp: 333333,
        extrinsic_index: "125-1",
        from: "a",
        to: "b",
        symbol: "DOT",
        block: 125,
        label: "Ignored",
      },
    ] as any;

    subscanService.searchAllEvents.mockResolvedValue(mockEvents);
    subscanService.fetchAllTransfersFrom.mockResolvedValue(mockTransfers);

    const result = await service.fetchStakingRewards(
      "polkadot",
      "address1",
      "staking",
      "Reward",
      0,
    );

    expect(result).toEqual([
      {
        event_id: "Reward",
        amount: 1000,
        timestamp: 111111,
        block: 123,
        hash: "hash1",
      },
      {
        event_id: "Slash",
        amount: -500,
        timestamp: 222222,
        block: 124,
        hash: "hash2",
      },
    ]);
  });

  it("should return an empty array if no matching hashes", async () => {
    subscanService.searchAllEvents.mockResolvedValue([
      { extrinsic_hash: "hash999" } as SubscanEvent,
    ]);
    subscanService.fetchAllTransfersFrom.mockResolvedValue([
      {
        hash: "hash1",
        amount: 1000,
        timestamp: 111111,
        extrinsic_index: "123-1",
        from: "a",
        to: "b",
        symbol: "DOT",
        block: 123,
        label: "Reward",
      },
    ] as any);

    const result = await service.fetchStakingRewards(
      "polkadot",
      "address1",
      "staking",
      "Reward",
      0,
    );

    expect(result).toEqual([]);
  });
});
