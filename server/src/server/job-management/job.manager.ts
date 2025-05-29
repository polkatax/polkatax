import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { logger } from "../logger/logger";
import { Job } from "../../model/job";
import { filter, firstValueFrom } from "rxjs";
import { determineNextJob } from "./determine-next-job";
import { AwilixContainer } from "awilix";

export class JobManager {
  constructor(
    private jobsCache: JobsCache,
    private DIContainer: AwilixContainer,
  ) {
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

  enqueue(
    reqId: string,
    wallet: string,
    type: "staking_rewards" | "transactions",
    timeframe: number,
    currency: string,
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
          currency
        ),
      );

    return [...validJobs, ...newJobs];
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
          await this.DIContainer.resolve("jobConsumer").process(job);
        } catch (error) {
          logger.error("Error processing job.", error);
        }
      }
    }
  }
}
