import { JobManager } from "../job-management/job.manager";
import * as WebSocket from "ws";
import { JobsCache } from "../job-management/jobs.cache";
import {
  WebSocketIncomingMessage,
  WebSocketOutgoingMessage,
} from "../model/web-socket-msg";
import { logger } from "../logger/logger";
import { HttpError } from "../../common/error/HttpError";

interface Subscription {
  wallet: string;
  currency: string;
  timeframe: number;
}

export class WebSocketManager {
  connections: { subscription: Subscription; socket: WebSocket }[] = [];

  constructor(
    private jobManager: JobManager,
    private jobsCache: JobsCache,
  ) {}

  private subscriptionMachtes(s1: Subscription, s2: Subscription) {
    return (
      s1.wallet === s2.wallet &&
      s1.currency === s2.currency &&
      s1.timeframe === s2.timeframe
    );
  }

  async handleIncomingMsg(
    socket: WebSocket,
    msg: WebSocketIncomingMessage,
  ): Promise<WebSocketOutgoingMessage> {
    const { wallet, timeframe, currency, timeZone, blockchains } = msg.payload;

    const subscription = { wallet, currency, timeframe };
    if (
      !this.connections.some(
        (c) =>
          c.socket === socket &&
          this.subscriptionMachtes(c.subscription, subscription),
      )
    ) {
      this.connections.push({ subscription, socket });
    }

    const jobs = this.jobManager.enqueue(
      msg.requestId,
      wallet,
      "staking_rewards",
      timeframe,
      currency,
      timeZone,
      blockchains,
    );

    return {
      type: "data",
      correspondingRequestId: msg.requestId,
      payload: jobs,
      timestamp: Date.now(),
    };
  }

  wsHandler = (socket: WebSocket) => {
    socket.on("message", async (rawMsg) => {
      logger.info("WebSocketManager: received msg: " + rawMsg);
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
        .filter((c) =>
          this.subscriptionMachtes(c.subscription, {
            wallet: job.wallet,
            timeframe: job.timeframe,
            currency: job.currency,
          }),
        )
        .forEach((c) => {
          logger.info(
            `WebSocketManager: Sending job notification for ${JSON.stringify(c.subscription)}`,
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
