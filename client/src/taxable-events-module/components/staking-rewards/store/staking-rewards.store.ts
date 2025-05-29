import { defineStore } from 'pinia';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { useSharedStore } from '../../../../shared-module/store/shared.store';

const blockchain$ = new ReplaySubject<string>(1);
const wallet$ = new ReplaySubject<string>(1);
const timeframe$ = new ReplaySubject<number>(1);
const currency$ = new ReplaySubject<string>(1);

const rewards$ = combineLatest([
  useSharedStore().jobs$,
  blockchain$,
  wallet$,
  timeframe$,
  currency$,
]).pipe(
  map(([jobs, blockchain, wallet, timeframe, currency]) => {
    return jobs.find(
      (j) =>
        j.blockchain === blockchain &&
        j.wallet === wallet &&
        j.timeframe === timeframe &&
        j.currency === currency
    );
  }),
  map((jobResult) => jobResult?.data)
);

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards$,
      jobs$: useSharedStore().jobs$,
    };
  },
  actions: {
    setBlockchain(blockchain: string) {
      blockchain$.next(blockchain);
    },
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
