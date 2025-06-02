import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { JobManager } from "../job-management/job.manager";
import { JobsCache } from "../job-management/jobs.cache";
import { WebSocketIncomingMessageSchema } from "./incoming-message-schema";
import { WebSocketManager } from "./websocket.manager";

describe("WebSocketManager", () => {
  let jobManager: jest.Mocked<JobManager>;
  let jobsCache: jest.Mocked<JobsCache>;
  let wsManager: WebSocketManager;
  let socket: any;

  beforeEach(() => {
    // Mock JobManager with enqueue spy
    jobManager = {
      enqueue: jest.fn<any>(),
    } as unknown as jest.Mocked<JobManager>;

    // Mock JobsCache with fetchJobs and jobUpdate$
    jobsCache = {
      fetchJobs: jest.fn(),
      jobUpdate$: {
        subscribe: jest.fn(),
      },
    } as unknown as jest.Mocked<JobsCache>;

    wsManager = new WebSocketManager(jobManager, jobsCache);

    // Fake WebSocket with on/send mocks and simulate event listeners
    socket = {
      send: jest.fn(),
      on: jest.fn(),
    };
  });

  describe("subscriptionMachtes", () => {
    it("returns true for matching wallet and currency", () => {
      expect(
        wsManager["subscriptionMachtes"](
          { wallet: "a", currency: "b" },
          { wallet: "a", currency: "b" },
        ),
      ).toBe(true);
    });
    it("returns false for mismatched wallet or currency", () => {
      expect(
        wsManager["subscriptionMachtes"](
          { wallet: "a", currency: "b" },
          { wallet: "a", currency: "c" },
        ),
      ).toBe(false);
      expect(
        wsManager["subscriptionMachtes"](
          { wallet: "a", currency: "b" },
          { wallet: "x", currency: "b" },
        ),
      ).toBe(false);
    });
  });

  describe("handleFetchDataRequest", () => {
    it("adds connection if new and returns jobs payload", async () => {
      const msg = {
        type: "fetchDataRequest",
        reqId: "req1",
        payload: {
          wallet: "w1",
          syncFromDate: 123,
          currency: "USD",
          blockchains: ["chain1"],
        },
      };
      jobManager.enqueue.mockReturnValue([{ blockchain: "chain1" }] as any);

      const response = await wsManager["handleFetchDataRequest"](
        socket,
        msg as any,
      );

      expect(wsManager.connections).toHaveLength(1);
      expect(wsManager.connections[0].subscription).toEqual({
        wallet: "w1",
        currency: "USD",
      });
      expect(jobManager.enqueue).toHaveBeenCalledWith(
        "req1",
        "w1",
        "staking_rewards",
        "USD",
        ["chain1"],
        123,
      );
      expect(response).toEqual(
        expect.objectContaining({
          type: "data",
          reqId: "req1",
          payload: [{ blockchain: "chain1" }],
        }),
      );
    });

    it("does not add duplicate connections for same socket and subscription", async () => {
      const subscription = { wallet: "w1", currency: "USD" };
      wsManager.connections.push({ subscription, socket });

      const msg = {
        type: "fetchDataRequest",
        reqId: "req1",
        payload: {
          wallet: "w1",
          syncFromDate: 123,
          currency: "USD",
          blockchains: [],
        },
      };
      jobManager.enqueue.mockReturnValue([]);

      await wsManager["handleFetchDataRequest"](socket, msg as any);
      expect(wsManager.connections.length).toBe(1); // no duplicate added
    });
  });

  describe("handleUnsubscribeRequest", () => {
    it("removes matching connection and returns acknowledge", async () => {
      const subscription = { wallet: "w1", currency: "USD" };
      wsManager.connections.push({ subscription, socket });

      const msg = {
        type: "unsubscribeRequest",
        reqId: "req2",
        payload: { wallet: "w1", currency: "USD" },
      };

      const response = await wsManager["handleUnsubscribeRequest"](
        socket,
        msg as any,
      );

      expect(wsManager.connections).toHaveLength(0);
      expect(response).toEqual(
        expect.objectContaining({
          type: "acknowledgeUnsubscribe",
          reqId: "req2",
          payload: [],
        }),
      );
    });

    it("does not remove unrelated connections", async () => {
      wsManager.connections.push({
        subscription: { wallet: "w1", currency: "USD" },
        socket,
      });
      wsManager.connections.push({
        subscription: { wallet: "w2", currency: "EUR" },
        socket: {},
      });

      const msg = {
        type: "unsubscribeRequest",
        reqId: "req2",
        payload: { wallet: "w1", currency: "USD" },
      };

      await wsManager["handleUnsubscribeRequest"](socket, msg as any);

      expect(wsManager.connections).toHaveLength(1);
      expect(wsManager.connections[0].subscription).toEqual({
        wallet: "w2",
        currency: "EUR",
      });
    });
  });

  describe("throttle", () => {
    it("returns true if pending jobs exceed max", () => {
      for (let i = 0; i < 100; i++) {
        wsManager.connections.push({
          subscription: { wallet: "w1", currency: "USD" },
          socket,
        });
      }
      jobsCache.fetchJobs.mockReturnValue([
        { status: "pending", currency: "USD" },
        { status: "in_progress", currency: "USD" },
      ] as any);
      expect(wsManager["throttle"](socket)).toBe(true);
    });

    it("returns false if pending jobs below max", () => {
      wsManager.connections.push({
        subscription: { wallet: "w1", currency: "USD" },
        socket,
      });
      jobsCache.fetchJobs.mockReturnValue([
        { status: "done", currency: "USD" },
      ] as any);
      expect(wsManager["throttle"](socket)).toBe(false);
    });
  });

  describe("wsHandler", () => {
    it("sets up socket.on for message and close", () => {
      wsManager.wsHandler(socket);
      expect(socket.on).toHaveBeenCalledWith("message", expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("handles invalid JSON message by sending error", () => {
      wsManager.wsHandler(socket);
      const messageHandler = socket.on.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      messageHandler("invalid json");

      expect(socket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"'),
      );
    });

    it("handles malformed message by sending error", () => {
      wsManager.wsHandler(socket);
      const messageHandler = socket.on.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      const invalidMsg = JSON.stringify({ type: "unknown" });
      messageHandler(invalidMsg);

      expect(socket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"'),
      );
    });

    it("processes fetchDataRequest and sends response", async () => {
      wsManager.wsHandler(socket);
      const messageHandler = socket.on.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      const msg = {
        type: "fetchDataRequest",
        reqId: "req1",
        payload: {
          wallet: "w1",
          syncFromDate: 123,
          currency: "USD",
          blockchains: [],
        },
      };
      jobManager.enqueue.mockReturnValue([{ blockchain: "chain1" }] as any);
      // Mock throttle to false
      jest.spyOn(wsManager as any, "throttle").mockReturnValue(false);
      // Mock message schema success
      jest
        .spyOn(WebSocketIncomingMessageSchema, "safeParse")
        .mockReturnValue({ success: true, data: msg } as any);

      await messageHandler(JSON.stringify(msg));

      expect(socket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"data"'),
      );
    });

    it("rejects fetchDataRequest when throttled", async () => {
      wsManager.wsHandler(socket);
      const messageHandler = socket.on.mock.calls.find(
        (call) => call[0] === "message",
      )[1];

      const msg = {
        type: "fetchDataRequest",
        reqId: "req1",
        payload: {
          wallet: "w1",
          syncFromDate: 123,
          currency: "USD",
          blockchains: [],
        },
      };

      jest.spyOn(wsManager as any, "throttle").mockReturnValue(true);

      await messageHandler(JSON.stringify(msg));

      expect(socket.send).toHaveBeenCalledWith(
        expect.stringContaining('"code":429'),
      );
    });
  });

  describe("startJobNotificationChannel", () => {
    it("subscribes to jobUpdate$ and sends notifications", () => {
      const subCallback = jest.fn();
      jobsCache.jobUpdate$.subscribe = jest.fn<any>((cb) => {
        subCallback.mockImplementation(cb);
        return { unsubscribe: jest.fn() };
      });

      wsManager.connections.push({
        subscription: { wallet: "w1", currency: "USD" },
        socket,
      });

      wsManager.startJobNotificationChannel();

      // Simulate job notification
      subCallback({
        wallet: "w1",
        currency: "USD",
        reqId: "reqId",
      });

      expect(socket.send).toHaveBeenCalledWith(
        expect.stringContaining('"reqId":"reqId"'),
      );
    });
  });
});
