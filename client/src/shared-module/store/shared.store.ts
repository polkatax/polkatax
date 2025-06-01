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
  removeJobFromIndexedDB,
} from '../service/job.repository';
import { wsMsgReceived$, wsSendMsg } from '../service/ws-connection';
import { JobResult } from '../model/job-result';
import { Reward, Rewards } from '../model/rewards';
import { addIsoDate } from '../helper/add-iso-date';
import { groupRewardsByDay } from '../helper/group-rewards-by-day';
import { fetchSubscanChains } from '../service/fetch-subscan-chains';
import { filterFromBeginningLastYear } from '../helper/filter-from-beginning-last-year';
import { calculateRewardSummary } from '../helper/calculate-reward-summary';

const sortRewards = (rewards: Rewards) =>
  rewards.values.sort((a, b) => a.block - b.block);

const sortJobs = (jobs: JobResult[]) => {
  return jobs.sort((a, b) => {
    if (a.wallet > b.wallet) {
      return 1;
    }
    return a.wallet < b.wallet ? -1 : 1;
  });
};

const mapRawValuesToRewards = (
  job: JobResult,
  tokenSymbol: string,
  rewards: Reward[]
): Rewards => {
  const result = {
    values: rewards,
    summary: calculateRewardSummary(rewards),
    chain: job.blockchain,
    token: tokenSymbol,
    currency: job.currency,
    address: job.wallet,
    dailyValues: groupRewardsByDay(rewards),
  };
  sortRewards(result);
  return result;
};

const jobs$ = new BehaviorSubject<JobResult[]>([]);

fetchAllJobsFromIndexedDB().then((jobs) => {
  const storedJobs = jobs.filter((job) => job.type === 'staking_rewards');
  if (storedJobs.length > 1) {
    storedJobs.forEach((s) => {
      wsSendMsg({
        type: 'fetchDataRequest',
        payload: {
          currency: s.currency,
          wallet: s.wallet,
          blockchains: [s.blockchain],
          syncFromDate: s.status === 'done' ? s.syncedUntil : undefined,
        },
      });
    });
  }
  jobs$.next(sortJobs(storedJobs));
});

wsMsgReceived$
  .pipe(
    filter((msg) => msg.type === 'data'),
    map((msg) => msg.payload),
    mergeMap((array) => from(array))
  )
  .subscribe(async (job) => {
    const jobs = await firstValueFrom(jobs$);
    const matching = jobs.find(
      (j) =>
        j.wallet === job.wallet &&
        j.blockchain === job.blockchain &&
        j.currency === job.currency
    );
    if (matching) {
      if (job.status === 'done' && job.data) {
        const newValues = (job.data.values ?? []).filter(
          (v) => v.timestamp >= job.syncFromDate!
        );
        const olderValues = (matching.data?.values ?? []).filter(
          (v) => v.timestamp < job.syncFromDate!
        );
        job.data.values = addIsoDate(newValues).concat(olderValues);
        filterFromBeginningLastYear(job.data);
        matching.data = mapRawValuesToRewards(
          matching,
          job.data.token,
          job.data.values
        );
        matching.syncedUntil = job.syncedUntil;
      }
      matching.lastModified = job.lastModified;
      matching.status = job.status;
      matching.error = job.error;
      await createOrUpdateJobInIndexedDB(matching);
    } else {
      if (job.data) {
        filterFromBeginningLastYear(job.data);
        job.data = mapRawValuesToRewards(
          job,
          job.data.token,
          addIsoDate(job.data.values)
        );
      }
      jobs.push(job);
      await createOrUpdateJobInIndexedDB(job);
    }
    jobs$.next([...sortJobs(jobs)]);
  });

const webSocketResponseError$ = wsMsgReceived$.pipe(
  filter((msg) => !!msg.error),
  map((msg) => msg.error!)
);

const currency$ = new ReplaySubject<string>(1);
from(fetchCurrency())
  .pipe(take(1))
  .subscribe((currency) => currency$.next(currency));

const substrateChains$ = from(fetchSubscanChains()).pipe(shareReplay());

export const useSharedStore = defineStore('shared', {
  state: () => {
    return {
      currency$: currency$.asObservable(),
      webSocketResponseError$,
      substrateChains$,
      jobs$: jobs$.asObservable(),
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
        },
      });
    },
    async removeWallet(job: JobResult) {
      const reqId = wsSendMsg({
        type: 'unsubscribeRequest',
        payload: {
          wallet: job.wallet,
          currency: job.currency,
        },
      });
      await firstValueFrom(
        wsMsgReceived$.pipe(
          filter(
            (m) => m.type === 'acknowledgeUnsubscribe' && m.reqId === reqId
          )
        )
      );
      const toDelete = (await firstValueFrom(this.jobs$)).filter(
        (j) => j.wallet === job.wallet && job.currency === j.currency
      );
      await Promise.all(toDelete.map((j) => removeJobFromIndexedDB(j)));
      jobs$.next(await fetchAllJobsFromIndexedDB());
    },
  },
});
