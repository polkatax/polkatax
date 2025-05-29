import { defineStore } from 'pinia';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { useSharedStore } from '../../shared-module/store/shared.store';

const wallet$ = new ReplaySubject<string>(1);
const timeframe$ = new ReplaySubject<number>(1);
const currency$ = new ReplaySubject<string>(1);

const walletJobs$ = combineLatest([
  useSharedStore().jobs$,
  wallet$,
  timeframe$,
  currency$,
]).pipe(
  map(([jobs, wallet, timeframe, currency]) => {
    return jobs
      .filter(
        (j) =>
          j.wallet === wallet &&
          j.timeframe === timeframe &&
          j.currency === currency
      )
      .sort((a, b) => (a.blockchain > b.blockchain ? 1 : -1));
  })
);

export const useBlockchainsStore = defineStore('blockchains', {
  state: () => {
    return {
      walletJobs$,
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
