import { JobsService } from "./jobs.service";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { Job } from "../../model/job";
import { filter, firstValueFrom } from "rxjs";
import { determineNextJob } from "./determine-next-job";
import { AwilixContainer } from "awilix";
import { isEvmAddress } from "../data-aggregation/helper/is-evm-address";
import { getBeginningLastYear } from "./get-beginning-last-year";

export class JobManager {
  constructor(
    private jobsService: JobsService,
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

  async enqueue(
    reqId: string,
    wallet: string,
    currency: string,
    blockchains: string[] = [],
  ): Promise<Job[]> {
    const syncFromDate = getBeginningLastYear();
    const chains = blockchains.length
      ? blockchains
      : this.getStakingChains(wallet);

    const matchingJobs = (await this.jobsService.fetchJobs(wallet)).filter(
      (j) => chains.includes(j.blockchain) && j.currency === currency,
    );

    const alreadySyncedJobs: Job[] = [];
    const newJobs: Job[] = [];

    for (const blockchain of chains) {
      const job = matchingJobs.find((j) => j.blockchain === blockchain);

      const jobCannotBeReused = job && job.status === "error";
      const jobOutdatedButDataReusable =
        job && job.status === "done" && this.isOutDated(job);

      if (job && jobCannotBeReused) {
        this.jobsService.delete(job);
      }

      if (!job || jobCannotBeReused) {
        newJobs.push(
          await this.jobsService.addJob(
            reqId,
            wallet,
            blockchain,
            syncFromDate,
            currency,
          ),
        );
      } else if (jobOutdatedButDataReusable) {
        this.jobsService.delete(job);
        newJobs.push(
          await this.jobsService.addJob(
            reqId,
            wallet,
            blockchain,
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
        this.jobsService.pendingJobs$.pipe(filter((jobs) => jobs.length > 0)),
      );
      const job = determineNextJob(jobs, previousWallet);

      if (job) {
        previousWallet = job.wallet;
        await this.DIContainer.resolve("jobConsumer").process(job);
      }
    }
  }
}
