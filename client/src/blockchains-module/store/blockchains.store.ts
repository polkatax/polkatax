import { defineStore } from 'pinia';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { useSharedStore } from '../../shared-module/store/shared.store';
import { JobResult } from '../../shared-module/model/job-result';
import { wsSendMsg } from '../../shared-module/service/ws-connection';

const wallet$ = new ReplaySubject<string>(1);
const currency$ = new ReplaySubject<string>(1);

const jobsMatchingWallet$ = combineLatest([
  useSharedStore().jobs$,
  wallet$,
  currency$,
]).pipe(
  map(([jobs, wallet, currency]) => {
    return jobs.filter((j) => j.wallet === wallet && j.currency === currency);
  })
);

const syncedChains$ = jobsMatchingWallet$.pipe(
  map((jobs) => {
    return jobs
      .filter((j) => j.status === 'error' || (j.data?.summary?.amount ?? 0 > 0))
      .sort((a, b) => (a.blockchain > b.blockchain ? 1 : -1));
  })
);

const isSynchronizing$ = jobsMatchingWallet$.pipe(
  map((jobs) =>
    jobs.some((j) => j.status === 'pending' || j.status === 'in_progress')
  )
);

export const useBlockchainsStore = defineStore('blockchains', {
  state: () => {
    return {
      syncedChains$,
      isSynchronizing$,
    };
  },
  actions: {
    setWallet(wallet: string) {
      wallet$.next(wallet);
    },
    setCurrency(currency: string) {
      currency$.next(currency);
    },
    retry(job: JobResult) {
      wsSendMsg({
        type: 'fetchDataRequest',
        payload: {
          wallet: job.wallet,
          blockchains: [job.blockchain],
          currency: job.currency,
        },
      });
    },
  },
});
