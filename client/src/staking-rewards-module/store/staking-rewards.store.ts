import { defineStore } from 'pinia';
import {
  BehaviorSubject,
  firstValueFrom,
  from,
  ReplaySubject,
  map,
  withLatestFrom,
} from 'rxjs';
import { Chain } from '../../shared-module/model/chain';
import {
  CompletedRequest,
  DataRequest,
  PendingRequest,
} from '../../shared-module/model/data-request';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';
import { Rewards } from '../model/rewards';
import { fetchStakingRewards } from '../service/fetch-staking-rewards';
import { addIsoDateAndCurrentValue } from './util/add-iso-date-and-current-value';
import { calculateRewardSummary } from './util/calculate-reward-summary';
import { groupRewardsByDay } from './util/group-rewards-by-day';
import { startSyncing } from '../service/start-syncing';
import { wsMsgReceived$, wsSendMsg } from '../../shared-module/service/ws-connection';

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
const jobs$ = new ReplaySubject<any[]>(1);

wsMsgReceived$.subscribe(async msg => {
  const asObj = JSON.parse(msg.data)
  if (Array.isArray(asObj)) {
    jobs$.next(asObj)
  } else {
    const jobs = await firstValueFrom(jobs$)
    jobs.forEach(j => {
      if (j.wallet === asObj.wallet && j.blockchain === asObj.blockchain && j.timeFrame === asObj.timeFrame) {
        j.value = asObj.value
        j.status = asObj.status
        j.error = asObj.error
      }
    })
    jobs$.next([...jobs])
  }
})

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards$: rewards$.asObservable(),
      currency: 'USD',
      address: '',
      timeFrame: new Date().getFullYear() - 1,
      chainList$,
      chain$: chain$.asObservable(),
      jobs$: jobs$.asObservable()
    };
  },
  actions: {
    selectChain(newChain: Chain) {
      chain$.next(newChain);
    },
    async sync() {
      wsSendMsg({ wallet: this.address.trim(), currency: this.currency, year: this.timeFrame, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    }/*,
    async fetchRewards() {
      try {
        rewards$.next(new PendingRequest(undefined));
        const startDate = getStartDate(this.timeFrame);
        const endDate = getEndDate(this.timeFrame);
        const chain = (await firstValueFrom(chain$)).domain;
        const rewardsDto = await fetchStakingRewards(
          chain,
          this.address.trim(),
          this.currency,
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
          currency: this.currency,
          address: this.address,
          dailyValues: groupRewardsByDay(valuesWithIsoDate),
        };
        sortRewards(result);
        rewards$.next(new CompletedRequest(result));
      } catch (error) {
        rewards$.next({ pending: false, error, data: undefined });
      }
    },*/
  },
});
