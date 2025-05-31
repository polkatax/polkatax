import { BlockTimeService } from "./block-time.service";
import { BigNumber } from "bignumber.js";
import { SubscanService } from "../api/subscan.service";
import { StakingReward } from "../model/staking-reward";
import { logger } from "../../../logger/logger";
import { StakingRewardsViaEventsService } from "./staking-rewards-via-events.service";

export class StakingRewardsService {
  constructor(
    private blockTimeService: BlockTimeService,
    private subscanService: SubscanService,
    private stakingRewardsViaEventsService: StakingRewardsViaEventsService,
  ) {}

  private async filterRewards(
    rewards: StakingReward[],
    minDate: number,
    maxDate: number,
  ): Promise<StakingReward[]> {
    return rewards
      .filter(
        (r) =>
          (!maxDate || r.timestamp <= maxDate / 1000) &&
          r.timestamp >= minDate / 1000,
      )
      .map((reward) => ({
        block: reward.block,
        timestamp: reward.timestamp,
        amount: reward.amount,
        hash: reward.hash,
      }));
  }

  async fetchStakingRewards(
    chainName: string,
    address: string,
    minDate: number,
    maxDate?: number,
  ): Promise<StakingReward[]> {
    logger.info(
      `Entry fetchStakingRewards for address ${address} and chain ${chainName}`,
    );
    const rewardsSlashes = await (async () => {
      switch (chainName) {
        case "mythos":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "collatorstaking",
            "StakingRewardReceived",
            minDate,
          );
        case "energywebx":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "parachainstaking",
            "Rewarded",
            minDate,
          );
        case "darwinia":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "darwiniastaking",
            "RewardAllocated",
            minDate,
          );
        case "robonomics-freemium":
          return this.stakingRewardsViaEventsService.fetchStakingRewards(
            chainName,
            address,
            "staking",
            "reward",
            minDate,
          );
        default:
          const token = await this.subscanService.fetchNativeToken(chainName);
          const rawRewards = await this.subscanService.fetchAllStakingRewards(
            chainName,
            address,
            minDate,
          );
          return rawRewards.map((reward) => ({
            ...reward,
            amount:
              BigNumber(reward.amount)
                .dividedBy(Math.pow(10, token.token_decimals))
                .toNumber() * (reward.event_id === "Slash" ? -1 : 1),
          }));
      }
    })();
    const filtered = await this.filterRewards(rewardsSlashes, minDate, maxDate);
    logger.info(`Exit fetchStakingRewards with ${filtered.length} elements`);
    return filtered;
  }
}
