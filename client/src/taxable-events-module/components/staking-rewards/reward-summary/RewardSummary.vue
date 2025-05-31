<template>
  <div class="text-h6">Summary of Staking Rewards</div>
  <table class="q-my-lg q-mx-auto" v-if="rewards">
    <tr>
      <td class="text-left q-pa-sm">Year:</td>
      <td class="text-right q-pa-sm">
        <TimeFrameDropdown v-model="year" @update:model-value="yearSelected"/>
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Blockchain:</td>
      <td class="text-right q-pa-sm">
        {{ blockchainLabel ?? rewards.chain }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Wallet:</td>
      <td class="text-right q-pa-sm" style="overflow-wrap: anywhere">
        {{ rewards.address }}
      </td>
    </tr>
    <tr v-if="rewards?.summary">
      <td class="text-left q-pa-sm">Total rewards:</td>
      <td class="text-right q-pa-sm" data-testid="total-rewards">
        {{ formatTokenAmount(rewards.summary!.amount) + ' ' + rewards!.token }}
      </td>
    </tr>
    <tr v-if="rewards?.summary">
      <td class="text-left q-pa-sm">Value at payout time:</td>
      <td class="text-right q-pa-sm" data-testid="value-at-payout-time">
        {{ formatCurrency(rewards.summary.fiatValue ?? -0) }}
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, Ref } from 'vue';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { useSharedStore } from '../../../../shared-module/store/shared.store';
import { combineLatest } from 'rxjs';
import TimeFrameDropdown from '../../time-frame-dropdown/TimeFrameDropdown.vue';
import { StakingRewardsPerYear } from '../../../../shared-module/model/rewards';

const rewardsStore = useStakingRewardsStore();
const year: Ref<number | undefined> = ref(undefined)
const rewards: Ref<StakingRewardsPerYear | undefined> = ref(undefined);
const blockchainLabel: Ref<string> = ref('');

const yearSubscription = rewardsStore.year$.subscribe(y => year.value = y)

const subscription = combineLatest([
  useSharedStore().substrateChains$,
  rewardsStore.rewardsPerYear$,
]).subscribe(async ([chains, _rewards]) => {
  rewards.value = _rewards
  blockchainLabel.value =
    chains.chains.find((c) => c.domain === _rewards?.chain)?.label ?? '';
});

onBeforeUnmount(() => {
  subscription.unsubscribe();
  yearSubscription.unsubscribe()
});
function formatCurrency(value: number) {
  if (isNaN(value)) {
    return '?';
  }
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: rewards.value!.currency.toUpperCase(),
  }).format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: rewards.value!.currency.toUpperCase(),
    maximumSignificantDigits: 4,
  }).format(value);
}

function formatTokenAmount(value: number) {
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function yearSelected(year: number) {
  rewardsStore.setYear(year)
}
</script>
