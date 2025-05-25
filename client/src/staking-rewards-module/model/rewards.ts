export interface Reward extends RewardDto {
  timestamp: number;
  valueNow?: number;
  isoDate: string;
}

export interface RewardSummary {
  amount: number;
  fiatValue?: number;
  valueNow?: number;
}

export interface DailyRewards {
  [key: string]: { amount: number; fiatValue?: number; valueNow?: number };
}

export interface Rewards {
  token: string;
  chain: string;
  address: string;
  currency: string;
  currentPrice: number;
  timeFrame: number;
  startDate: number;
  endDate: number;
  summary: RewardSummary;
  values: Reward[];
  dailyValues: DailyRewards;
}

export interface RewardDto {
  timestamp: number;
  block: number;
  amount: number;
  fiatValue?: number;
  price?: number;
  hash: string;
}

export interface RewardsDto {
  values: RewardDto[];
  currentPrice: number;
  token: string;
}
