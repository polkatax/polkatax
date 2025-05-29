import { WsError } from "../server/model/ws-error";

export interface JobId {
  wallet: string;
  blockchain: string;
  type: "staking_rewards" | "transactions";
  timeframe: number;
  currency: string;
}

export interface Job extends JobId {
  reqId: string;
  status: "pending" | "in_progress" | "done" | "error";
  data?: any;
  error?: WsError;
  lastModified: number;
  deleted?: boolean;
}
