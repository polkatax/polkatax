import { JobResult } from '../model/job-result';
import { RewardsDto } from '../model/rewards';

export const filterOnDateRange = (job: JobResult, rewardsDto: RewardsDto): void => {
  const minDate = new Date(
    job.timeframe, // first day at 00:00 of the year
    0,
    1,
    0,
    0,
    0,
    0
  ).getTime() / 1000;
  const maxDate = new Date(
    job.timeframe, // last day at 23:59:59 of the year
    11,
    31,
    23,
    59,
    59,
    999
  ).getTime() / 1000;
  rewardsDto.values = rewardsDto.values.filter(v => v.timestamp >= minDate && v.timestamp <= maxDate)
}