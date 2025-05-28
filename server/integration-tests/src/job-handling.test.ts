import { describe, test, beforeEach, afterEach, expect } from "@jest/globals";
import { polkataxServer } from "../../src/server/polkatax-server";
import { setupServer, SetupServerApi } from "msw/node";
import { startStub as startPricesStub } from "../../src/crypto-currency-prices/stub";
import { startStub as startFiatStub } from "../../src/fiat-exchange-rates/stub";
import { FastifyInstance } from "fastify";
import { passThroughHandlers } from "./util/pass-through-handlers";
import { metaDataHandler } from "./util/metadata-handler";
import { createBlockHandlers } from "./util/create-block-handlers";
import { scanTokenHandler } from "./util/scan-token-handler";
import { createPaginatedMockResponseHandler } from "./util/create-paginated-mock-response-handler";
import {
  sendAndWaitForMessages,
  waitForMessages,
} from "./util/send-and-wait-for-messages";
import { openWebSocket } from "./util/open-websocket";
import WebSocket from "ws";
import { http, HttpResponse } from "msw";

describe("Proper handling of jobs", () => {
  let fastiyInstances: FastifyInstance[] = [];
  let server: SetupServerApi;
  let webSocket: WebSocket;

  let year: number;
  const createDefaultHandlers = (year = 2024, timeZone = "Europe/Zurich") => {
    return [
      ...createBlockHandlers(year, timeZone),
      metaDataHandler,
      ...passThroughHandlers,
      scanTokenHandler,
    ];
  };

  const mockStakingRewards = [
    {
      event_id: "Reward",
      amount: "1230000000000",
      block_timestamp: new Date(`${year}-04-04 00:00:00`).getTime() / 1000,
      extrinsic_index: "999-6",
      extrinsic_hash: "0xa",
    },
  ];

  const rewardsAndSlashMock = createPaginatedMockResponseHandler(
    "https://*.api.subscan.io/api/scan/account/reward_slash",
    [
      {
        data: { list: mockStakingRewards as any },
      },
    ],
  );

  beforeEach(async () => {
    year = 2024;
    process.env["SUBSCAN_API_KEY"] = "bla";
    fastiyInstances.push(
      ...[
        await polkataxServer.init(),
        await startPricesStub(),
        await startFiatStub(),
      ],
    );
  });

  test("request data from two chains", async () => {
    server = setupServer(...createDefaultHandlers(), rewardsAndSlashMock);
    await server.listen();
    webSocket = await openWebSocket();

    const incomingMessages = await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "xyz",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot", "kusama"],
        },
      },
      5,
    );

    const msgForBothChains = incomingMessages.find(
      (m) => m.payload.length === 2,
    );
    const blockChains = msgForBothChains.payload.map((data) => data.blockchain);
    expect(blockChains).toEqual(["polkadot", "kusama"]);

    const kusamaMessages = incomingMessages.filter(
      (m) => m.payload.length === 1 && m.payload[0].blockchain === "kusama",
    );
    expect(kusamaMessages.length).toBe(2);
    expect(kusamaMessages[0].payload[0].status).toBe("in_progress");
    expect(kusamaMessages[1].payload[0].status).toBe("done");

    const polkadotMessages = incomingMessages.filter(
      (m) => m.payload.length === 1 && m.payload[0].blockchain === "polkadot",
    );
    expect(polkadotMessages.length).toBe(2);
    expect(polkadotMessages[0].payload[0].status).toBe("in_progress");
    expect(polkadotMessages[1].payload[0].status).toBe("done");
  });

  test("should cache jobs", async () => {
    server = setupServer(...createDefaultHandlers(), rewardsAndSlashMock);
    await server.listen();
    webSocket = await openWebSocket();

    const incomingMsg = await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "xyz",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot"],
        },
      },
      3,
    );
    expect(incomingMsg.length).toBe(3);

    const incomingMsg2 = await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "xyz",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot"],
        },
      },
      1,
    );
    expect(incomingMsg2.length).toBe(1);
    expect(incomingMsg2[0].payload[0].status).toBe("done");
  });

  test("handle errors", async () => {
    const errorMock = http.post(
      "https://*.api.subscan.io/api/scan/metadata",
      () => {
        // Similate a network error.
        return HttpResponse.error();
      },
    );
    server = setupServer(
      ...[
        ...createBlockHandlers(year, "Europe/Zurich"),
        ...passThroughHandlers,
        scanTokenHandler,
      ],
      errorMock,
    );

    await server.listen();
    webSocket = await openWebSocket();

    const incomingMsg = await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "xyz",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot"],
        },
      },
      3,
    );
    expect(incomingMsg.length).toBe(3);
    expect(incomingMsg[2].payload[0].status).toBe("error");
    expect(incomingMsg[2].payload[0].error.code).toBe(500);
  });

  test("retry failed jobs", async () => {
    const errorMock = http.post(
      "https://*.api.subscan.io/api/scan/metadata",
      () => {
        // Similate a network error.
        return HttpResponse.error();
      },
    );
    server = setupServer(
      ...[
        ...createBlockHandlers(year, "Europe/Zurich"),
        ...passThroughHandlers,
        scanTokenHandler,
      ],
      errorMock,
    );

    await server.listen();
    webSocket = await openWebSocket();

    await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "xyz",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot"],
        },
      },
      3,
    );

    const msgOnRetry = await sendAndWaitForMessages(
      webSocket,
      {
        type: "fetchDataRequest",
        requestId: "abc",
        timestamp: 0,
        payload: {
          wallet: "2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83",
          timeframe: year,
          currency: "USD",
          timeZone: "Europe/Zurich",
          blockchains: ["polkadot"],
        },
      },
      2,
    );
    expect(msgOnRetry[1].payload[0].status).toBe("in_progress");
  });

  afterEach(async () => {
    if (webSocket) {
      webSocket.close();
      await new Promise((resolve) => webSocket.on("close", resolve));
    }
    if (server) {
      server.resetHandlers();
      server.close();
    }
    for (let fastiyInstance of fastiyInstances) {
      await fastiyInstance.close();
    }
  });
});
