/* eslint-disable quotes */
import { defineStore } from 'pinia';
import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  from,
  map,
  mergeMap,
  ReplaySubject,
  shareReplay,
  take,
} from 'rxjs';
import { fetchCurrency } from '../service/fetch-currency';
import {
  createOrUpdateJobInIndexedDB,
  fetchAllJobsFromIndexedDB,
} from '../service/job.repository';
import { wsError$, wsMsgReceived$, wsSendMsg } from '../service/ws-connection';
import { JobResult } from '../model/job-result';
import { Rewards, RewardsDto } from '../model/rewards';
import { addIsoDate } from '../helper/add-iso-date';
import { calculateRewardSummary } from '../helper/calculate-reward-summary';
import { getEndDate, getStartDate } from '../util/date-utils';
import { groupRewardsByDay } from '../helper/group-rewards-by-day';
import { filterOnDateRange } from '../helper/filter-on-date-range';
import { fetchSubscanChains } from '../service/fetch-subscan-chains';

const sortRewards = (rewards: Rewards) =>
  rewards.values.sort((a, b) => a.block - b.block);

const sortJobs = (jobs: JobResult[]) => {
  return jobs.sort((a, b) => {
    if (a.wallet > b.wallet) {
      return 1;
    } else if (a.wallet < b.wallet) {
      return -1;
    }
    return -a.timeframe + b.timeframe;
  });
};

const mapRawValues = (job: JobResult, rewardsDto: RewardsDto): Rewards => {
  const valuesWithIsoDate = addIsoDate(rewardsDto.values);
  const result = {
    values: valuesWithIsoDate,
    summary: calculateRewardSummary(valuesWithIsoDate),
    currentPrice: rewardsDto.currentPrice,
    timeFrame: job.timeframe,
    startDate: getStartDate(job.timeframe),
    endDate:
      getEndDate(job.timeframe) < job.timestamp
        ? getEndDate(job.timeframe)
        : job.timestamp,
    chain: job.blockchain,
    token: rewardsDto.token,
    currency: job.currency,
    address: job.wallet,
    dailyValues: groupRewardsByDay(valuesWithIsoDate),
  };
  sortRewards(result);
  return result;
};

const jobs$ = new BehaviorSubject<JobResult[]>([]);

fetchAllJobsFromIndexedDB().then((jobs) => {
  const storedJobs = jobs.filter((job) => job.type === 'staking_rewards');
  if (storedJobs.length > 1) {
    storedJobs
      .filter((s) => s.status === 'pending' || s.status === 'in_progress')
      .forEach((s) => {
        wsSendMsg({
          type: 'fetchDataRequest',
          payload: {
            currency: s.currency,
            wallet: s.wallet,
            timeframe: s.timeframe,
            blockchains: [s.blockchain],
          },
        });
      });
  }
  jobs$.next(sortJobs(storedJobs));
});

wsMsgReceived$.pipe(filter(msg => !msg.error), map(msg => msg.payload), mergeMap((array) => from(array))).subscribe(async (job) => {
  const jobs = await firstValueFrom(jobs$);
  const matching = jobs.find(
    (j) =>
      j.wallet === job.wallet &&
      j.blockchain === job.blockchain &&
      j.timeframe === job.timeframe &&
      j.currency === job.currency
  );
  if (job.data) {
    filterOnDateRange(job, job.data);
    job.data = mapRawValues(job, job.data);
  }
  if (matching) {
    matching.data = job.data;
    matching.status = job.status;
    matching.error = job.error;
    await createOrUpdateJobInIndexedDB(matching);
  } else {
    jobs.push(job);
    await createOrUpdateJobInIndexedDB(job);
  }
  jobs$.next([...sortJobs(jobs)]);
});

const webSocketResponseError$ = wsMsgReceived$.pipe(filter(msg => !!msg.error), map(msg => msg.error!))

const currency$ = new ReplaySubject<string>(1);
from(fetchCurrency())
  .pipe(take(1))
  .subscribe((currency) => currency$.next(currency));

const webSocketConnectionError$ = wsError$.pipe(map(() => ({ code: 503, msg: "Connection error" })))

const substrateChains$ = from(fetchSubscanChains()).pipe(shareReplay())

export const useSharedStore = defineStore('shared', {
  state: () => {
    return {
      currency$: currency$.asObservable(),
      webSocketConnectionError$,
      webSocketResponseError$,
      substrateChains$,
      jobs$: jobs$.asObservable(),
      timeFrame: new Date().getFullYear() - 1,
      address: '',
    };
  },
  actions: {
    selectCurrency(newCurrency: string) {
      currency$.next(newCurrency);
    },
    async sync() {
      wsSendMsg({
        type: 'fetchDataRequest',
        payload: {
          wallet: this.address.trim(),
          currency: await firstValueFrom(
            useSharedStore().currency$.pipe(filter((c) => c !== undefined))
          ),
          timeframe: this.timeFrame,
        },
      });
    },
  },
});
