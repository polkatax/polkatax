import { JobResult } from './job-result'

export interface WebSocketOutGoingMessage {
  type: 'refreshDataRequest' | 'fetchDataRequest'
  payload: {
    wallet: string,
    timeframe: number,
    timeZone: string,
    blockchains?: string[]
  }
}

export interface WebSocketIncomingMessage {
  timestamp: number
  payload: JobResult[]
}
