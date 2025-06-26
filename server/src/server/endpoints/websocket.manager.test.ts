import { expect, test, jest, describe, beforeEach } from "@jest/globals";
import { JobManager } from "../job-management/job.manager";
import { JobRepository } from "../job-management/job.repository";
import { JobId } from "../../model/job";
import { WebSocketManager } from "./websocket.manager";

const mockSend = jest.fn();
const mockSocket = { send: mockSend, on: jest.fn<any>() } as any;

const mockJobManager = {
  enqueue: jest.fn<any>(),
};

const mockJobRepository = {
  jobChanged$: { subscribe: jest.fn<any>() },
  findJob: jest.fn<any>(),
};

describe("WebSocketManager", () => {
  let manager: WebSocketManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new WebSocketManager(
      mockJobManager as unknown as JobManager,
      mockJobRepository as unknown as JobRepository,
    );
  });

  test("subscribes socket on fetchDataRequest", async () => {
    mockJobManager.enqueue.mockResolvedValue([{ job: "test" }]);
    const msg = {
      type: "fetchDataRequest",
      reqId: "abc",
      payload: { wallet: "w1", currency: "USD", blockchains: [] },
    };

    const response = await manager["handleFetchDataRequest"](
      mockSocket,
      msg as any,
    );
    expect(response.type).toBe("data");
    expect(manager["connections"]).toContainEqual({
      subscription: { wallet: "w1", currency: "USD" },
      socket: mockSocket,
    });
  });

  test("unsubscribes socket on unsubscribeRequest", async () => {
    manager["connections"] = [
      {
        subscription: { wallet: "w1", currency: "USD" },
        socket: mockSocket,
      },
    ];

    const msg = {
      type: "unsubscribeRequest",
      reqId: "xyz",
      payload: { wallet: "w1", currency: "USD" },
    };

    const response = await manager["handleUnsubscribeRequest"](
      mockSocket,
      msg as any,
    );
    expect(response.type).toBe("acknowledgeUnsubscribe");
    expect(manager["connections"].length).toBe(0);
  });

  test("throttles after 4 wallets", () => {
    manager["connections"] = Array.from({ length: 4 }, (_, i) => ({
      socket: mockSocket,
      subscription: { wallet: `w${i}`, currency: "USD" },
    }));

    const result = manager["isThrottled"](mockSocket, {
      type: "fetchDataRequest",
      reqId: "1",
      payload: { wallet: "w5", currency: "USD" },
    });

    expect(result).toBe(true);
  });

  test("does not throttle if wallet already subscribed", () => {
    manager["connections"] = [
      {
        socket: mockSocket,
        subscription: { wallet: "w1", currency: "USD" },
      },
    ];

    const result = manager["isThrottled"](mockSocket, {
      type: "fetchDataRequest",
      reqId: "1",
      payload: { wallet: "w1", currency: "USD" },
    });

    expect(result).toBe(false);
  });

  test("sends job notification to subscribed client", async () => {
    const job: any = { reqId: "r123" };
    const jobId: JobId = { wallet: "w1", currency: "USD", blockchain: "dot" };
    manager["connections"] = [
      {
        socket: mockSocket,
        subscription: { wallet: "w1", currency: "USD" },
      },
    ];

    mockJobRepository.jobChanged$.subscribe = jest.fn((cb: any) => {
      cb(jobId);
    });
    mockJobRepository.findJob.mockResolvedValue(job);

    await manager.startJobNotificationChannel();

    expect(mockSend).toHaveBeenCalled();
    const sent = JSON.parse(mockSend.mock.calls[0][0] as any);
    expect(sent.type).toBe("data");
    expect(sent.reqId).toBe("r123");
  });
});
