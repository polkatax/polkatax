import { expect, it, describe, jest, beforeEach } from "@jest/globals";

import { JobsCache } from "./jobs.cache";
import { Job } from "../../model/job";
import { AwilixContainer } from "awilix";
import { JobManager } from "./job.manager";

jest.mock("../../../res/gen/subscan-chains.json", () => ({
  chains: [
    {
      domain: "chain1",
      stakingPallets: [1],
      pseudoStaking: false,
      evmPallet: true,
      evmAddressSupport: true,
    },
    {
      domain: "chain2",
      stakingPallets: [],
      pseudoStaking: false,
      evmPallet: false,
      evmAddressSupport: false,
    },
    {
      domain: "chain3",
      stakingPallets: [1],
      pseudoStaking: true,
      evmPallet: false,
      evmAddressSupport: false,
    },
  ],
}));

jest.mock("../data-aggregation/helper/is-evm-address", () => ({
  isEvmAddress: jest.fn(),
}));

jest.mock("./determine-next-job", () => ({
  determineNextJob: jest.fn(() => null),
}));

jest.mock("./get-beginning-last-year", () => ({
  getBeginningLastYear: jest.fn(() => 123456789),
}));

describe("JobManager", () => {
  let jobsCache: JobsCache;
  let diContainer: AwilixContainer;
  let jobManager: JobManager;
  const mockIsEvmAddress =
    require("../data-aggregation/helper/is-evm-address").isEvmAddress;

  beforeEach(() => {
    jobsCache = {
      fetchJobs: jest.fn().mockReturnValue([]),
      delete: jest.fn(),
      addJob: jest
        .fn()
        .mockImplementation(
          (reqId, wallet, blockchain, type, syncFromDate, currency, data) => ({
            reqId,
            wallet,
            blockchain,
            type,
            syncFromDate,
            currency,
            data,
            status: "pending",
            lastModified: Date.now(),
          }),
        ),
      pendingJobs$: {
        pipe: jest.fn().mockReturnThis(),
      },
    } as unknown as JobsCache;

    diContainer = {
      resolve: jest.fn().mockReturnValue({
        process: jest.fn<any>().mockResolvedValue(undefined),
      }),
    } as unknown as AwilixContainer;

    mockIsEvmAddress.mockReturnValue(false);

    jobManager = new JobManager(jobsCache, diContainer);
  });

  describe("getStakingChains", () => {
    it("returns chains with staking pallets and no pseudoStaking for non-EVM wallets", () => {
      mockIsEvmAddress.mockReturnValue(false);
      const chains = jobManager.getStakingChains("nonEvmWallet");
      expect(chains).toContain("chain1");
      expect(chains).not.toContain("chain2"); // no staking pallets
      expect(chains).not.toContain("chain3"); // pseudoStaking true
    });

    it("filters EVM chains correctly for EVM wallets", () => {
      mockIsEvmAddress.mockReturnValue(true);
      const chains = jobManager.getStakingChains("evmWallet");
      expect(chains).toContain("chain1"); // has evmPallet true
      expect(chains).not.toContain("chain3"); // pseudoStaking true
    });
  });

  describe("isOutDated", () => {
    it("returns true if job lastModified is more than 1 day ago", () => {
      const oldJob = { lastModified: Date.now() - 25 * 60 * 60 * 1000 } as Job;
      expect(jobManager.isOutDated(oldJob)).toBe(true);
    });

    it("returns false if job lastModified is less than 1 day ago", () => {
      const recentJob = {
        lastModified: Date.now() - 2 * 60 * 60 * 1000,
      } as Job;
      expect(jobManager.isOutDated(recentJob)).toBe(false);
    });
  });

  describe("enqueue", () => {
    it("adds new job if no matching job found", () => {
      jobsCache.fetchJobs = jest.fn<any>().mockReturnValue([]);
      const syncFrom = new Date().getTime() - 60_000_000;
      const addedJobs = jobManager.enqueue(
        "req1",
        "wallet1",
        "staking_rewards",
        "USD",
        ["chain1"],
        syncFrom,
      );
      expect(addedJobs.length).toBe(1);
      expect(jobsCache.addJob).toHaveBeenCalledWith(
        "req1",
        "wallet1",
        "chain1",
        "staking_rewards",
        syncFrom,
        "USD",
      );
    });

    it("reuses job if status done and not outdated", () => {
      const job = {
        wallet: "wallet1",
        blockchain: "chain1",
        currency: "USD",
        type: "staking_rewards",
        status: "done",
        lastModified: Date.now(),
        syncFromDate: 500,
      } as Job;
      jobsCache.fetchJobs = jest.fn<any>().mockReturnValue([job]);
      const jobs = jobManager.enqueue(
        "req1",
        "wallet1",
        "staking_rewards",
        "USD",
        ["chain1"],
        1000,
      );
      expect(jobs).toContain(job);
      expect(jobsCache.addJob).not.toHaveBeenCalled();
    });

    it("deletes job and adds new if job in error", () => {
      const job = {
        wallet: "wallet1",
        blockchain: "chain1",
        currency: "USD",
        type: "staking_rewards",
        status: "error",
        syncFromDate: 500,
      } as Job;
      jobsCache.fetchJobs = jest.fn<any>().mockReturnValue([job]);
      const jobs = jobManager.enqueue(
        "req1",
        "wallet1",
        "staking_rewards",
        "USD",
        ["chain1"],
        1000,
      );
      expect(jobsCache.delete).toHaveBeenCalledWith(job);
      expect(jobsCache.addJob).toHaveBeenCalled();
      expect(jobs).toHaveLength(1);
    });

    it("handles outdated but reusable job correctly", () => {
      const oldDate = Date.now() - 25 * 60 * 60 * 1000;
      const job = {
        wallet: "wallet1",
        blockchain: "chain1",
        currency: "USD",
        type: "staking_rewards",
        status: "done",
        lastModified: oldDate,
        syncedUntil: 900,
        syncFromDate: 800,
        data: { some: "data" },
      } as Job;
      jobsCache.fetchJobs = jest.fn<any>().mockReturnValue([job]);
      const jobs = jobManager.enqueue(
        "req1",
        "wallet1",
        "staking_rewards",
        "USD",
        ["chain1"],
        1000,
      );
      expect(jobsCache.delete).toHaveBeenCalledWith(job);
      expect(jobsCache.addJob).toHaveBeenCalledWith(
        "req1",
        "wallet1",
        "chain1",
        "staking_rewards",
        900, // min(syncFromDate=1000, job.syncedUntil=900)
        "USD",
        job.data,
      );
      expect(jobs.length).toBe(1);
    });
  });
});
