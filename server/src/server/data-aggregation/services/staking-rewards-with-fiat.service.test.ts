import { expect, it, jest, describe, beforeEach } from "@jest/globals";

import { StakingRewardsService } from "../../blockchain/substrate/services/staking-rewards.service";
import { TokenPriceConversionService } from "../services/token-price-conversion.service";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { StakingRewardsRequest } from "../model/staking-rewards.request";
import { StakingReward } from "../../blockchain/substrate/model/staking-reward";
import * as findIdHelper from "../helper/find-coingecko-id-for-native-token";
import * as addFiatHelper from "../helper/add-fiat-values-to-staking-rewards";
import { formatDate } from "../../../common/util/date-utils";
import { StakingRewardsWithFiatService } from "./staking-rewards-with-fiat.service";

describe("StakingRewardsWithFiatService", () => {
  let stakingRewardsService: StakingRewardsService;
  let tokenPriceConversionService: TokenPriceConversionService;
  let subscanService: SubscanService;
  let service: StakingRewardsWithFiatService;

  const mockChain = { domain: "polkadot", token: "DOT" };
  const mockDate = new Date("2023-01-01");

  beforeEach(() => {
    stakingRewardsService = {
      fetchStakingRewards: jest.fn<any>(),
    } as any;

    tokenPriceConversionService = {
      fetchQuotesForTokens: jest.fn<any>(),
    } as any;

    subscanService = {
      mapToSubstrateAccount: jest.fn<any>(),
    } as any;

    service = new StakingRewardsWithFiatService(
      stakingRewardsService,
      tokenPriceConversionService,
      subscanService,
    );

    jest
      .spyOn(findIdHelper, "findCoingeckoIdForNativeToken")
      .mockReturnValue("polkadot");
  });

  it("fetches substrate rewards and adds fiat values", async () => {
    const rewards: StakingReward[] = [{ era: 1, amount: 1000 }] as any;
    const quotes = {
      polkadot: {
        quotes: {
          latest: 5,
        },
      },
    };

    (
      stakingRewardsService.fetchStakingRewards as jest.Mock<any>
    ).mockResolvedValue(rewards);
    (
      tokenPriceConversionService.fetchQuotesForTokens as jest.Mock<any>
    ).mockResolvedValue(quotes);

    const addFiatSpy = jest
      .spyOn(addFiatHelper, "addFiatValuesToStakingRewards")
      .mockReturnValue([{ era: 1, amount: 1000, fiatValue: 5000 }] as any);

    const request: StakingRewardsRequest = {
      chain: mockChain,
      address: "0xSubstrateAddr",
      currency: "USD",
      startDay: mockDate,
    } as any;

    const result = await service.fetchStakingRewards(request);

    expect(stakingRewardsService.fetchStakingRewards).toHaveBeenCalled();
    expect(
      tokenPriceConversionService.fetchQuotesForTokens,
    ).toHaveBeenCalledWith(["polkadot"], "USD");
    expect(addFiatSpy).toHaveBeenCalledWith(rewards, quotes.polkadot);
    expect(result).toEqual({
      values: [{ era: 1, amount: 1000, fiatValue: 5000 }],
      token: "DOT",
    });
  });

  it("maps EVM address to substrate before calling service", async () => {
    (subscanService.mapToSubstrateAccount as jest.Mock<any>).mockResolvedValue(
      "substrateAddr",
    );
    (
      stakingRewardsService.fetchStakingRewards as jest.Mock<any>
    ).mockResolvedValue([]);
    (
      tokenPriceConversionService.fetchQuotesForTokens as jest.Mock<any>
    ).mockResolvedValue({
      polkadot: { quotes: { latest: 5 } },
    });

    jest
      .spyOn(addFiatHelper, "addFiatValuesToStakingRewards")
      .mockReturnValue([] as any);

    const request: StakingRewardsRequest = {
      chain: mockChain,
      address: "0x5050F69a9786F081509234F1a7F4684b5E5b76C9",
      currency: "USD",
      startDay: mockDate,
    } as any;

    await service.fetchStakingRewards(request);

    expect(subscanService.mapToSubstrateAccount).toHaveBeenCalledWith(
      "polkadot",
      "0x5050F69a9786F081509234F1a7F4684b5E5b76C9",
    );
    expect(stakingRewardsService.fetchStakingRewards).toHaveBeenCalledWith(
      "polkadot",
      "substrateAddr",
      mockDate.getTime(),
      undefined,
    );
  });

  it("uses endDay price if available", async () => {
    const endDay = new Date("2023-01-01");
    const formattedEndDay = formatDate(endDay);

    const rewards = [{ era: 2, amount: 20 }] as any;
    const quotes = {
      polkadot: {
        quotes: {
          latest: 7,
          [formattedEndDay]: 6.5,
        },
      },
    };

    (
      stakingRewardsService.fetchStakingRewards as jest.Mock<any>
    ).mockResolvedValue(rewards);
    (
      tokenPriceConversionService.fetchQuotesForTokens as jest.Mock<any>
    ).mockResolvedValue(quotes);
    jest
      .spyOn(addFiatHelper, "addFiatValuesToStakingRewards")
      .mockReturnValue([{ era: 2, amount: 20, fiatValue: 130 }] as any);

    const request: StakingRewardsRequest = {
      chain: mockChain,
      address: "0x5050F69a9786F081509234F1a7F4684b5E5b76C9",
      currency: "USD",
      startDay: mockDate,
      endDay,
    } as any;

    const result = await service.fetchStakingRewards(request);
    expect(result.priceEndDay).toBe(6.5);
  });
});
