export interface StakingRewardsRequest {
  chain: {
    domain: string;
    label: string;
    token: string;
  };
  address: string;
  currency: string;
  startDate: number;
}
