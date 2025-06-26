import { Job } from "../../model/job";
import { StakingRewardsWithFiatService } from "../data-aggregation/services/staking-rewards-with-fiat.service";
import { logger } from "../logger/logger";
import { JobsService } from "./jobs.service";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { StakingRewardsResponse } from "../data-aggregation/model/staking-rewards.response";

export class JobConsumer {
  constructor(
    private jobsService: JobsService,
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
        await this.jobsService.setError(
          {
            code: 400,
            msg: "Chain " + job.blockchain + " not found",
          },
          job,
        );
        return;
      }

      const success = await this.jobsService.setInProgress(job);
      if (!success) {
        logger.info(
          "Can not set job in progress. Probably it's being consumed by a different process already.",
        );
        return;
      }

      const result =
        await this.stakingRewardsWithFiatService.fetchStakingRewards({
          chain,
          address: job.wallet,
          currency: job.currency,
          startDate: job.syncFromDate,
        });
      if (job.data) {
        const previouslySyncedValues = (
          job.data as StakingRewardsResponse
        ).values.filter((v) => v.timestamp < job.syncFromDate);
        result.values = result.values.concat(previouslySyncedValues);
      }
      await this.jobsService.setDone(result, job);
      logger.info(
        "Exit: JobConsumer process: " +
          JSON.stringify({ ...job, data: undefined }),
      );
    } catch (error) {
      logger.error(error);
      logger.error("Error processing job: " + JSON.stringify(job));
      try {
        await this.jobsService.setError(
          {
            code: error?.statusCode ?? 500,
            msg:
              error.message ?? "Error processing job: " + JSON.stringify(job),
          },
          job,
        );
      } catch (error) {
        logger.error(error);
        logger.error("Setting job to state error: " + JSON.stringify(job));
      }
    }
  }
}
