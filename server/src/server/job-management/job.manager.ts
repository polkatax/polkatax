import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { logger } from "../logger/logger";
import { Job } from "../../model/job";
import { filter, firstValueFrom } from "rxjs";
import { DIContainer } from "../di-container";
import { determineNextJob } from "./determine-next-job";

export class JobManager {
  constructor(private jobsCache: JobsCache) {
    this.start();
  }

  get stakingChains() {
    return subscanChains.chains
      .filter((c) => c.stakingPallets.length > 0 && !c.pseudoStaking)
      .map((c) => c.domain);
  }

  isOutDated(job: Job) {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return (
      job.timeframe === new Date().getFullYear() &&
      now - job.lastModified > threeDaysMs
    );
  }

  retryOrRefresh(
    reqId: string,
    wallet: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string,
    timeZone: string,
    blockchains: string[] = this.stakingChains,
  ): Job[] {
    const matchingJobs = this.jobsCache
      .fetchJobs(wallet)
      .filter(
        (j) =>
          blockchains.includes(j.blockchain) &&
          j.currency === currency &&
          j.timeframe === timeframe &&
          j.type === type,
      );

    const failedOrOutDated = matchingJobs.filter(
      (j) => j.status === "error" || this.isOutDated(j),
    );
    const validJobs = matchingJobs.filter((j) => !failedOrOutDated.includes(j));
    const syncedChains = validJobs.map((j) => j.blockchain);

    failedOrOutDated.forEach((j) => this.jobsCache.delete(j));

    const newJobs = blockchains
      .filter((chain) => !syncedChains.includes(chain))
      .map((chain) =>
        this.jobsCache.addJob(
          reqId,
          wallet,
          chain,
          type,
          timeframe,
          currency,
          timeZone,
        ),
      );

    return [...validJobs, ...newJobs];
  }

  enqueue(
    reqId: string,
    wallet: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string,
    timeZone: string,
    blockchains: string[] = this.stakingChains,
  ): Job[] {
    return blockchains.map((chain) => {
      const existingJob = this.jobsCache.fetchJob(
        wallet,
        chain,
        type,
        timeframe,
        currency,
      );

      if (existingJob) {
        if (this.isOutDated(existingJob)) {
          this.jobsCache.delete(existingJob);
          return this.jobsCache.addJob(
            reqId,
            wallet,
            chain,
            type,
            timeframe,
            currency,
            timeZone,
          );
        }

        logger.info(
          `Job already exists: ${chain}, ${wallet}, ${type}, ${timeframe}, ${currency}`,
        );
        return { ...existingJob };
      }

      return this.jobsCache.addJob(
        reqId,
        wallet,
        chain,
        type,
        timeframe,
        currency,
        timeZone,
      );
    });
  }

  async start() {
    let previousWallet: string | undefined;

    while (true) {
      const jobs = await firstValueFrom(
        this.jobsCache.pendingJobs$.pipe(filter((jobs) => jobs.length > 0)),
      );
      const job = determineNextJob(jobs, previousWallet);

      if (job) {
        previousWallet = job.wallet;
        try {
          return DIContainer.resolve("jobConsumer").process(job);
        } catch (error) {
          logger.error("Error processing job.", error);
        }
      }
    }
  }
}
