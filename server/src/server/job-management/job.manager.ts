import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { Job } from "../../model/job";
import { filter, firstValueFrom } from "rxjs";
import { determineNextJob } from "./determine-next-job";
import { AwilixContainer } from "awilix";
import { isEvmAddress } from "../data-aggregation/helper/is-evm-address";
import { getBeginningLastYear } from "./get-beginning-last-year";
import { logger } from "../logger/logger";

export class JobManager {
  constructor(
    private jobsCache: JobsCache,
    private DIContainer: AwilixContainer,
  ) {}

  getStakingChains(wallet: string) {
    const isEvmWallet = isEvmAddress(wallet);
    return subscanChains.chains
      .filter((c) => c.stakingPallets.length > 0 && !c.pseudoStaking)
      .filter((c) => !isEvmWallet || c.evmPallet || c.evmAddressSupport)
      .map((c) => c.domain);
  }

  isOutDated(job: Job) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - job.lastModified > oneDayMs;
  }

  enqueue(
    reqId: string,
    wallet: string,
    type: "staking_rewards" | "transactions",
    currency: string,
    blockchains: string[] = [],
    syncFromDate: number = getBeginningLastYear(),
  ): Job[] {
    if (syncFromDate < getBeginningLastYear()) {
      logger.warn("Client tried to set date to " + syncFromDate + ", which is less than beginning of last year.")
      syncFromDate = getBeginningLastYear()
    }
    const chains = blockchains.length
      ? blockchains
      : this.getStakingChains(wallet);

    const matchingJobs = this.jobsCache
      .fetchJobs(wallet)
      .filter(
        (j) =>
          chains.includes(j.blockchain) &&
          j.currency === currency &&
          j.type === type,
      );

    const alreadySyncedJobs: Job[] = [];
    const newJobs: Job[] = [];

    for (const blockchain of chains) {
      const job = matchingJobs.find((j) => j.blockchain === blockchain);

      const jobCannotBeReused =
        job && (job.status === "error" || job.syncFromDate > syncFromDate);
      const jobOutdatedButDataReusable =
        job && job.status === "done" && this.isOutDated(job);

      if (job && jobCannotBeReused) {
        this.jobsCache.delete(job);
      }

      if (!job || jobCannotBeReused) {
        newJobs.push(
          this.jobsCache.addJob(
            reqId,
            wallet,
            blockchain,
            type,
            syncFromDate,
            currency,
          ),
        );
      } else if (jobOutdatedButDataReusable) {
        this.jobsCache.delete(job);
        newJobs.push(
          this.jobsCache.addJob(
            reqId,
            wallet,
            blockchain,
            type,
            Math.min(syncFromDate, job.syncedUntil || syncFromDate),
            currency,
            job.data,
          ),
        );
      } else {
        alreadySyncedJobs.push(job);
      }
    }

    return [...alreadySyncedJobs, ...newJobs];
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
        await this.DIContainer.resolve("jobConsumer").process(job);
      }
    }
  }
}
