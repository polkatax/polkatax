import { Rewards } from './rewards';

export interface JobResult {
  wallet: string;
  syncedUntil?: number;
  currency: string;
  type: 'staking_rewards' | 'transactions';
  error: any;
  data: Rewards;
  lastModified: number;
  blockchain: string;
  status: string;
  syncFromDate: number;
}
