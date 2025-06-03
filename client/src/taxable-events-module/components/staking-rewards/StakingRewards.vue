<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="text-center q-my-xl" v-if="rewards">
      <reward-summary />
    </div>
    <div
      class="justify-around items-center column"
      v-if="rewards && Object.keys(rewards.dailyValues).length > 20"
    >
      <rewards-chart :currency="false" chartType="ColumnChart" />
    </div>
    <div class="q-my-md" v-if="rewards">
      <staking-rewards-table />
    </div>
    <div v-if="!rewards" class="q-my-xl">
      <div class="text-h6 text-center">No rewards found</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RewardsChart from './rewards-chart/RewardsChart.vue';
import StakingRewardsTable from './staking-rewards-table/StakingRewardsTable.vue';
import RewardSummary from './reward-summary/RewardSummary.vue';
import { onUnmounted, Ref, ref } from 'vue';
import { useStakingRewardsStore } from './store/staking-rewards.store';
import { useRoute } from 'vue-router';
import { StakingRewardsPerYear } from '../../../shared-module/model/rewards';

const rewardsStore = useStakingRewardsStore();
const route = useRoute();

const rewards: Ref<StakingRewardsPerYear | undefined> = ref(undefined);
rewardsStore.setCurrency(route.params.currency as string);
rewardsStore.setBlockchain(route.params.blockchain as string);
rewardsStore.setWallet(route.params.wallet as string);

const rewardsSubscription = rewardsStore.rewardsPerYear$.subscribe(
  async (r) => {
    rewards.value = r;
  }
);

onUnmounted(() => {
  rewardsSubscription.unsubscribe();
});
</script>
