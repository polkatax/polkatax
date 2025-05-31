import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { logger } from "../logger/logger";
import { Job } from "../../model/job";
import { filter, firstValueFrom } from "rxjs";
import { determineNextJob } from "./determine-next-job";
import { AwilixContainer } from "awilix";
import { isEvmAddress } from "../data-aggregation/helper/is-evm-address";
import { getBeginningLastYear } from "./get-beginning-last-year";

export class JobManager {
  constructor(
    private jobsCache: JobsCache,
    private DIContainer: AwilixContainer,
  ) {
    this.start();
  }

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
    blockchains =
      blockchains.length > 0 ? blockchains : this.getStakingChains(wallet);

    const matchingJobs = this.jobsCache
      .fetchJobs(wallet)
      .filter(
        (j) =>
          blockchains.includes(j.blockchain) &&
          j.currency === currency &&
          j.type === type,
      );

    const alreadySyncedJobs = [];
    const newJobs = [];
    for (let blockchain of blockchains) {
      const job = matchingJobs.find((j) => j.blockchain === blockchain);
      // if job is in error or the requesed date is older than the job fromDate -> delete job
      const jobCannotBeReused = job && (job.status === "error" || job.syncFromDate > syncFromDate)
      const jobOutdatedButDataReusable = job && job.status === "done" && this.isOutDated(job)
      if (job && jobCannotBeReused) {
        this.jobsCache.delete(job);
      }
      if (job === undefined || jobCannotBeReused) {
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
        // if job is just outdated (stale data), existing data will be reused
        this.jobsCache.delete(job);
        newJobs.push(
          this.jobsCache.addJob(
            reqId,
            wallet,
            blockchain,
            type,
            Math.min(syncFromDate, job.syncedUntil),
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
