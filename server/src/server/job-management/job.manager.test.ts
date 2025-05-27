import { JobsCache } from "./jobs.cache";
import { Job } from "../../model/job";
import { Subject } from "rxjs";
import * as determineNextJobModule from "./determine-next-job";
import { DIContainer } from "../di-container";
import { expect, it, describe, jest, beforeEach } from "@jest/globals";
import { JobManager } from "./job.manager";

jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../di-container", () => ({
  DIContainer: {
    resolve: jest.fn(),
  },
}));

describe("JobManager", () => {
  let mockJobsCache: jest.Mocked<JobsCache>;
  let pendingJobs$: Subject<Job[]>;

  beforeEach(() => {
    pendingJobs$ = new Subject<Job[]>();

    mockJobsCache = {
      fetchJobs: jest.fn(),
      fetchJob: jest.fn(),
      addJob: jest.fn(),
      delete: jest.fn(),
      pendingJobs$: pendingJobs$,
    } as unknown as jest.Mocked<JobsCache>;

    jest.clearAllMocks();
  });

  it("should enqueue a new job if none exists", () => {
    const job: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: 2024,
      timeZone: "UTC",
      type: "staking_rewards",
      data: undefined,
    } as any;

    mockJobsCache.fetchJob.mockReturnValue(undefined);
    mockJobsCache.addJob.mockReturnValue(job);

    const manager = new JobManager(mockJobsCache);
    const jobs = manager.enqueue(
      "req1",
      "wallet1",
      "staking_rewards",
      2024,
      "USD",
      "UTC",
      ["polkadot"],
    );

    expect(jobs.length).toBe(1);
    expect(mockJobsCache.addJob).toHaveBeenCalledWith(
      "req1",
      "wallet1",
      "polkadot",
      "staking_rewards",
      2024,
      "USD",
      "UTC",
    );
  });

  it("should reuse valid job and not enqueue new one", () => {
    const existingJob: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: new Date().getFullYear(),
      timeZone: "UTC",
      type: "staking_rewards",
      lastModified: new Date().getTime(),
      data: undefined,
    } as any;

    mockJobsCache.fetchJob.mockReturnValue(existingJob);

    const manager = new JobManager(mockJobsCache);
    const jobs = manager.enqueue(
      "req1",
      "wallet1",
      "staking_rewards",
      existingJob.timeframe,
      "USD",
      "UTC",
      ["polkadot"],
    );

    expect(jobs.length).toBe(1);
    expect(jobs[0]).toEqual(existingJob);
    expect(mockJobsCache.delete).not.toHaveBeenCalled();
    expect(mockJobsCache.addJob).not.toHaveBeenCalled();
  });

  it("should delete outdated jobs and create new ones in retryOrRefresh", () => {
    const outdatedJob: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: new Date().getFullYear(),
      timeZone: "UTC",
      type: "staking_rewards",
      lastModified: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days old
      data: undefined,
    } as any;

    const newJob: Job = {
      ...outdatedJob,
      lastModified: Date.now(),
    };

    mockJobsCache.fetchJobs.mockReturnValue([outdatedJob]);
    mockJobsCache.addJob.mockReturnValue(newJob);

    const manager = new JobManager(mockJobsCache);
    const result = manager.retryOrRefresh(
      "req1",
      "wallet1",
      "staking_rewards",
      new Date().getFullYear(),
      "USD",
      "UTC",
      ["polkadot"],
    );

    expect(mockJobsCache.delete).toHaveBeenCalledWith(outdatedJob);
    expect(mockJobsCache.addJob).toHaveBeenCalled();
    expect(result).toContainEqual(newJob);
  });

  it("start() processes the next job from observable", async () => {
    const job: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: 2024,
      timeZone: "UTC",
      type: "staking_rewards",
      lastModified: Date.now(),
      data: undefined,
    } as any;

    jest.spyOn(determineNextJobModule, "determineNextJob").mockReturnValue(job);

    const mockProcess = jest.fn();
    (DIContainer.resolve as jest.Mock).mockReturnValue({
      process: mockProcess,
    });

    new JobManager(mockJobsCache);

    // Let the start() method process this
    pendingJobs$.next([job]);

    // Wait a moment for async logic
    await new Promise((r) => setTimeout(r, 10));

    expect(mockProcess).toHaveBeenCalledWith(job);
  });
});
