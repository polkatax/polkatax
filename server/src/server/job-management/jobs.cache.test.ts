import { JobsCache } from "./jobs.cache";
import { HttpError } from "../../common/error/HttpError";
import { Job } from "../../model/job";
import { expect, it, describe, beforeEach, jest } from "@jest/globals";

describe("JobsCache", () => {
  let jobsCache: JobsCache;

  beforeEach(() => {
    jobsCache = new JobsCache();
  });

  it("should add a job and emit pending jobs", (done) => {
    const spy = jest.fn();
    jobsCache.pendingJobs$.subscribe(spy);

    const job = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );

    expect(job.status).toBe("pending");
    expect(spy).toHaveBeenCalledWith([
      expect.objectContaining({ wallet: "wallet1" }),
    ]);
    expect(
      jobsCache.fetchJob("wallet1", "chain1", "staking_rewards", 2024, "USD"),
    ).toEqual(job);
    done();
  });

  it("should mark job as deleted and exclude from jobs", () => {
    const job = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );
    jobsCache.delete(job);

    expect(jobsCache.jobs).not.toContainEqual(
      expect.objectContaining({ deleted: true }),
    );
  });

  it("should set job to in_progress and emit update", (done) => {
    const job = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );

    jobsCache.jobUpdate$.subscribe((updatedJob) => {
      expect(updatedJob.status).toBe("in_progress");
      done();
    });

    jobsCache.setInProgress(job);
  });

  it("should set job to done with result and emit update", (done) => {
    const job = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );
    const result = { rewards: 123 };

    jobsCache.jobUpdate$.subscribe((updatedJob) => {
      expect(updatedJob.status).toBe("done");
      expect(updatedJob.data).toEqual(result);
      done();
    });

    jobsCache.setDone(result, job);
  });

  it("should set job to error and emit update", (done) => {
    const job = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );
    const error = { code: 500, msg: "error" };

    jobsCache.jobUpdate$.subscribe((updatedJob) => {
      expect(updatedJob.status).toBe("error");
      expect(updatedJob.error).toEqual(error);
      done();
    });

    jobsCache.setError(error, job);
  });

  it("should remove old or completed jobs on cleanUp", () => {
    const now = Date.now();

    const recentJob = jobsCache.addJob(
      "req1",
      "wallet1",
      "chain1",
      "staking_rewards",
      2024,
      "USD",
    );
    const oldDoneJob = jobsCache.addJob(
      "req2",
      "wallet1",
      "chain1",
      "staking_rewards",
      2023,
      "USD",
    );
    oldDoneJob.status = "done";
    oldDoneJob.lastModified = now - 100 * 60 * 60 * 1000; // > 72h

    jobsCache.cleanUp();

    expect(oldDoneJob.deleted).toBe(true);
    expect(recentJob.deleted).toBeFalsy();
  });

  it("should throw error if job not found in setDone/setError", () => {
    expect(() =>
      jobsCache.setDone(
        { val: 1 },
        {
          wallet: "w",
          blockchain: "b",
          type: "staking_rewards",
          timeframe: 2020,
          currency: "USD",
        },
      ),
    ).toThrow("Job not found");
  });
});
