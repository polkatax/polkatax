import { defineStore } from 'pinia';
import {
  BehaviorSubject,
  firstValueFrom,
  from,
  ReplaySubject,
  map,
} from 'rxjs';
import { Chain } from '../../shared-module/model/chain';
import {
  CompletedRequest,
  DataRequest,
  PendingRequest,
} from '../../shared-module/model/data-request';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { Rewards } from '../model/rewards';
import { fetchStakingRewards } from '../service/fetch-staking-rewards';
import { addIsoDateAndCurrentValue } from './util/add-iso-date-and-current-value';
import { calculateRewardSummary } from './util/calculate-reward-summary';
import { groupRewardsByDay } from './util/group-rewards-by-day';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';
import { useSharedStore } from '../../shared-module/store/shared.store';

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

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards$: rewards$.asObservable(),
      address: '',
      timeFrame: new Date().getFullYear() - 1,
      chainList$,
      chain$: chain$.asObservable(),
    };
  },
  actions: {
    selectChain(newChain: Chain) {
      chain$.next(newChain);
    },

    async fetchRewards() {
      try {
        rewards$.next(new PendingRequest(undefined));
        const startDate = getStartDate(this.timeFrame);
        const endDate = getEndDate(this.timeFrame);
        const chain = (await firstValueFrom(chain$)).domain;
        const currency = await firstValueFrom(useSharedStore().currency$);
        const rewardsDto = await fetchStakingRewards(
          chain,
          this.address.trim(),
          currency,
          startDate,
          endDate
        );
        const valuesWithIsoDate = addIsoDateAndCurrentValue(
          rewardsDto.values,
          rewardsDto.currentPrice
        );
        const result: Rewards = {
          values: valuesWithIsoDate,
          summary: calculateRewardSummary(valuesWithIsoDate),
          currentPrice: rewardsDto.currentPrice,
          timeFrame: this.timeFrame,
          startDate,
          endDate,
          chain,
          token: rewardsDto.token,
          currency,
          address: this.address,
          dailyValues: groupRewardsByDay(valuesWithIsoDate),
        };
        sortRewards(result);
        rewards$.next(new CompletedRequest(result));
      } catch (error) {
        rewards$.next({ pending: false, error, data: undefined });
      }
    },
  },
});
