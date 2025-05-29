import { Rewards } from './rewards';

export interface JobResult {
  wallet: string;
  timeframe: number;
  currency: string;
  type: 'staking_rewards' | 'transactions';
  error: any;
  data: Rewards;
  timestamp: number;
  blockchain: string;
  status: string;
  timeZone: string;
}
