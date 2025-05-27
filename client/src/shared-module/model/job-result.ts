export interface JobResult {
  wallet: string
  timeframe: number
  currency: string
  type: 'staking_rewards' | 'transactions'
  error: any
  data: any
  timestamp: number
  blockchain: string
  status: string
  timeZone: string;
}