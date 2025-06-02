import { JobManager } from "../job-management/job.manager";
import * as WebSocket from "ws";
import { JobsCache } from "../job-management/jobs.cache";
import { WebSocketOutgoingMessage } from "../model/web-socket-msg";
import { logger } from "../logger/logger";
import { WsError } from "../model/ws-error";
import {
  WebSocketIncomingMessage,
  WebSocketIncomingMessageSchema,
} from "./incoming-message-schema";

interface Subscription {
  wallet: string;
  currency: string;
}

export class WebSocketManager {
  connections: { subscription: Subscription; socket: WebSocket }[] = [];

  constructor(
    private jobManager: JobManager,
    private jobsCache: JobsCache,
  ) {}

  private subscriptionMachtes(s1: Subscription, s2: Subscription) {
    return s1.wallet === s2.wallet && s1.currency === s2.currency;
  }

  private async handleFetchDataRequest(
    socket: WebSocket,
    msg: WebSocketIncomingMessage,
  ): Promise<WebSocketOutgoingMessage> {
    const { wallet, syncFromDate, currency, blockchains } = msg.payload;
    const subscription = { wallet, currency };

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
      msg.reqId,
      wallet,
      "staking_rewards",
      currency,
      blockchains,
      syncFromDate,
    );

    return {
      type: "data",
      reqId: msg.reqId,
      payload: jobs,
      timestamp: Date.now(),
    };
  }

  private async handleUnsubscribeRequest(
    socket: WebSocket,
    msg: WebSocketIncomingMessage,
  ): Promise<WebSocketOutgoingMessage> {
    const { wallet, currency } = msg.payload;
    const subscription = { wallet, currency };
    this.connections = this.connections.filter(
      (c) =>
        c.socket !== socket ||
        !this.subscriptionMachtes(c.subscription, subscription),
    );
    return {
      type: "acknowledgeUnsubscribe",
      reqId: msg.reqId,
      payload: [],
      timestamp: Date.now(),
    };
  }

  async handleIncomingMsg(
    socket: WebSocket,
    msg: WebSocketIncomingMessage,
  ): Promise<WebSocketOutgoingMessage> {
    switch (msg.type) {
      case "fetchDataRequest":
        return this.handleFetchDataRequest(socket, msg);
      case "unsubscribeRequest":
        return this.handleUnsubscribeRequest(socket, msg);
    }
  }

  private sendError(socket: WebSocket, error: WsError) {
    socket.send(
      JSON.stringify({
        type: "error",
        timestamp: Date.now(),
        error,
      }),
    );
  }

  private throttle(socket: WebSocket): boolean {
    const MAX_PENDING_JOBS = 50;
    const subscriptions = this.connections
      .filter((c) => c.socket === socket)
      .map((c) => c.subscription);
    const pendingJobs = subscriptions.reduce<number>(
      (prev: number, s: Subscription) => {
        return (
          prev +
          this.jobsCache
            .fetchJobs(s.wallet)
            .filter(
              (j) =>
                (j.status === "pending" || j.status === "in_progress") &&
                j.currency === s.currency,
            ).length
        );
      },
      0,
    );
    return pendingJobs >= MAX_PENDING_JOBS;
  }

  wsHandler = (socket: WebSocket) => {
    socket.on("message", async (rawMsg) => {
      logger.info("WebSocketManager: received msg: " + rawMsg);
      let msg: WebSocketIncomingMessage;
      try {
        msg = JSON.parse(rawMsg);
      } catch (error) {
        logger.info(
          "WebSocketManager: client sent invalid json: " + rawMsg,
          error,
        );
        return this.sendError(socket, {
          code: 400,
          msg: "Error processing incoming msg",
        });
      }

      if (msg.type === "fetchDataRequest" && this.throttle(socket)) {
        logger.info(
          "WebSocketManager: Too many pending request for client. Last message " +
            rawMsg,
        );
        return this.sendError(socket, { code: 429, msg: "Too many requests" });
      }

      const result = WebSocketIncomingMessageSchema.safeParse(msg);
      if (!result.success) {
        logger.info(
          "WebSocketManager: Client sent mal-formatted message: " + rawMsg,
        );
        return this.sendError(socket, { code: 400, msg: "Invalid message" });
      }

      try {
        const response = await this.handleIncomingMsg(socket, msg);
        logger.info(
          `WebSocketManager: sending msg. RequestId: ${response.reqId}, type: ${response.type}, payload.length: ${response.payload.length}`,
        );
        socket.send(JSON.stringify(response));
      } catch (error) {
        logger.error("WebSocketManager: error handling msg: " + rawMsg, error);
        return this.sendError(socket, {
          code: 500,
          msg: "Error processing incoming msg",
        });
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
            currency: job.currency,
          }),
        )
        .forEach((c) => {
          logger.info(
            `WebSocketManager: Sending job notification for ${JSON.stringify(c.subscription)}`,
          );
          c.socket.send(
            JSON.stringify({
              reqId: job.reqId,
              payload: [job],
              timestamp: Date.now(),
              type: "data",
            } as WebSocketOutgoingMessage),
          );
        });
    });
  }
}
