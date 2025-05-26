export interface Job {
  wallet: string
  timeframe: number
  currency: string
  type: 'staking_rewards' | 'transactions'
  error: any
  value: any
  timestamp: number
  blockchain: string
  status: string
  timeZone: string;
}