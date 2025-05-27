import { JobManager } from "../job-management/job.manager";
import * as WebSocket from "ws";
import { JobsCache } from "../job-management/jobs.cache";
import {
  WebSocketIncomingMessage,
  WebSocketOutgoingMessage,
} from "../model/web-socket-msg";
import { logger } from "../logger/logger";
import { HttpError } from "../../common/error/HttpError";

export class WebSocketManager {
  connections: { wallet: string; socket: WebSocket }[] = [];

  constructor(
    private jobManager: JobManager,
    private jobsCache: JobsCache,
  ) {}

  async handleIncomingMsg(
    socket: WebSocket,
    msg: WebSocketIncomingMessage,
  ): Promise<WebSocketOutgoingMessage> {
    const { wallet, timeframe, currency, timeZone, blockchains } = msg.payload;

    if (
      !this.connections.some((c) => c.socket === socket && c.wallet === wallet)
    ) {
      this.connections.push({ wallet, socket });
    }

    let jobs;
    switch (msg.type) {
      case "fetchDataRequest":
        jobs = this.jobManager.enqueue(
          msg.requestId,
          wallet,
          "staking_rewards",
          timeframe,
          currency,
          timeZone,
          blockchains,
        );
        break;
      case "refreshDataRequest":
        jobs = this.jobManager.retryOrRefresh(
          msg.requestId,
          wallet,
          "staking_rewards",
          timeframe,
          currency,
          timeZone,
          blockchains,
        );
        break;
      default:
        jobs = [];
    }

    return {
      type: "data",
      correspondingRequestId: msg.requestId,
      payload: jobs,
      timestamp: Date.now(),
    };
  }

  wsHandler = (socket: WebSocket) => {
    socket.on("message", async (rawMsg) => {
      logger.info("<WebSocketManager: received msg: " + rawMsg);
      try {
        const msg: WebSocketIncomingMessage = JSON.parse(rawMsg);
        const response = await this.handleIncomingMsg(socket, msg);
        logger.info(
          `WebSocketManager: sending msg. RequestId: ${response.correspondingRequestId}, type: ${response.type}, jobs: ${response.payload.length}`,
        );
        socket.send(JSON.stringify(response));
      } catch (error) {
        logger.error("WebSocketManager: error handling msg: " + rawMsg, error);
        socket.send(
          JSON.stringify({
            timestamp: Date.now(),
            payload: {
              error: new HttpError(400, "Error processing incoming msg"),
            },
          }),
        );
      }
    });

    socket.on("close", () => {
      logger.info("WebSocketManager close");
      this.connections = this.connections.filter((c) => c.socket !== socket);
    });
  };

  async startJobNotificationChannel() {
    this.jobsCache.jobUpdate$.subscribe((job) => {
      this.connections
        .filter((c) => c.wallet === job.wallet)
        .forEach((c) => {
          logger.info(
            `WebSocketManager: Sending job notification for ${c.wallet}`,
          );
          c.socket.send(
            JSON.stringify({
              correspondingRequestId: job.reqId,
              payload: [job],
              timestamp: Date.now(),
              type: "data",
            } as WebSocketOutgoingMessage),
          );
        });
    });
  }
}
