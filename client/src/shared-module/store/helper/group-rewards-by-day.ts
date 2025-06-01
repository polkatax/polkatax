import { Reward } from '../../model/rewards';

export function groupRewardsByDay(rewards: Reward[]) {
  return rewards.reduce<{
    [key: string]: {
      amount: number;
      fiatValue: number | undefined;
      valueNow: number | undefined;
    };
  }>((groupedByDay, reward) => {
    if (!groupedByDay[reward.isoDate!]) {
      groupedByDay[reward.isoDate!] = {
        amount: 0,
        fiatValue: 0,
        valueNow: 0,
      };
    }
    const todayValue = groupedByDay[reward.isoDate!];
    groupedByDay[reward.isoDate!].amount += reward.amount;
    groupedByDay[reward.isoDate!].fiatValue =
      todayValue.fiatValue !== undefined && reward.fiatValue !== undefined
        ? todayValue.fiatValue + reward.fiatValue
        : undefined;
    groupedByDay[reward.isoDate!].valueNow =
      todayValue.valueNow !== undefined && reward.valueNow !== undefined
        ? todayValue.valueNow + reward.valueNow
        : undefined;
    return groupedByDay;
  }, {});
}
