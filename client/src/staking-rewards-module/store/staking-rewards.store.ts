import { defineStore } from 'pinia';
import {
  BehaviorSubject,
  firstValueFrom,
  from,
  ReplaySubject,
  map,
  mergeMap,
  filter,
} from 'rxjs';
import { Chain } from '../../shared-module/model/chain';
import {
  DataRequest,
} from '../../shared-module/model/data-request';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { Rewards, RewardsDto } from '../model/rewards';
import { addIsoDateAndCurrentValue } from './util/add-iso-date-and-current-value';
import { calculateRewardSummary } from './util/calculate-reward-summary';
import { groupRewardsByDay } from './util/group-rewards-by-day';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';
import { useSharedStore } from '../../shared-module/store/shared.store';
import {
  wsMsgReceived$,
  wsSendMsg,
} from '../../shared-module/service/ws-connection';
import { Job } from '../../shared-module/model/job';
import { createOrUpdateJobInIndexedDB, fetchAllJobsFromIndexedDB } from '../../shared-module/service/job.repository';

const chainList$ = from(fetchSubscanChains()).pipe(
  map((chainList) => ({
    chains: chainList.chains.filter((c) => c.stakingPallets.length > 0),
  }))
);
const chain$: BehaviorSubject<Chain> = new BehaviorSubject<Chain>({
  domain: 'polkadot',
  label: 'Polkadot',
  token: 'DOT',
});
const rewards$ = new ReplaySubject<DataRequest<Rewards>>(1);
const sortRewards = (rewards: Rewards) =>
  rewards.values.sort((a, b) => a.block - b.block);
const jobs$ = new BehaviorSubject<any[]>([]);

const mapRawValues = (job: Job, rewardsDto: RewardsDto): Rewards => {
  const valuesWithIsoDate = addIsoDateAndCurrentValue(
    rewardsDto.values,
    rewardsDto.currentPrice
  );
  const result = {
    values: valuesWithIsoDate,
    summary: calculateRewardSummary(valuesWithIsoDate),
    currentPrice: rewardsDto.currentPrice,
    timeFrame: job.timeframe,
    startDate: getStartDate(job.timeframe),
    endDate: getEndDate(job.timeframe) < job.timestamp ? getEndDate(job.timeframe) : job.timestamp,
    chain: job.blockchain,
    token: rewardsDto.token,
    currency: job.currency,
    address: job.wallet,
    dailyValues: groupRewardsByDay(valuesWithIsoDate),
  };
  sortRewards(result)
  return result
}

const storedJobs = fetchAllJobsFromIndexedDB().then(jobs => {
  const storedJobs = jobs.filter(job => job.type === 'staking_rewards')
  if (storedJobs.length > 1) {
    storedJobs.filter(s => s.status === 'pending' || s.status === 'in_progress').forEach(s => {
      wsSendMsg({ wallet: s.wallet, timeframe: s.timeframe, timeZone: s.timeZone, blockchains: [s.blockchain] })
    })
  }
  jobs$.next(storedJobs)
});

wsMsgReceived$.pipe(mergeMap(array => from(array)), filter(job => job.type === 'staking_rewards')).subscribe(async (job) => {
  const jobs = await firstValueFrom(jobs$);
  if (!job.timeframe) {
    debugger
  }
  const matching = jobs.find((j) => (
    j.wallet === job.wallet &&
    j.blockchain === job.blockchain &&
    j.timeframe === job.timeframe
  ))
  if (matching) {
      matching.value = job.value ? mapRawValues(job, job.value) : job.value;
      matching.status = job.status;
      matching.error = job.error;
  } else {
    job.value = job.value ? mapRawValues(job, job.value) : job.value
    jobs.push(job)
  }
  await createOrUpdateJobInIndexedDB(job)
  jobs$.next([...jobs]);
});

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards$: rewards$.asObservable(),
      address: '',
      timeFrame: new Date().getFullYear() - 1,
      chainList$,
      chain$: chain$.asObservable(),
      jobs$: jobs$.asObservable(),
    };
  },
  actions: {
    selectChain(newChain: Chain) {
      chain$.next(newChain);
    },
    async sync() {
      wsSendMsg({
        wallet: this.address.trim(),
        currency: await firstValueFrom(useSharedStore().currency$),
        timeframe: this.timeFrame,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  },
});
