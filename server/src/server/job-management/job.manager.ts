import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { logger } from "../logger/logger";
import { Job } from "../../model/job";
import { concatMap } from "rxjs";
import { DIContainer } from "../di-container";

export class JobManager {
  constructor(private jobsCache: JobsCache) {
    this.start();
  }

  enqueue(
    wallet: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string,
    timezone: string,
    blockchains: string[] = []
  ): Job[] {
    const jobs = [];
    const chains = blockchains.length > 0 ? blockchains : subscanChains.chains.filter(chain => chain.stakingPallets.length > 0 && !chain.pseudoStaking).map(c => c.domain)
    for (let chain of chains) {
      const exsitingJob = this.jobsCache.fetchJob(
        wallet,
        chain,
        type,
        timeframe,
      );
      if (exsitingJob) {
        logger.info(
          `Trying to add a job which already exists: ${chain}, ${wallet}. ${type}, ${timeframe}`,
        );
        jobs.push({
          ...exsitingJob,
        });
      } else {
        jobs.push(
          this.jobsCache.addJob(
            wallet,
            chain,
            type,
            timeframe,
            currency,
            timezone,
          ),
        );
      }
    }
    return jobs;
  }

  start() {
    this.jobsCache.pendingJobs$
      .pipe(
        concatMap(async (job) => {
          return DIContainer.resolve("jobConsumer").process(job);
        }),
      )
      .subscribe({
        next: () => {
          logger.info("Job processed");
          this.jobsCache.cleanUp();
        },
        error: (err) => logger.error(err),
      });
  }
}
