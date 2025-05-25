import { Job } from "../../model/job";
import { StakingRewardsWithFiatService } from "../data-aggregation/services/staking-rewards-with-fiat.service";
import { logger } from "../logger/logger";
import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { getYearRangeInZone } from "./get-range-in-time-zone";

export class JobConsumer {
    constructor(private jobsCache: JobsCache, private stakingRewardsWithFiatService: StakingRewardsWithFiatService) {
    }

    async process(job: Job) {
        try {
            logger.info("Processing job " + JSON.stringify(job))
            const chain = subscanChains.chains.find(
                (p) => p.domain.toLowerCase() === job.blockchain.toLowerCase(),
              );
              if (!chain) {
                this.jobsCache.setError({ "msg": "Chain " + job.blockchain + " not found"}, job)
                return
              }
              this.jobsCache.setInProgress(job)
            const { startDay, endDay } = getYearRangeInZone(job.timeframe, 'Europe/Zurich') // TODO use time zone from client

            const result = await this.stakingRewardsWithFiatService.fetchStakingRewards({
                    chain,
                  address: job.wallet,
                  currency: job.currency,
                  startDay,
                  endDay,
            })
            this.jobsCache.setDone(result, job)
        } catch (error) {
          logger.error(error)
          logger.error("Error processing job: " + JSON.stringify(job))
          try {
            this.jobsCache.setError({ "msg": "Error processing job: " + JSON.stringify(job) }, job)
          } catch (error) {
            logger.error(error)
            logger.error("Error setting job to state error: " + JSON.stringify(job))
          }
        }
    }
}
