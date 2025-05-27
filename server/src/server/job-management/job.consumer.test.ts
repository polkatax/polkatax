import { expect, it, describe, jest, beforeEach } from "@jest/globals";
import { JobsCache } from "./jobs.cache";
import { StakingRewardsWithFiatService } from "../data-aggregation/services/staking-rewards-with-fiat.service";
import { HttpError } from "../../common/error/HttpError";
import { Job } from "../../model/job";
import * as getRangeModule from "./get-range-in-time-zone";
import { JobConsumer } from "./job.consumer";

jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("JobConsumer", () => {
  const mockCache: jest.Mocked<JobsCache> = {
    setInProgress: jest.fn(),
    setDone: jest.fn(),
    setError: jest.fn(),
  } as any;

  const mockService: jest.Mocked<StakingRewardsWithFiatService> = {
    fetchStakingRewards: jest.fn(),
  } as any;

  const consumer = new JobConsumer(mockCache, mockService);

  const validJob: Job = {
    wallet: "wallet1",
    blockchain: "polkadot",
    currency: "USD",
    timeframe: 2023,
    timeZone: "UTC",
    data: undefined,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(getRangeModule, "getYearRangeInZone").mockReturnValue({
      startDay: new Date("2023-01-01T00:00:00Z"),
      endDay: new Date("2023-12-31T23:59:59Z"),
    });
  });

  it("processes job successfully and caches result", async () => {
    const result = { rewards: 123.45 };
    mockService.fetchStakingRewards.mockResolvedValue(result as any);

    await consumer.process(validJob);

    expect(mockCache.setInProgress).toHaveBeenCalledWith(validJob);
    expect(mockService.fetchStakingRewards).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: expect.objectContaining({ domain: "polkadot" }),
        address: "wallet1",
        currency: "USD",
        startDay: expect.any(Date),
        endDay: expect.any(Date),
      }),
    );
    expect(mockCache.setDone).toHaveBeenCalledWith(result, validJob);
  });

  it("sets error if blockchain is unknown", async () => {
    const badJob = { ...validJob, blockchain: "nonexistent" };

    await consumer.process(badJob);

    expect(mockCache.setError).toHaveBeenCalledWith(
      new HttpError(400, "Chain nonexistent not found"),
      badJob,
    );
    expect(mockCache.setInProgress).not.toHaveBeenCalled();
    expect(mockService.fetchStakingRewards).not.toHaveBeenCalled();
  });

  it("sets error if fetchStakingRewards throws", async () => {
    const err = new HttpError(500, "API down");
    mockService.fetchStakingRewards.mockRejectedValue(err);

    await consumer.process(validJob);

    expect(mockCache.setError).toHaveBeenCalledWith(
      expect.any(HttpError),
      validJob,
    );
  });

  it("fallbacks if setError throws internally", async () => {
    mockService.fetchStakingRewards.mockRejectedValue(new Error("fail"));
    mockCache.setError.mockImplementation(() => {
      throw new Error("cache set failed");
    });

    await consumer.process(validJob);

    // Should log an additional internal failure, not crash
    expect(mockCache.setError).toHaveBeenCalled();
  });
});
