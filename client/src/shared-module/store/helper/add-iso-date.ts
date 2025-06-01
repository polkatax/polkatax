import { Reward, RewardDto } from '../../model/rewards';
import { formatDate } from '../../util/date-utils';

export const addIsoDate = (values: RewardDto[]): Reward[] => {
  return values.map((v) => ({
    ...v,
    isoDate: formatDate(v.timestamp),
  }));
};
