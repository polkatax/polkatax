import { defineStore } from 'pinia';
import {
  combineLatest,
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
  fetchAllJobsFromIndexedDB,
  removeJobFromIndexedDB,
} from '../service/job.repository';
import { wsMsgReceived$, wsSendMsg } from '../service/ws-connection';
import { JobResult } from '../model/job-result';
import { fetchSubscanChains } from '../service/fetch-subscan-chains';
import { updateJobList } from './helper/update-job-list';
import { sortJobs } from './helper/job.service';

const jobs$ = new ReplaySubject<JobResult[]>(1);

const subscanChains$ = from(fetchSubscanChains()).pipe(shareReplay());

combineLatest([subscanChains$, from(fetchAllJobsFromIndexedDB())])
  .pipe(take(1))
  .subscribe(async ([chains, jobs]) => {
    let storedJobs = jobs.filter((job) => job.type === 'staking_rewards');
    if (storedJobs.length > 1) {
      storedJobs
        .filter((j) => chains.chains.find((c) => c.domain === j.blockchain))
        .forEach((s) => {
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
      const toDelete = storedJobs.filter(
        (j) =>
          j.status === 'error' &&
          !chains.chains.find((c) => c.domain === j.blockchain)
      );
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((j) => removeJobFromIndexedDB(j)));
        storedJobs = (await fetchAllJobsFromIndexedDB()).filter(
          (job) => job.type === 'staking_rewards'
        );
      }
    }
    jobs$.next(sortJobs(storedJobs));
  });

wsMsgReceived$
  .pipe(
    filter((msg) => msg.type === 'data'),
    map((msg) => msg.payload),
    mergeMap((array) => from(array))
  )
  .subscribe(async (newJobResult) => {
    const jobs = await firstValueFrom(jobs$);
    const updatedJobList = await updateJobList(newJobResult, jobs);
    jobs$.next([...updatedJobList]);
  });

const webSocketResponseError$ = wsMsgReceived$.pipe(
  filter((msg) => !!msg.error),
  map((msg) => msg.error!)
);

const currency$ = new ReplaySubject<string>(1);
from(fetchCurrency())
  .pipe(take(1))
  .subscribe((currency) => currency$.next(currency));

export const useSharedStore = defineStore('shared', {
  state: () => {
    return {
      currency$: currency$.asObservable(),
      webSocketResponseError$,
      subscanChains$,
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
