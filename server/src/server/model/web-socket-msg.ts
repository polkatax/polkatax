import { Job } from "../../model/job";
import { WsError } from "./ws-error";

export interface WebSocketOutgoingMessage {
  type: "data" | "error";
  timestamp: number;
  correspondingRequestId: string;
  payload: Job[];
  error?: WsError;
}
