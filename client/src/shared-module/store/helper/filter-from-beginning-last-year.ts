import { RewardsDto } from '../../model/rewards';
import { getBeginningAndEndOfYear } from '../../util/date-utils';

export const filterFromBeginningLastYear = (rewardsDto: RewardsDto): void => {
  const { beginning } = getBeginningAndEndOfYear(new Date().getFullYear() - 1);
  rewardsDto.values = rewardsDto.values.filter((v) => v.timestamp >= beginning);
};
