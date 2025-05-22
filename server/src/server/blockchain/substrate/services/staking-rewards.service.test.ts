import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { StakingRewardsService } from "./staking-rewards.service";

// Mock dependencies
const mockBlockTimeService = {
  getMinMaxBlock: jest.fn<any>(),
};

const mockSubscanService = {
  fetchNativeToken: jest.fn<any>(),
  fetchAllStakingRewards: jest.fn<any>(),
  fetchAllPoolStakingRewards: jest.fn<any>(),
};

const mockStakingRewardsViaEventsService = {
  fetchStakingRewards: jest.fn<any>(),
};

describe("StakingRewardsService", () => {
  let service: StakingRewardsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StakingRewardsService(
      mockBlockTimeService as any,
      mockSubscanService as any,
      mockStakingRewardsViaEventsService as any,
    );
  });

  describe("filterRewards", () => {
    it("filters rewards by date", async () => {
      const rawRewards = [
        {
          event_id: "Reward",
          amount: 100,
          timestamp: 1000,
          block: "1",
          hash: "hash1",
        },
        {
          event_id: "Slash",
          amount: -500,
          timestamp: 2000,
          block: "2",
          hash: "hash2",
        },
        {
          event_id: "Reward",
          amount: 300,
          timestamp: 3000,
          block: "3",
          hash: "hash3",
        },
      ];

      // Min date = 1500 ms, max date = 3500 ms, so reward with timestamp=1000 is filtered out
      const filtered = await (service as any).filterRewards(
        rawRewards,
        1500000,
        3500000,
      );

      expect(filtered).toHaveLength(2);

      expect(filtered[0]).toEqual({
        block: "2",
        timestamp: 2000,
        amount: -500,
        hash: "hash2",
      });
      expect(filtered[1]).toEqual({
        block: "3",
        timestamp: 3000,
        amount: 300,
        hash: "hash3",
      });
    });
  });

  describe("fetchStakingRewards", () => {
    it("calls stakingRewardsViaEventsService for specific chains and filters results", async () => {
      const mockRewards = [
        {
          amount: 100,
          timestamp: 2000,
          block: "1",
          hash: "h1",
        },
      ];
      mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
        blockMin: 1,
        blockMax: 10,
      });
      mockStakingRewardsViaEventsService.fetchStakingRewards.mockResolvedValue(
        mockRewards,
      );
      mockSubscanService.fetchNativeToken.mockResolvedValue({
        token_decimals: 9,
      });

      const result = await service.fetchStakingRewards(
        "mythos",
        "addr",
        1000000,
        3000000,
      );

      expect(
        mockStakingRewardsViaEventsService.fetchStakingRewards,
      ).toHaveBeenCalledWith(
        "mythos",
        "addr",
        "collatorstaking",
        "StakingRewardReceived",
        1,
        10,
      );
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBeCloseTo(100);
    });

    it("calls subscanService.fetchAllStakingRewards for default chain", async () => {
      const mockRewards = [
        {
          event_id: "Reward",
          amount: "2000000000",
          timestamp: 2500,
          block: "2",
          hash: "h2",
        },
      ];
      mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
        blockMin: 5,
        blockMax: 15,
      });
      mockSubscanService.fetchAllStakingRewards.mockResolvedValue(mockRewards);
      mockSubscanService.fetchNativeToken.mockResolvedValue({
        token_decimals: 9,
      });

      const result = await service.fetchStakingRewards(
        "unknown",
        "addr",
        2000000,
        3000000,
      );

      expect(mockSubscanService.fetchAllStakingRewards).toHaveBeenCalledWith(
        "unknown",
        "addr",
        5,
        15,
      );
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBeCloseTo(2);
    });
  });
});
