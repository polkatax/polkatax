import { defineStore } from 'pinia';
import { combineLatest, filter, map, ReplaySubject } from 'rxjs';
import { useSharedStore } from '../../shared-module/store/shared.store';

const wallet$ = new ReplaySubject<string>(1);
const timeframe$ = new ReplaySubject<number>(1);
const currency$ = new ReplaySubject<string>(1);

const jobsMatchingWallet$ = combineLatest([
  useSharedStore().jobs$,
  wallet$,
  timeframe$,
  currency$,
]).pipe(
  map(([jobs, wallet, timeframe, currency]) => {
    return jobs.filter(
      (j) =>
        j.wallet === wallet &&
        j.timeframe === timeframe &&
        j.currency === currency
    );
  })
);

const syncedChains$ = jobsMatchingWallet$.pipe(
  map((jobs) => {
    return jobs
      .filter(
        (j) =>
          j.status === 'error' ||
          (j.status === 'done' && j.data?.summary?.amount) ||
          0 > 0
      )
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
    setTimeframe(timeframe: number) {
      timeframe$.next(timeframe);
    },
    setCurrency(currency: string) {
      currency$.next(currency);
    },
  },
});
