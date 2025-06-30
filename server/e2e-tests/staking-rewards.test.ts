import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { FastifyInstance } from "fastify";
import { startStub as cryptoPricesStub } from "../src/crypto-currency-prices/stub";
import { fetchStakingRewards } from "./util/fetch-staking-rewars";
import { waitForPortToBeFree } from "./util/wait-for-port-to-be-free";

let cryptoPriceServer: FastifyInstance;

beforeAll(async () => {
  /**
   * Crypto prices are mocked.
   */
  cryptoPriceServer = await cryptoPricesStub();
});

afterAll(async () => {
  cryptoPriceServer = await cryptoPriceServer.close();
  await waitForPortToBeFree(3003);
});

describe("Staking rewards amounts", () => {
  test("kusama", async () => {
    const { totalAmount } = await fetchStakingRewards(
      "5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7",
      "kusama",
    );
    expect(totalAmount).toBe(48.988706091223946);
  }, 30_000);

  test("mythos", async () => {
    const { totalAmount } = await fetchStakingRewards(
      "0x56F17ebFe6B126E9f196e7a87f74e9f026a27A1F",
      "mythos",
      "USD",
      Date.UTC(2025, 0, 1),
      Date.UTC(2025, 5, 1),
    );
    expect(totalAmount).toBe(19186.24877880681);
  }, 30_000);

  test("peaq", async () => {
    const { totalAmount } = await fetchStakingRewards(
      "5CH5GH5za1HJ5rFRTd3bE6iRRefUKLR9EB3rhakyYC9ew7N1",
      "peaq",
      "USD",
      Date.UTC(2025, 0, 1),
      Date.UTC(2025, 5, 1),
    );
    expect(totalAmount).toBe(1548293.1475236798);
  }, 30_000);

  test("creditcoin", async () => {
    const { rewards } = await fetchStakingRewards(
      "5D7qiJYBd77Jzp6bWzi92iboELedLTMURWrPXFi25BAwsHdT",
      "creditcoin",
      "USD",
      Date.UTC(2024, 0, 1),
      Date.UTC(2025, 5, 1),
    );
    const slashes = rewards.values.filter((v) => v.amount < 0);
    expect(slashes.length).toBe(4);
    const total = rewards.values.reduce((current, value) => {
      return current + value.amount;
    }, 0);
    expect(total).toBe(16088.424456785922);
  }, 30_000);
});
