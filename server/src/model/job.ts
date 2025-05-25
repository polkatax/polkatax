export interface JobId {
    wallet: string
    blockchain: string
    type: 'staking_rewards' | 'transactions'
    timeframe: number
} 

export interface Job extends JobId {
    status: 'pending' | 'in_progress' | 'done' | 'error'
    currency: string
    value?: any
    error?: any
    lastModified: number
    timeZone: string
}