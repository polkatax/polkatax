import { Job } from "../../model/job";

export interface WebSocketIncomingMessage {
  type: "fetchDataRequest";
  timestamp: number;
  requestId: string;
  payload: WalletInfo;
}

export interface WebSocketOutgoingMessage {
  type: "data";
  timestamp: number;
  correspondingRequestId: string;
  payload: Job[];
}

export interface WalletInfo {
  wallet: string;
  currency: string;
  timeframe: number;
  timeZone: string;
  blockchains?: string[];
}
