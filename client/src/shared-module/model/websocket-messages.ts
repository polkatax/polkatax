import { JobResult } from './job-result';

export interface WebSocketOutGoingMessage {
  type: 'fetchDataRequest';
  payload: {
    wallet: string;
    timeframe: number;
    currency: string;
    blockchains?: string[];
  };
}

export interface WebSocketIncomingMessage {
  timestamp: number;
  payload: JobResult[];
}
