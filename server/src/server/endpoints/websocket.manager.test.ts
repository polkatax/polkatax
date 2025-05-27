import { expect, it, describe, beforeEach, jest } from "@jest/globals";
import { WebSocketManager } from "./websocket.manager";

jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("WebSocketManager", () => {
  let mockSocket: any;
  let jobManager: any;
  let jobsCache: any;
  let wsManager: WebSocketManager;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      send: jest.fn(),
    };

    jobManager = {
      enqueue: jest.fn().mockReturnValue([{ id: 1, wallet: "wallet1" }]),
      retryOrRefresh: jest.fn().mockReturnValue([{ id: 2, wallet: "wallet1" }]),
    };

    jobsCache = {
      jobUpdate$: {
        subscribe: jest.fn(),
      },
    };

    wsManager = new WebSocketManager(jobManager, jobsCache);
  });

  it("should register new connection and handle fetchDataRequest", async () => {
    const msg = {
      type: "fetchDataRequest",
      requestId: "req1",
      payload: {
        wallet: "wallet1",
        timeframe: 2024,
        currency: "USD",
        timeZone: "UTC",
        blockchains: ["polkadot"],
      },
    } as any;

    const response = await wsManager.handleIncomingMsg(mockSocket, msg);
    expect(jobManager.enqueue).toHaveBeenCalled();
    expect(response.type).toBe("data");
    expect(response.payload.length).toBe(1);
    expect(wsManager.connections).toContainEqual({
      wallet: "wallet1",
      socket: mockSocket,
    });
  });

  it("should reuse connection for same socket and wallet", async () => {
    const msg = {
      type: "fetchDataRequest",
      requestId: "req2",
      payload: {
        wallet: "wallet1",
        timeframe: 2024,
        currency: "USD",
        timeZone: "UTC",
        blockchains: ["kusama"],
      },
    } as any;

    await wsManager.handleIncomingMsg(mockSocket, msg);
    await wsManager.handleIncomingMsg(mockSocket, msg); // simulate second call
    expect(wsManager.connections.length).toBe(1); // still one connection
  });

  it("should handle refreshDataRequest", async () => {
    const msg = {
      type: "refreshDataRequest",
      requestId: "req3",
      payload: {
        wallet: "wallet2",
        timeframe: 2024,
        currency: "EUR",
        timeZone: "UTC",
        blockchains: ["polkadot"],
      },
    } as any;

    const response = await wsManager.handleIncomingMsg(mockSocket, msg);
    expect(jobManager.retryOrRefresh).toHaveBeenCalled();
    expect(response.type).toBe("data");
    expect(response.payload.length).toBe(1);
  });

  it("should handle WebSocket message and send response", async () => {
    const validMessage = JSON.stringify({
      type: "fetchDataRequest",
      requestId: "req4",
      payload: {
        wallet: "wallet3",
        timeframe: 2025,
        currency: "BTC",
        timeZone: "UTC",
        blockchains: ["chainX"],
      },
    });

    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === "message") handler(validMessage);
    });

    await wsManager.wsHandler(mockSocket);
    expect(mockSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"data"'),
    );
  });

  it("should handle invalid JSON messages with error", async () => {
    const invalidMessage = "{ invalid json";

    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === "message") handler(invalidMessage);
    });
    mockSocket.send = jest.fn();

    await wsManager.wsHandler(mockSocket);

    const msg = mockSocket.send.mock.calls[0];
    const msgAsObj = JSON.parse(msg);
    expect(msgAsObj.payload.error.statusCode).toBe(400);
  });

  it("should remove connection on close", () => {
    wsManager.connections = [{ wallet: "wallet1", socket: mockSocket }];

    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === "close") handler();
    });

    wsManager.wsHandler(mockSocket);
    expect(wsManager.connections.length).toBe(0);
  });

  it("should notify matching sockets on job update", () => {
    const sendMock = jest.fn();
    const fakeSocket = { send: sendMock };
    const job = { wallet: "wallet1", reqId: "job123" };

    wsManager.connections = [
      { wallet: "wallet1", socket: fakeSocket },
      { wallet: "wallet2", socket: { send: jest.fn() } },
    ];

    const jobUpdate$ = {
      subscribe: (callback: Function) => callback(job),
    };

    wsManager = new WebSocketManager(jobManager, { ...jobsCache, jobUpdate$ });
    wsManager.connections = [{ wallet: "wallet1", socket: fakeSocket }];

    wsManager.startJobNotificationChannel();

    expect(sendMock).toHaveBeenCalledWith(
      expect.stringContaining('"correspondingRequestId":"job123"'),
    );
  });
});
