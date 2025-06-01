import { Rewards, StakingRewardsPerYear } from '../model/rewards';
import { getBeginningAndEndOfYear } from './get-beginning-and-end-of-year';

export const extractStakingRewardsPerYear = (
  rewards: Rewards | undefined,
  year: number
): StakingRewardsPerYear | undefined => {
  if (!rewards) {
    return undefined;
  }
  const beginningOfYearFormatted = `${year}-01-01`;
  const endOfYearFormatted = `${year}-12-31`;
  const { beginning, end } = getBeginningAndEndOfYear(year);
  return {
    ...rewards,
    year,
    dailyValues: Object.fromEntries(
      Object.entries(rewards.dailyValues).filter(
        ([key]) => key >= beginningOfYearFormatted && key <= endOfYearFormatted
      )
    ),
    values: rewards.values.filter(
      (v) => v.timestamp >= beginning && v.timestamp <= end
    ),
    summary: rewards.summary.perYear.find((y) => y.year === year)!,
  };
};
