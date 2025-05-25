import { StakingReward } from "../../blockchain/substrate/model/staking-reward";

export interface PricedStakingReward extends StakingReward {
  price?: number;
  fiatValue?: number;
}
