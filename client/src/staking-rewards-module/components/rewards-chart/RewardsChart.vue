<template>
  <GChart
    v-if="hasData"
    :data="rewardDataTable"
    :type="chartType"
    :options="options"
    style="width: 100%; min-height: 400px"
  ></GChart>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, Ref } from 'vue';
import { GChart } from 'vue-google-charts';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { formatDate } from '../../../shared-module/util/date-utils';
import { Rewards } from '../../model/rewards';

const rewardsStore = useStakingRewardsStore();

const props = defineProps({
  currency: Boolean,
  chartType: String,
});

const rewards: Ref<Rewards | undefined> = ref(undefined);

const subscription = rewardsStore.rewards$.subscribe((dataRequest) => {
  rewards.value = dataRequest.data;
});

const hasData = computed(() => {
  return (rewards.value?.values || []).length !== 0;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

const rewardDataTable = computed(() => {
  const header = [['date', 'Amount']];
  const minDay = rewards.value!.values[0].isoDate;
  const maxDay =
    rewards.value!.values[rewards.value!.values.length - 1].isoDate;
  const temp = new Date(minDay);
  temp.setHours(0);
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  const data = [];
  let isoDate = formatDate(temp.getTime());
  do {
    isoDate = formatDate(temp.getTime());
    data.push([
      new Date(isoDate + ':00:00:00'),
      rewards.value?.dailyValues[isoDate]?.amount || 0,
    ]);
    temp.setDate(temp.getDate() + 1);
  } while (isoDate !== maxDay);
  return [...header, ...data];
});

const options = computed(() => ({
  title: `Rewards (${
    props.currency ? rewards.value!.currency : rewards.value!.token
  })`,
  curveType: rewards.value!.values.length > 50 ? 'function' : undefined,
  legend: { position: 'top' },
  hAxis: {
    title: 'Date',
  },
  vAxis: {
    minValue: 0,
  },
  axisTitlesPosition: 'out',
}));
</script>
