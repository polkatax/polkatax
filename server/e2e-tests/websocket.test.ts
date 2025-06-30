import { describe, test, beforeAll, afterAll, expect } from "@jest/globals";
import { FastifyInstance } from "fastify";
import { startStub as cryptoPricesStub } from "../src/crypto-currency-prices/stub";
import {
  waitForPortToBeFree,
  waitForPortToBeOccupied,
} from "./util/wait-for-port-to-be-free";
import { polkataxServer } from "../src/server/polkatax-server";
import { filter, firstValueFrom, ReplaySubject, Subject, take } from "rxjs";
import { WebSocketOutgoingMessage } from "../src/server/model/web-socket-msg";
import WebSocket from "ws";
import { fail } from "assert";

export class WebSocketWrapper {
  socket: WebSocket;
  connected$ = new ReplaySubject<boolean>(1);
  wsMsgReceived$ = new Subject<WebSocketOutgoingMessage>();
  connectionAttemps = 0;

  init() {
    this.connectionAttemps += 1;
    this.socket = new WebSocket("ws://127.0.0.1:3001/ws");

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.connected$.next(true);
    };

    this.socket.onmessage = (event) => {
      this.wsMsgReceived$.next(JSON.parse(event.data));
    };

    this.socket.onerror = async (err) => {
      if (this.connectionAttemps < 5) {
        console.warn(`❌ WebSocket error. Retry in 1 second...`);
        this.socket.close();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.init();
      } else {
        console.error(err);
        fail("Could not establich ws connection");
      }
    };
  }

  sendMsg(msg: any) {
    const reqId = crypto.randomUUID();
    this.connected$.pipe(take(1)).subscribe(() => {
      this.socket.send(
        JSON.stringify({
          ...msg,
          timestamp: Date.now(),
          reqId,
        }),
      );
    });
    return reqId;
  }

  async close() {
    await this.socket.close();
  }
}

let cryptoPriceServer: FastifyInstance;
let server: FastifyInstance;

beforeAll(async () => {
  await waitForPortToBeFree(3001);
  await waitForPortToBeFree(3003);
  /**
   * Crypto prices are NOT mocked.
   */
  cryptoPriceServer = await cryptoPricesStub();
  server = await polkataxServer.init();
  await waitForPortToBeOccupied(3003);
  await waitForPortToBeOccupied(3001);
});

afterAll(async () => {
  await cryptoPriceServer.close();
  await server.close();
});

describe("Staking rewards via websocket", () => {
  /**
   *  This test assumes there are some rewards for this user last year till now.
   *  Should this test fail, please verify.
   */
  test("Fetch staking rewards", async () => {
    const wsWrapper = new WebSocketWrapper();
    wsWrapper.init();
    wsWrapper.sendMsg({
      type: "fetchDataRequest",
      payload: {
        wallet: "Z5MiZYL4717LSJi99DY3Dzv2iqWwHzwr27qCf8ozrNq6xxL",
        blockchains: ["astar"],
        currency: "USD",
      },
    });
    const finishedJob = await firstValueFrom(
      wsWrapper.wsMsgReceived$.pipe(
        filter((response) =>
          response.payload.some((job) => job.status === "done"),
        ),
      ),
    );
    const rewards = finishedJob.payload[0].data.values;
    expect(rewards.length).toBeGreaterThan(0);
    await wsWrapper.close();
  }, 30_000);
});
