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

describe("staking rewards via reward_slash endpoint", () => {
  let fastiyInstances: FastifyInstance[] = [];
  let server: SetupServerApi;

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
    const mockStakingRewards = [
      {
        event_id: "Reward",
        amount: "1230000000000",
        block_timestamp: timeStamp / 1000,
        extrinsic_index: "999-6",
        extrinsic_hash: "0xa",
      },
    ];

    const rewardsAndSlashMock = createPaginatedMockResponseHandler(
      "https://polkadot.api.subscan.io/api/scan/account/reward_slash",
      [
        {
          data: { list: mockStakingRewards as any },
        },
      ],
    );

    server = setupServer(...defaultHandlers, rewardsAndSlashMock);
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/polkadot/2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83?startdate=${timeStamp}&enddate=${timeStamp}&currency=USD`,
    );
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      values: [
        {
          block: "999",
          timestamp: 1672531200,
          amount: 123,
          hash: "0xa",
          price: 10,
          fiatValue: 1230,
        },
      ],
      currentPrice: 20,
      priceEndDay: 10,
      token: "DOT",
    });
  });

  test("example with multiple rewards and a slashing", async () => {
    const timeStamp = 1672531200000;

    const mockStakingRewards = [
      {
        event_id: "Reward",
        amount: "1000000000000",
        block_timestamp: timeStamp / 1000,
        extrinsic_index: "999-6",
        extrinsic_hash: "0xa",
      },
      {
        event_id: "Reward",
        amount: "2000000000000",
        block_timestamp: timeStamp / 1000 + 60_000_00, // shoud be removed due to timestamp
        extrinsic_index: "997-6",
        extrinsic_hash: "0xb",
      },
      {
        event_id: "Reward",
        amount: "2000000000000",
        block_timestamp: timeStamp / 1000,
        extrinsic_index: "997-6",
        extrinsic_hash: "0xb",
      },
      {
        event_id: "Slash",
        amount: "3000000000000",
        block_timestamp: timeStamp / 1000,
        extrinsic_index: "998-6",
        extrinsic_hash: "0xc",
      },
    ];

    const rewardsAndSlashMock = createPaginatedMockResponseHandler(
      "https://polkadot.api.subscan.io/api/scan/account/reward_slash",
      [
        {
          data: { list: mockStakingRewards as any },
        },
      ],
    );

    server = setupServer(...defaultHandlers, rewardsAndSlashMock);
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/polkadot/2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83?startdate=${timeStamp}&enddate=${timeStamp}&currency=USD`,
    );
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      values: [
        {
          block: "999",
          timestamp: 1672531200,
          amount: 100,
          hash: "0xa",
          price: 10,
          fiatValue: 1000,
        },
        {
          block: "997",
          timestamp: 1672531200,
          amount: 200,
          hash: "0xb",
          price: 10,
          fiatValue: 2000,
        },
        {
          block: "998",
          timestamp: 1672531200,
          amount: -300,
          hash: "0xc",
          price: 10,
          fiatValue: -3000,
        },
      ],
      currentPrice: 20,
      priceEndDay: 10,
      token: "DOT",
    });
  });

  test("example with more than 100 rewards", async () => {
    const timeStamp = 1672531200000;

    const createRewards = (counter) => {
      return Array.from({ length: counter }, (_, i) => {
        return {
          event_id: "Reward",
          amount: "1000000000000",
          block_timestamp: timeStamp / 1000,
          extrinsic_index: "999-6",
          extrinsic_hash: String(i),
        };
      });
    };

    const rewardsAndSlashMock = createPaginatedMockResponseHandler(
      "https://polkadot.api.subscan.io/api/scan/account/reward_slash",
      [
        { data: { list: createRewards(100) } },
        { data: { list: createRewards(70) } },
      ],
    );

    server = setupServer(...defaultHandlers, rewardsAndSlashMock);
    await server.listen();
    const response = await fetch(
      `http://127.0.0.1:3001/api/staking-rewards/polkadot/2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83?startdate=${timeStamp}&enddate=${timeStamp}&currency=USD`,
    );
    const responseBody = await response.json();
    expect(responseBody.values.length).toBe(170);
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
