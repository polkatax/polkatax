import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { StakingRewardsResponse } from "../src/server/data-aggregation/model/staking-rewards.response";
import { fetchStakingRewards } from "./fetch-staking-rewars";
import { logger } from "../src/server/logger/logger";
import { FastifyInstance } from "fastify";
import { startStub as cryptoPricesStub } from "../src/crypto-currency-prices/stub";

import net from "net";

async function waitForPortToBeFree(port: number, retries = 10, interval = 100) {
  for (let i = 0; i < retries; i++) {
    const isFree = await new Promise((resolve) => {
      const tester = net
        .createServer()
        .once("error", () => resolve(false))
        .once("listening", () => {
          tester.close();
          resolve(true);
        })
        .listen(port);
    });

    if (isFree) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Port ${port} is still in use after waiting`);
}

const verify = async (
  address: string,
  chain: string,
  expectedRewardsAmount,
  startDate = Date.UTC(2024, 0, 1),
  endDate = Date.UTC(2025, 0, 1),
) => {
  const rewards: StakingRewardsResponse = await fetchStakingRewards(
    address,
    chain,
    "USD",
    startDate,
    endDate,
  );
  const total = rewards.values.reduce((current, value) => {
    return current + value.amount;
  }, 0);
  await expect(total).toBe(expectedRewardsAmount);
};

let cryptoPriceServer: FastifyInstance;

beforeAll(async () => {
  cryptoPriceServer = await cryptoPricesStub();
});

afterAll(async () => {
  cryptoPriceServer = await cryptoPriceServer.close();
  await waitForPortToBeFree(3003);
});

describe("Staking rewards amounts", () => {
  test("kusama", () => {
    verify(
      "5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7",
      "kusama",
      48.988706091223946,
    );
  }, 30_000);

  test("mythos", () => {
    verify(
      "0x56F17ebFe6B126E9f196e7a87f74e9f026a27A1F",
      "mythos",
      23942.09502102308,
      Date.UTC(2025, 0, 1),
      Date.UTC(2025, 6, 1),
    );
  }, 30_000);

  test("peaq", async () => {
    console.log("peaq");
    await verify(
      "5CH5GH5za1HJ5rFRTd3bE6iRRefUKLR9EB3rhakyYC9ew7N1",
      "peaq",
      1813964.9872180407,
      Date.UTC(2025, 0, 1),
      Date.UTC(2025, 6, 1),
    );
    logger.info("done peaq");
  }, 30_000);

  test("astar", async () => {
    await verify(
      "Z5MiZYL4717LSJi99DY3Dzv2iqWwHzwr27qCf8ozrNq6xxL",
      "astar",
      19282.742288529327,
      Date.UTC(2024, 0, 1),
      Date.UTC(2025, 0, 1),
    );
  }, 30_000);

  test("creditcoin", async () => {
    const rewards: StakingRewardsResponse = await fetchStakingRewards(
      "5D7qiJYBd77Jzp6bWzi92iboELedLTMURWrPXFi25BAwsHdT",
      "creditcoin",
      "USD",
      Date.UTC(2024, 0, 1),
      Date.UTC(2025, 6, 1),
    );
    const slashes = rewards.values.filter((v) => v.amount < 0);
    expect(slashes.length).toBe(4);
    const total = rewards.values.reduce((current, value) => {
      return current + value.amount;
    }, 0);
    expect(total).toBe(16088.424456785922);
  }, 30_000);
});
