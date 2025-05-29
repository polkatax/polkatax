import { formatDate } from '../util/date-utils';
import { Reward, RewardDto } from '../model/rewards';

export const addIsoDate = (values: RewardDto[]): Reward[] => {
  return values.map((v) => ({
    ...v,
    isoDate: formatDate(v.timestamp * 1000),
  }));
};
