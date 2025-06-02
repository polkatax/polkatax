import {
  expect,
  it,
  describe,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Job } from "../../model/job";
import { WsError } from "../model/ws-error";
import { JobsCache } from "./jobs.cache";

describe("JobsCache", () => {
  let cache: JobsCache;
  const nowSpy = jest.spyOn(Date, "now");

  beforeEach(() => {
    cache = new JobsCache();
    nowSpy.mockReturnValue(1000000000000); // fixed timestamp for tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("adds a job and publishes pending jobs", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    expect(job.reqId).toBe("req1");
    expect(job.status).toBe("pending");
    expect(cache.jobs).toContainEqual(job);

    // pendingJobs$ emits array containing the new job
    cache.pendingJobs$.subscribe((pending) => {
      expect(pending).toContainEqual(job);
    });
  });

  it("deletes a job and publishes pending jobs", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    cache.delete(job);
    expect(job.deleted).toBe(true);
    expect(cache.jobs).not.toContain(job);

    cache.pendingJobs$.subscribe((pending) => {
      expect(pending).not.toContain(job);
    });
  });

  it("returns only non-deleted jobs", () => {
    const job1 = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const job2 = cache.addJob(
      "req2",
      "wallet1",
      "eth",
      "transactions",
      123,
      "USD",
    );
    cache.delete(job1);

    const jobs = cache.jobs;
    expect(jobs).toContain(job2);
    expect(jobs).not.toContain(job1);
  });

  it("fetchJob returns the correct job or undefined", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    expect(cache.fetchJob("wallet1", "eth", "staking_rewards", "USD")).toEqual(
      job,
    );
    expect(
      cache.fetchJob("wallet1", "eth", "transactions", "USD"),
    ).toBeUndefined();
  });

  it("setInProgress updates job and emits jobUpdate$", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const jobId = {
      wallet: "wallet1",
      blockchain: "eth",
      type: "staking_rewards",
      currency: "USD",
    };
    const emittedJobs: Job[] = [];

    cache.jobUpdate$.subscribe((updatedJob) => emittedJobs.push(updatedJob));
    cache.setInProgress(jobId as any);

    expect(job.status).toBe("in_progress");
    expect(job.lastModified).toBe(1000000000000);
    expect(emittedJobs).toContain(job);
  });

  it("setDone updates job data, status, syncedUntil and emits jobUpdate$", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const jobId = {
      wallet: "wallet1",
      blockchain: "eth",
      type: "staking_rewards",
      currency: "USD",
    };
    const emittedJobs: Job[] = [];

    cache.jobUpdate$.subscribe((updatedJob) => emittedJobs.push(updatedJob));

    const data = { foo: "bar" };
    cache.setDone(data, jobId as any);

    expect(job.data).toBe(data);
    expect(job.status).toBe("done");
    expect(job.syncedUntil).toBe(1000000000000 - 8 * 24 * 60 * 60 * 1000);
    expect(emittedJobs).toContain(job);
  });

  it("setError updates job error, status and emits jobUpdate$", () => {
    const job = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const jobId = {
      wallet: "wallet1",
      blockchain: "eth",
      type: "staking_rewards",
      currency: "USD",
    };
    const emittedJobs: Job[] = [];

    cache.jobUpdate$.subscribe((updatedJob) => emittedJobs.push(updatedJob));

    const error: WsError = { message: "error", code: 500 } as any;
    cache.setError(error, jobId as any);

    expect(job.error).toBe(error);
    expect(job.status).toBe("error");
    expect(emittedJobs).toContain(job);
  });

  it("throws error when findJobOrThrow cannot find a job", () => {
    expect(() =>
      cache.setInProgress({
        wallet: "w",
        blockchain: "b",
        type: "staking_rewards",
        currency: "USD",
      }),
    ).toThrow("Job not found: w, b, staking_rewards, USD");
  });

  it("cleanUp removes deleted jobs and marks old done/error jobs as deleted", () => {
    const oldTimestamp = 1000000000000 - 73 * 60 * 60 * 1000; // 73 hours ago
    const jobDone = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    jobDone.status = "done";
    jobDone.lastModified = oldTimestamp;

    const jobError = cache.addJob(
      "req2",
      "wallet1",
      "eth",
      "transactions",
      123,
      "USD",
    );
    jobError.status = "error";
    jobError.lastModified = oldTimestamp;

    const jobPending = cache.addJob(
      "req3",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );

    cache.cleanUp();

    expect(cache.jobs).not.toContain(jobDone);
    expect(cache.jobs).not.toContain(jobError);
    expect(cache.jobs).toContain(jobPending);
  });

  it("fetchJobs returns jobs for a specific wallet", () => {
    const job1 = cache.addJob(
      "req1",
      "wallet1",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const job2 = cache.addJob(
      "req2",
      "wallet2",
      "eth",
      "staking_rewards",
      123,
      "USD",
    );
    const job3 = cache.addJob(
      "req3",
      "wallet1",
      "btc",
      "transactions",
      123,
      "USD",
    );

    const wallet1Jobs = cache.fetchJobs("wallet1");
    expect(wallet1Jobs).toEqual(expect.arrayContaining([job1, job3]));
    expect(wallet1Jobs).not.toContain(job2);
  });
});
