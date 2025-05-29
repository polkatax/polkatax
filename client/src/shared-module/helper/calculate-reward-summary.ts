import { Reward, RewardSummary } from '../model/rewards';

export const calculateRewardSummary = (rewards: Reward[]): RewardSummary => {
  return rewards.reduce<RewardSummary>(
    (acc, reward) => {
      return {
        amount: acc.amount + reward.amount,
        fiatValue:
          acc.fiatValue === undefined || reward.fiatValue === undefined
            ? undefined
            : acc.fiatValue + reward.fiatValue,
        valueNow:
          acc.valueNow === undefined || reward.valueNow === undefined
            ? undefined
            : acc.valueNow + reward.valueNow,
      };
    },
    { amount: 0, fiatValue: 0, valueNow: 0 }
  );
};
