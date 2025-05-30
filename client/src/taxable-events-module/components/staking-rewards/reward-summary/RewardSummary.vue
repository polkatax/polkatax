<template>
  <div class="text-h6">Summary of Staking Rewards</div>
  <table class="q-my-lg q-mx-auto" v-if="rewards">
    <tr>
      <td class="text-left q-pa-sm">Time frame:</td>
      <td class="text-right q-pa-sm">
        {{ timeFrame }}
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
    <tr>
      <td class="text-left q-pa-sm">Total rewards:</td>
      <td class="text-right q-pa-sm" data-testid="total-rewards">
        {{ formatTokenAmount(rewards!.summary.amount) + ' ' + rewards!.token }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value at payout time:</td>
      <td class="text-right q-pa-sm" data-testid="value-at-payout-time">
        {{ formatCurrency(rewards?.summary?.fiatValue ?? -0) }}
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, Ref } from 'vue';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { formatTimeFrame } from '../../../../shared-module/util/date-utils';
import { Rewards } from '../../../../shared-module/model/rewards';
import { useSharedStore } from '../../../../shared-module/store/shared.store';
import { combineLatest } from 'rxjs';

const rewardsStore = useStakingRewardsStore();

const rewards: Ref<Rewards | undefined> = ref(undefined);
const blockchainLabel: Ref<string> = ref('')

const subscription = combineLatest([useSharedStore().substrateChains$, rewardsStore.rewards$]).subscribe(async ([chains, stakingRewards]) => {
  rewards.value = stakingRewards;
  blockchainLabel.value = chains.chains.find(c => c.domain === stakingRewards?.chain)?.label ?? ''
});

onBeforeUnmount(() => {
  subscription.unsubscribe();
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
