import { PricedStakingReward } from "./priced-staking-reward";

export interface StakingRewardsResponse {
  values: PricedStakingReward[];
  priceEndDay: number;
  token: string;
}
