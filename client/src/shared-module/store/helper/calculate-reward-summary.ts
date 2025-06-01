import { Reward, RewardSummary } from '../../model/rewards';
import { getBeginningAndEndOfYear } from '../../util/date-utils';

export const calculateRewardSummary = (rewards: Reward[]): RewardSummary => {
  const currentYear = new Date().getFullYear();
  const resultsPerYear = [];
  for (const year of [currentYear, currentYear - 1]) {
    const { beginning, end } = getBeginningAndEndOfYear(year);
    const temp = rewards.filter(
      (r) => r.timestamp >= beginning && r.timestamp <= end
    );
    resultsPerYear.push({
      year,
      ...temp.reduce<{ amount: number; fiatValue?: number }>(
        (acc, reward) => {
          return {
            amount: acc.amount + reward.amount,
            fiatValue:
              acc.fiatValue === undefined || reward.fiatValue === undefined
                ? undefined
                : acc.fiatValue + reward.fiatValue,
          };
        },
        { amount: 0, fiatValue: 0 }
      ),
    });
  }
  return {
    amount: resultsPerYear.reduce((prev, curr) => prev + curr.amount, 0),
    fiatValue: resultsPerYear.reduce<number | undefined>(
      (prev, curr) =>
        curr.fiatValue !== undefined && prev !== undefined
          ? prev + curr.fiatValue
          : undefined,
      0
    ),
    perYear: resultsPerYear,
  };
};
