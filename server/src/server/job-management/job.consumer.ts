import { Job } from "../../model/job";
import { StakingRewardsWithFiatService } from "../data-aggregation/services/staking-rewards-with-fiat.service";
import { logger } from "../logger/logger";
import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { getYearRangeInZone } from "./get-range-in-time-zone";
import { HttpError } from "../../common/error/HttpError";

export class JobConsumer {
  constructor(
    private jobsCache: JobsCache,
    private stakingRewardsWithFiatService: StakingRewardsWithFiatService,
  ) {}

  async process(job: Job) {
    try {
      logger.info(
        "Entry: JobConsumer process: " +
          JSON.stringify({ ...job, data: undefined }),
      );
      const chain = subscanChains.chains.find(
        (p) => p.domain.toLowerCase() === job.blockchain.toLowerCase(),
      );
      if (!chain) {
        this.jobsCache.setError(
          new HttpError(400, "Chain " + job.blockchain + " not found"),
          job,
        );
        return;
      }
      this.jobsCache.setInProgress(job);
      const { startDay, endDay } = getYearRangeInZone(
        job.timeframe,
        job.timeZone || "Europe/Zurich",
      );

      const result =
        await this.stakingRewardsWithFiatService.fetchStakingRewards({
          chain,
          address: job.wallet,
          currency: job.currency,
          startDay,
          endDay,
        });
      this.jobsCache.setDone(result, job);
      logger.info(
        "Exit: JobConsumer process: " +
          JSON.stringify({ ...job, data: undefined }),
      );
    } catch (error) {
      logger.error(error);
      logger.error("Error processing job: " + JSON.stringify(job));
      try {
        this.jobsCache.setError(
          new HttpError(
            error?.statusCode,
            error.message ?? "Error processing job: " + JSON.stringify(job),
          ),
          job,
        );
      } catch (error) {
        logger.error(error);
        logger.error("Setting job to state error: " + JSON.stringify(job));
      }
    }
  }
}
