import dotenv from "dotenv";
import { envFile } from "../src/server/env.config";
dotenv.config({ path: envFile });

import { StakingRewardsResponse } from "../src/server/data-aggregation/model/staking-rewards.response";
import { StakingRewardsWithFiatService } from "../src/server/data-aggregation/services/staking-rewards-with-fiat.service";
import { createDIContainer } from "../src/server/di-container";

export const fetchStakingRewards = async (
  address: string,
  chainName: string,
  currency = "USD",
  startDate = Date.UTC(2024, 0, 1),
  endDate = Date.UTC(2025, 0, 1),
) => {
  const container = createDIContainer();
  const stakingRewardsWithFiatService: StakingRewardsWithFiatService =
    container.resolve("stakingRewardsWithFiatService");
  const response: StakingRewardsResponse =
    await stakingRewardsWithFiatService.fetchStakingRewards({
      chain: { domain: chainName, label: "", token: "" },
      address,
      currency,
      startDate,
    });
  response.values = response.values.filter(
    (v) => v.timestamp >= startDate && v.timestamp <= endDate,
  );
  return response;
};
