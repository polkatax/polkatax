import { JobsCache } from "./jobs.cache";
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { logger } from "../logger/logger";
import { Job } from "../../model/job";
import { concatMap } from "rxjs";
import { DIContainer } from "../di-container";

export class JobManager {
    constructor(private jobsCache: JobsCache) {
        this.start()
    }

    enqueue(wallet: string, type: 'staking_rewards' | 'transactions', timeframe: number, currency: string, timezone: string): Job[] { // optional blockchains!
        const jobs = []
        for (let chain of subscanChains.chains) {
            if (chain.stakingPallets.length > 0  && !chain.pseudoStaking) {
                const exsitingJob = this.jobsCache.fetchJob(wallet, chain.domain, type, timeframe)
                if (exsitingJob) {
                    logger.info(`Trying to add a job which already exists: ${chain.domain}, ${wallet}. ${type}, ${timeframe}`)
                    jobs.push({
                        ...exsitingJob
                    })
                } else {
                    jobs.push(this.jobsCache.addJob(wallet, chain.domain, type, timeframe, currency, timezone))
                }
            }
        }
        return jobs
    }

    start() {
        this.jobsCache.pendingJobs$.pipe(
            concatMap(async (job) => {
                return DIContainer.resolve("jobConsumer").process(job)
            })
            ).subscribe({
            next: () => {
                logger.info('Job processed');
                this.jobsCache.cleanUp()
            },
            error: err => logger.error(err)
            });
    }
}