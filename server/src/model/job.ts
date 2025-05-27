import { HttpError } from "../common/error/HttpError";

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
  error?: HttpError;
  lastModified: number;
  timeZone: string;
  deleted?: boolean;
}
