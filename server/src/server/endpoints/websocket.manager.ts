import { JobManager } from "../job-management/job.manager";
import * as WebSocket from "ws";
import { JobsCache } from "../job-management/jobs.cache";

export class WebSocketManager {
  constructor(
    private jobManager: JobManager,
    private jobsCache: JobsCache,
  ) {}

  connections: { wallet: string; socket: WebSocket }[] = [];

  wsHandler = (socket: WebSocket) => {
    socket.on("message", async (msg) => {
      const msgObj = JSON.parse(msg);
      this.connections.push({ wallet: msgObj.wallet, socket });
      const jobs = this.jobManager.enqueue(
        msgObj.wallet,
        "staking_rewards",
        msgObj.timeframe,
        msgObj.currency,
        msgObj.timeZone,
        msgObj.blockchains
      );
      socket.send(JSON.stringify(jobs));
    });

    socket.on("close", () => {
      this.connections = this.connections.filter((c) => c.socket !== socket);
    });
  };

  async startJobNotificationChannel() {
    this.jobsCache.jobUpdate$.subscribe((j) => {
      this.connections
        .filter((c) => c.wallet === j.wallet)
        .forEach((c) => {
          c.socket.send(JSON.stringify([j]));
        });
    });
  }
}
