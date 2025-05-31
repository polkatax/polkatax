import { Job } from "../../model/job";
import { WsError } from "./ws-error";

export interface WebSocketOutgoingMessage {
  type: "data" | "error" | "acknowledgeUnsubscribe";
  timestamp: number;
  reqId: string;
  payload: Job[];
  error?: WsError;
}
