import { defineStore } from 'pinia';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  ReplaySubject,
} from 'rxjs';
import { useSharedStore } from '../../../../shared-module/store/shared.store';
import { extractStakingRewardsPerYear } from '../../../../shared-module/util/extract-staking-rewards-per-year';
import { StakingRewardsPerYear } from '../../../../shared-module/model/rewards';
const blockchain$ = new ReplaySubject<string>(1);
const wallet$ = new ReplaySubject<string>(1);
const currency$ = new ReplaySubject<string>(1);

const year$ = new BehaviorSubject(new Date().getFullYear() - 1);

const totalRewards$ = combineLatest([
  useSharedStore().jobs$,
  blockchain$,
  wallet$,
  currency$,
]).pipe(
  map(([jobs, blockchain, wallet, currency]) => {
    return jobs.find(
      (j) =>
        j.blockchain === blockchain &&
        j.wallet === wallet &&
        j.currency === currency
    );
  }),
  map((jobResult) => jobResult?.data)
);

const rewardsPerYear$: Observable<StakingRewardsPerYear | undefined> =
  combineLatest([totalRewards$, year$]).pipe(
    map(([rewards, year]) => {
      return extractStakingRewardsPerYear(rewards, year);
    })
  );

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewardsPerYear$,
      year$: year$.asObservable(),
    };
  },
  actions: {
    setBlockchain(blockchain: string) {
      blockchain$.next(blockchain);
    },
    setWallet(wallet: string) {
      wallet$.next(wallet);
    },
    setCurrency(currency: string) {
      currency$.next(currency);
    },
    setYear(year: number) {
      year$.next(year);
    },
  },
});
