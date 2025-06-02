import { expect, it, jest, describe, beforeEach } from "@jest/globals";
import { StakingRewardsWithFiatService } from "./staking-rewards-with-fiat.service";
import { StakingRewardsService } from "../../blockchain/substrate/services/staking-rewards.service";
import { TokenPriceConversionService } from "./token-price-conversion.service";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { StakingRewardsRequest } from "../model/staking-rewards.request";
import { StakingReward } from "../../blockchain/substrate/model/staking-reward";
import * as helper from "../helper/add-fiat-values-to-staking-rewards";
import * as tokenHelper from "../helper/find-coingecko-id-for-native-token";
import * as evmHelper from "../helper/is-evm-address";

jest.mock("../helper/add-fiat-values-to-staking-rewards", () => ({
  addFiatValuesToStakingRewards: jest.fn(),
}));

describe("StakingRewardsWithFiatService", () => {
  let service: StakingRewardsWithFiatService;
  let stakingRewardsService: jest.Mocked<StakingRewardsService>;
  let tokenPriceConversionService: jest.Mocked<TokenPriceConversionService>;
  let subscanService: jest.Mocked<SubscanService>;

  const mockRequest: StakingRewardsRequest = {
    chain: { domain: "polkadot", token: "DOT" } as any,
    address: "0xabc123",
    currency: "USD",
    startDate: new Date().getTime(),
  };

  const fakeRewards: StakingReward[] = [
    { amount: 10, timestamp: 1234567890, currency: "DOT" } as any,
  ];

  beforeEach(() => {
    stakingRewardsService = {
      fetchStakingRewards: jest.fn(),
    } as any;

    tokenPriceConversionService = {
      fetchQuotesForTokens: jest.fn(),
    } as any;

    subscanService = {
      mapToSubstrateAccount: jest.fn(),
    } as any;

    service = new StakingRewardsWithFiatService(
      stakingRewardsService,
      tokenPriceConversionService,
      subscanService,
    );

    jest
      .spyOn(tokenHelper, "findCoingeckoIdForNativeToken")
      .mockReturnValue("polkadot");
    jest.spyOn(evmHelper, "isEvmAddress").mockReturnValue(false);
  });

  describe("fetchRawStakingRewards", () => {
    it("fetches rewards directly if not EVM", async () => {
      stakingRewardsService.fetchStakingRewards.mockResolvedValue(fakeRewards);

      const result = await (service as any).fetchRawStakingRewards(mockRequest);

      expect(stakingRewardsService.fetchStakingRewards).toHaveBeenCalledWith(
        "polkadot",
        "0xabc123",
        mockRequest.startDate,
      );
      expect(result).toEqual(fakeRewards);
    });

    it("maps EVM address using Subscan and fetches rewards", async () => {
      jest.spyOn(evmHelper, "isEvmAddress").mockReturnValue(true);
      subscanService.mapToSubstrateAccount.mockResolvedValue(
        "substrateAddr123",
      );
      stakingRewardsService.fetchStakingRewards.mockResolvedValue(fakeRewards);

      const result = await (service as any).fetchRawStakingRewards(mockRequest);

      expect(subscanService.mapToSubstrateAccount).toHaveBeenCalledWith(
        "polkadot",
        "0xabc123",
      );
      expect(stakingRewardsService.fetchStakingRewards).toHaveBeenCalledWith(
        "polkadot",
        "substrateAddr123",
        mockRequest.startDate,
      );
      expect(result).toEqual(fakeRewards);
    });

    it("falls back to original address if Subscan mapping fails", async () => {
      jest.spyOn(evmHelper, "isEvmAddress").mockReturnValue(true);
      subscanService.mapToSubstrateAccount.mockResolvedValue(null);
      stakingRewardsService.fetchStakingRewards.mockResolvedValue(fakeRewards);

      const result = await (service as any).fetchRawStakingRewards(mockRequest);

      expect(stakingRewardsService.fetchStakingRewards).toHaveBeenCalledWith(
        "polkadot",
        "0xabc123",
        mockRequest.startDate,
      );
    });
  });

  describe("fetchStakingRewards", () => {
    it("returns converted staking rewards with fiat values", async () => {
      stakingRewardsService.fetchStakingRewards.mockResolvedValue(fakeRewards);
      tokenPriceConversionService.fetchQuotesForTokens.mockResolvedValue({
        polkadot: { USD: 5 },
      } as any);
      (helper.addFiatValuesToStakingRewards as jest.Mock).mockReturnValue([
        { amount: 10, fiat: 50 },
      ]);

      const result = await service.fetchStakingRewards(mockRequest);

      expect(
        tokenPriceConversionService.fetchQuotesForTokens,
      ).toHaveBeenCalledWith(["polkadot"], "USD");
      expect(result).toEqual({
        token: "DOT",
        values: [{ amount: 10, fiat: 50 }],
      });
    });

    it("skips fiat conversion if no coingecko ID found", async () => {
      (tokenHelper.findCoingeckoIdForNativeToken as jest.Mock).mockReturnValue(
        undefined,
      );
      stakingRewardsService.fetchStakingRewards.mockResolvedValue(fakeRewards);
      (helper.addFiatValuesToStakingRewards as jest.Mock).mockReturnValue([
        { amount: 10, fiat: 0 },
      ]);

      const result = await service.fetchStakingRewards(mockRequest);

      expect(
        tokenPriceConversionService.fetchQuotesForTokens,
      ).not.toHaveBeenCalled();
      expect(result.values).toEqual([{ amount: 10, fiat: 0 }]);
    });
  });
});
