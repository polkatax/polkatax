import { Job, JobId } from "../../model/job";
import { Subject, BehaviorSubject } from "rxjs";
import { logger } from "../logger/logger";
import { WsError } from "../model/ws-error";

export class JobsCache {
  private allJobs: Job[] = [];
  pendingJobs$ = new BehaviorSubject<Job[]>([]);
  jobUpdate$ = new Subject<Job>();

  addJob(
    reqId: string,
    wallet: string,
    blockchain: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string
  ) {
    logger.info(
      `Adding job: ${reqId}, ${wallet}, ${blockchain}, ${type}, ${timeframe}, ${currency}`,
    );

    const job: Job = {
      reqId,
      wallet,
      blockchain,
      type,
      timeframe,
      status: "pending",
      lastModified: Date.now(),
      currency
    };

    this.allJobs.push(job);
    this.publishPendingJobs();
    return job;
  }

  delete(job: Job) {
    job.deleted = true;
  }

  get jobs() {
    return this.allJobs.filter((j) => !j.deleted);
  }

  private findJobOrThrow(jobId: JobId): Job {
    const job = this.jobs.find(
      (j) =>
        j.wallet === jobId.wallet &&
        j.blockchain === jobId.blockchain &&
        j.type === jobId.type &&
        j.timeframe === jobId.timeframe &&
        j.currency === jobId.currency,
    );

    if (!job) {
      throw new Error(
        `Job not found: ${jobId.wallet}, ${jobId.blockchain}, ${jobId.type}, ${jobId.timeframe}`,
      );
    }

    return job;
  }

  fetchJob(
    wallet: string,
    blockchain: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string,
  ): Job | undefined {
    return this.jobs.find(
      (j) =>
        j.wallet === wallet &&
        j.blockchain === blockchain &&
        j.type === type &&
        j.timeframe === timeframe &&
        j.currency === currency,
    );
  }

  setInProgress(jobId: JobId) {
    const job = this.findJobOrThrow(jobId);
    job.status = "in_progress";
    job.lastModified = Date.now();
    this.jobUpdate$.next(job);
    this.publishPendingJobs();
  }

  setDone(data: any, jobId: JobId) {
    const job = this.findJobOrThrow(jobId);
    job.data = data;
    job.status = "done";
    job.lastModified = Date.now();
    this.jobUpdate$.next(job);
  }

  setError(error: WsError, jobId: JobId) {
    const job = this.findJobOrThrow(jobId);
    job.error = error;
    job.status = "error";
    job.lastModified = Date.now();
    this.jobUpdate$.next(job);
  }

  cleanUp() {
    this.allJobs = this.allJobs.filter((job) => !job.deleted);

    this.jobs
      .filter(
        (j) =>
          (j.status === "done" || j.status === "error") &&
          Date.now() - j.lastModified > 72 * 60 * 60 * 1000, // older than 72h
      )
      .forEach((j) => (j.deleted = true));
  }

  private publishPendingJobs() {
    this.pendingJobs$.next(this.jobs.filter((j) => j.status === "pending"));
  }

  fetchJobs(wallet: string) {
    return this.jobs.filter((j) => j.wallet === wallet);
  }
}
