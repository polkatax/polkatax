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
import { SubscanEvent } from "../../src/server/blockchain/substrate/model/subscan-event";
import { RawSubstrateTransferDto } from "../../src/server/blockchain/substrate/model/raw-transfer";
import { createPaginatedMockResponseHandler } from "./util/create-paginated-mock-response-handler";
import { createMockResponseHandler } from "./util/create-mock-response-handler";

describe("fetch staking rewards via the events API", () => {
  let fastiyInstances: FastifyInstance[] = [];
  let server: SetupServerApi;

  const evmAddress = "0x58F17ebFe6B126E9f196e7a87f74e9f026a27A1F";
  const substrateAddress = "2Ad1UGzT8yuaksiKy98TpDf794dEELvNFqenJjRHFvwfuU83";
  const mapToSubstrateAccountMock = createMockResponseHandler(
    "https://*.api.subscan.io/api/v2/scan/search",
    {
      data: {
        info: { account: { substrate_account: { address: substrateAddress } } },
      },
    },
  );

  const timeStamp = 1672531200000;
  const defaultHandlers = [
    ...createBlockHandlers(timeStamp),
    metaDataHandler,
    ...passThroughHandlers,
    scanTokenHandler,
  ];

  beforeEach(async () => {
    process.env["SUBSCAN_API_KEY"] = "bla";
    fastiyInstances.push(
      ...[
        await polkataxServer.init(),
        await startPricesStub(),
        await startFiatStub(),
      ],
    );
  });

  test("simple example with only 1 reward", async () => {
    const mockEvents: SubscanEvent[] = [
      {
        id: 1,
        block_timestamp: timeStamp / 1000,
        event_index: "45",
        extrinsic_index: "bla-7",
        module_id: "staking",
        phase: 1,
        event_id: "reward",
        extrinsic_hash: "0x_reward_hash",
        finalized: true,
      },
    ];
    const eventsMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/events",
      [
        {
          data: { events: mockEvents },
        },
      ],
    );

    const mockTransfers: Partial<RawSubstrateTransferDto>[] = [
      {
        from: "0xbla",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000,
        amount: "450",
        hash: "0x_reward_hash",
        extrinsic_index: "1000-6",
      },
      {
        from: "0xfoo",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000,
        amount: "100",
        hash: "0x_other_hash", // this tranfer is filtered because the hash does not match any extrinsic_hash of the events
        extrinsic_index: "1001-4",
      },
    ];

    const transfersMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/transfers",
      [
        {
          data: { list: mockTransfers as any },
        },
      ],
    );

    server = setupServer(
      ...defaultHandlers,
      transfersMock,
      eventsMock,
      mapToSubstrateAccountMock,
    );
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/mythos/${evmAddress}?startdate=${timeStamp}&enddate=${timeStamp}&currency=EUR`,
    );
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      values: [
        {
          block: 1000,
          timestamp: 1672531200,
          amount: 450,
          hash: "0x_reward_hash",
          price: 10,
          fiatValue: 4500,
        },
      ],
      currentPrice: 20,
      priceEndDay: 10,
      token: "MYTH",
    });
  });

  test("filter by date", async () => {
    const mockEvents: SubscanEvent[] = [
      {
        id: 2,
        block_timestamp: timeStamp / 1000,
        event_index: "45",
        extrinsic_index: "bla-7",
        module_id: "staking",
        phase: 1,
        event_id: "reward",
        extrinsic_hash: "0x_reward_hash2",
        finalized: true,
      },
      {
        id: 1,
        block_timestamp: timeStamp / 1000,
        event_index: "30",
        extrinsic_index: "bla-7",
        module_id: "staking",
        phase: 1,
        event_id: "reward",
        extrinsic_hash: "0x_reward_hash1",
        finalized: true,
      },
    ];

    const eventsMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/events",
      [
        {
          data: { events: mockEvents },
        },
      ],
    );

    const mockTransfers: Partial<RawSubstrateTransferDto>[] = [
      {
        from: "0xbla",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000,
        amount: "450",
        hash: "0x_reward_hash1",
        extrinsic_index: "1000-6",
      },
      {
        from: "0xfoo",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000 - 5000, // transfer is before start date and should be filtered
        amount: "100",
        hash: "0x_reward_hash2",
        extrinsic_index: "1001-4",
      },
    ];

    const transfersMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/transfers",
      [{ data: { list: mockTransfers } }],
    );

    server = setupServer(
      ...defaultHandlers,
      transfersMock,
      eventsMock,
      mapToSubstrateAccountMock,
    );
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/mythos/${evmAddress}?startdate=${timeStamp}&enddate=${timeStamp}&currency=EUR`,
    );
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      values: [
        {
          block: 1000,
          timestamp: 1672531200,
          amount: 450,
          hash: "0x_reward_hash1",
          price: 10,
          fiatValue: 4500,
        },
      ],
      currentPrice: 20,
      priceEndDay: 10,
      token: "MYTH",
    });
  });

  test("example with no rewards", async () => {
    const eventsMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/events",
      [{ data: { events: [] } }],
    );

    const mockTransfers: Partial<RawSubstrateTransferDto>[] = [
      {
        from: "0xbla",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000,
        amount: "450",
        hash: "0x_some_hash",
        extrinsic_index: "1000-6",
      },
      {
        from: "0xfoo",
        to: substrateAddress,
        block_timestamp: timeStamp / 1000,
        amount: "100",
        hash: "0x_other_hash",
        extrinsic_index: "1001-4",
      },
    ];

    const transfersMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/transfers",
      [{ data: { list: mockTransfers } }],
    );

    server = setupServer(
      ...defaultHandlers,
      transfersMock,
      eventsMock,
      mapToSubstrateAccountMock,
    );
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/mythos/${evmAddress}?startdate=${timeStamp}&enddate=${timeStamp}&currency=EUR`,
    );
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      values: [],
      currentPrice: 20,
      priceEndDay: 10,
      token: "MYTH",
    });
  });

  test("example with 180 rewards", async () => {
    const createEvents = (counter, offset) => {
      return Array.from({ length: counter }, (_, i) => {
        return {
          id: i,
          block_timestamp: timeStamp / 1000,
          event_index: "45",
          extrinsic_index: "bla-7",
          module_id: "staking",
          phase: 1,
          event_id: "reward",
          extrinsic_hash: "0x" + i + offset,
          finalized: true,
        };
      });
    };
    const eventsMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/events",
      [
        {
          data: { events: createEvents(100, 0) },
        },
        {
          data: { events: createEvents(80, 100) },
        },
      ],
    );

    const createTransfers = (counter, offset) => {
      return Array.from({ length: counter }, (_, i) => {
        return {
          from: "0xbla",
          to: substrateAddress,
          block_timestamp: timeStamp / 1000,
          amount: "450",
          hash: "0x" + i + offset,
          extrinsic_index: "1000-6",
        };
      });
    };
    const transfersMock = createPaginatedMockResponseHandler(
      "https://mythos.api.subscan.io/api/v2/scan/transfers",
      [
        {
          data: { list: createTransfers(100, 0) },
        },
        {
          data: { list: createTransfers(100, 100) }, // there are 200 transfers but only 180 matching events.
        },
      ],
    );

    server = setupServer(
      ...defaultHandlers,
      transfersMock,
      eventsMock,
      mapToSubstrateAccountMock,
    );
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/mythos/${evmAddress}?startdate=${timeStamp}&enddate=${timeStamp}&currency=EUR`,
    );
    const responseBody = await response.json();
    expect(responseBody.values.length).toBe(180);
  });

  afterEach(async () => {
    if (server) {
      server.resetHandlers();
      server.close();
    }
    for (let fastiyInstance of fastiyInstances) {
      await fastiyInstance.close();
    }
  });
});
