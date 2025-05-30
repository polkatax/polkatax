import { JobResult } from './job-result';

export interface WebSocketOutGoingMessage {
  type: 'fetchDataRequest' | 'unsubscribeRequest';
  payload: {
    wallet: string;
    timeframe: number;
    currency: string;
    blockchains?: string[];
  };
}

export interface WebSocketIncomingMessage {
  type: 'data' | 'error' | 'acknowledgeUnsubscribe';
  reqId: string;
  timestamp: number;
  payload: JobResult[];
  error?: { code: number; msg: string };
}
