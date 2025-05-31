import { PricedStakingReward } from "./priced-staking-reward";

export interface StakingRewardsResponse {
  values: PricedStakingReward[];
  token: string;
}
