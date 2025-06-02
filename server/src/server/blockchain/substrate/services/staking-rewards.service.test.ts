import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { StakingRewardsService } from "./staking-rewards.service";
import { SubscanService } from "../api/subscan.service";
import { StakingRewardsViaEventsService } from "./staking-rewards-via-events.service";
import { StakingReward } from "../model/staking-reward";
import { RawStakingReward } from "../model/staking-reward";

jest.mock("../api/subscan.service");
jest.mock("./staking-rewards-via-events.service");

describe("StakingRewardsService", () => {
  let subscanService: jest.Mocked<SubscanService>;
  let eventsService: jest.Mocked<StakingRewardsViaEventsService>;
  let service: StakingRewardsService;

  beforeEach(() => {
    subscanService = new SubscanService(null) as jest.Mocked<SubscanService>;
    eventsService = new StakingRewardsViaEventsService(
      subscanService,
    ) as jest.Mocked<StakingRewardsViaEventsService>;
    service = new StakingRewardsService(subscanService, eventsService);
  });

  it("should call the correct event-based fetch logic for mythos", async () => {
    const rewards: StakingReward[] = [
      { amount: 10, timestamp: 1000, block: 1, hash: "h1", event_id: "Reward" },
    ] as any;
    eventsService.fetchStakingRewards.mockResolvedValue(rewards);

    const result = await service.fetchStakingRewards(
      "mythos",
      "addr1",
      500,
      1500,
    );

    expect(eventsService.fetchStakingRewards).toHaveBeenCalledWith(
      "mythos",
      "addr1",
      "collatorstaking",
      "StakingRewardReceived",
      500,
    );
    expect(result).toEqual([
      { amount: 10, timestamp: 1000, block: 1, hash: "h1" },
    ]);
  });

  it("should call default fetch and normalize amounts correctly", async () => {
    const rawRewards: RawStakingReward[] = [
      {
        amount: "1000000000000",
        timestamp: 1600,
        block: 99,
        hash: "h2",
        event_id: "Reward",
      },
      {
        amount: "2000000000000",
        timestamp: 1700,
        block: 100,
        hash: "h3",
        event_id: "Slash",
      },
    ] as any;
    subscanService.fetchNativeToken.mockResolvedValue({
      token_decimals: 12,
    } as any);
    subscanService.fetchAllStakingRewards.mockResolvedValue(rawRewards);

    const result = await service.fetchStakingRewards(
      "default-chain",
      "addr2",
      1000,
      1800,
    );

    expect(subscanService.fetchNativeToken).toHaveBeenCalled();
    expect(subscanService.fetchAllStakingRewards).toHaveBeenCalled();
    expect(result).toEqual([
      {
        amount: 1,
        timestamp: 1600,
        block: 99,
        hash: "h2",
      },
      {
        amount: -2,
        timestamp: 1700,
        block: 100,
        hash: "h3",
      },
    ]);
  });

  it("should filter rewards by date range", async () => {
    eventsService.fetchStakingRewards.mockResolvedValue([
      {
        amount: 5,
        timestamp: 1000,
        block: 1,
        hash: "h1",
        event_id: "Reward",
      },
      {
        amount: 10,
        timestamp: 3000,
        block: 2,
        hash: "h2",
        event_id: "Reward",
      },
    ] as any);

    const result = await service.fetchStakingRewards(
      "energywebx",
      "addr3",
      900,
      2000,
    );

    expect(result).toEqual([
      {
        amount: 5,
        timestamp: 1000,
        block: 1,
        hash: "h1",
      },
    ]);
  });
});
