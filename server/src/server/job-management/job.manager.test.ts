import { JobsCache } from "./jobs.cache";
import { Job } from "../../model/job";
import { Subject } from "rxjs";
import * as determineNextJobModule from "./determine-next-job";
import { expect, it, describe, jest, beforeEach } from "@jest/globals";
import { JobManager } from "./job.manager";
import { AwilixContainer } from "awilix";

jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("JobManager", () => {
  let mockJobsCache: jest.Mocked<JobsCache>;
  let pendingJobs$: Subject<Job[]>;
  let DIContainer: jest.Mocked<AwilixContainer>;

  beforeEach(() => {
    pendingJobs$ = new Subject<Job[]>();

    mockJobsCache = {
      fetchJobs: jest.fn(),
      fetchJob: jest.fn(),
      addJob: jest.fn(),
      delete: jest.fn(),
      pendingJobs$: pendingJobs$,
    } as unknown as jest.Mocked<JobsCache>;

    DIContainer = {
      resolve: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it("should enqueue a new job if none exists", () => {
    const job: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: 2024,
      type: "staking_rewards",
      data: undefined,
    } as any;
    mockJobsCache.fetchJobs.mockReturnValue([]);
    mockJobsCache.addJob.mockReturnValue(job);

    const manager = new JobManager(mockJobsCache, DIContainer);
    const jobs = manager.enqueue(
      "req1",
      "wallet1",
      "staking_rewards",
      2024,
      "USD",
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
    );
  });

  it("should delete outdated jobs and create new ones in enqueue", () => {
    const outdatedJob: Job = {
      wallet: "wallet1",
      blockchain: "polkadot",
      currency: "USD",
      timeframe: new Date().getFullYear(),
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

    const manager = new JobManager(mockJobsCache, DIContainer);
    const result = manager.enqueue(
      "req1",
      "wallet1",
      "staking_rewards",
      new Date().getFullYear(),
      "USD",
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
      type: "staking_rewards",
      lastModified: Date.now(),
      data: undefined,
    } as any;

    jest.spyOn(determineNextJobModule, "determineNextJob").mockReturnValue(job);

    const mockProcess = jest.fn();
    const DIContainer = {
      resolve: jest.fn().mockReturnValue({
        process: mockProcess,
      }),
    };

    new JobManager(mockJobsCache, DIContainer as any);

    // Let the start() method process this
    pendingJobs$.next([job]);

    // Wait a moment for async logic
    await new Promise((r) => setTimeout(r, 10));

    expect(mockProcess).toHaveBeenCalledWith(job);
  });
});
