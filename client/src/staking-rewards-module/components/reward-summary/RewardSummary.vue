<template>
  <div class="text-h6">Summary of staking rewards ({{ timeFrame }})</div>
  <table class="q-my-lg q-mx-auto" v-if="rewards">
    <tr>
      <td class="text-left q-pa-sm">Total rewards:</td>
      <td class="text-right q-pa-sm" data-testid="total-rewards">
        {{ formatTokenAmount(rewards!.summary.amount) + ' ' + rewards!.token }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Average rewards per day:</td>
      <td class="text-right q-pa-sm">
        {{ formatTokenAmount(averageDailyRewards) + ' ' + rewards!.token }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value at payout time:</td>
      <td class="text-right q-pa-sm" data-testid="value-at-payout-time">
        {{ formatCurrency(rewards?.summary?.fiatValue ?? -0) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value now:</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(rewards?.summary?.valueNow ?? 0) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Current price:</td>
      <td class="text-right q-pa-sm">
        {{ formatPrice(rewards!.currentPrice) }}
      </td>
    </tr>
  </table>
  <div v-if="rewards">
    Verify your rewards here:
    <a
      :href="`https://${rewards.chain}.subscan.io/account/${rewards.address}?tab=reward`"
      style="line-break: anywhere"
      target="_blank"
    >
      https://{{ rewards!.chain }}.subscan.io/account/{{
        rewards!.address
      }}?tab=reward
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { formatTimeFrame } from '../../../shared-module/util/date-utils';
import { Rewards } from '../../model/rewards';

const rewardsStore = useStakingRewardsStore();

const rewards: Ref<Rewards | undefined> = ref(undefined);

rewardsStore.rewards$.subscribe((dataRequest) => {
  rewards.value = dataRequest.data;
});

const averageDailyRewards = computed(() => {
  if (!rewardsStore.rewards$) {
    return 0;
  }
  return (
    (rewards.value!.summary.amount /
      (rewards.value!.endDate - rewards.value!.startDate)) *
    24 *
    60 *
    60 *
    1000
  );
});

const timeFrame = computed(() => {
  return rewards.value ? formatTimeFrame(rewards.value!.timeFrame) : '';
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
</script>
