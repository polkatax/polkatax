<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="name"
      no-data-label="No rewards found"
      :pagination="initialPagination"
    >
      <template v-slot:top>
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsPdf" :disable="noRewards"
          >Export Pdf
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsCsv" :disable="noRewards"
          >Export CSV
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsKoinlyCsv" :disable="noRewards"
          >Koinly Export
        </q-btn>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { Reward, StakingRewardsPerYear } from '../../../../shared-module/model/rewards';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import {
  tokenAmountFormatter,
  valueFormatter,
} from '../../../../shared-module/util/number-formatters';
import { formatDate } from '../../../../shared-module/util/date-utils';
import { exportDefaultCsv } from '../../../../shared-module/service/export-default-csv';
import { exportKoinlyCsv } from '../../../../shared-module/service/export-koinly-csv';

const rewardsStore = useStakingRewardsStore();
const rewards: Ref<StakingRewardsPerYear | undefined> = ref(undefined);

const subscription = rewardsStore.rewardsPerYear$.subscribe(async (r) => {
  rewards.value = r;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

const noRewards = computed(() => {
  return !rewards.value || rewards.value?.values.length === 0
})

const columns = computed(() => [
  {
    name: 'timestamp',
    required: true,
    label: 'Date',
    align: 'left',
    field: (row: Reward) => formatDate(row.timestamp * 1000),
    sortable: true,
  },
  {
    name: 'block',
    align: 'right',
    label: 'Block',
    field: 'block',
    sortable: true,
  },
  {
    name: 'reward',
    align: 'right',
    label: `Reward (${rewardToken.value})`,
    field: 'amount',
    format: (num: number) => amountFormatter.value.format(num),
    sortable: true,
  },
  {
    name: 'price',
    align: 'right',
    label: `Price (${rewards.value?.currency})`,
    field: 'price',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
  {
    name: 'fiatValue',
    align: 'right',
    label: `Value (${rewards.value?.currency})`,
    field: 'fiatValue',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
]);

const rows = computed(() => {
  return rewards.value?.values;
});

const tokenDigits = computed(() => {
  let max = 0;
  rewards.value?.values.forEach((v: Reward) => {
    const parts = v.amount.toString().split('.');
    if (parts.length < 2) {
      return 0;
    }
    const digits = parts[1].length;
    if (digits > max) {
      max = digits;
    }
  });
  return max;
});

const rewardToken = computed(() => {
  return rewards.value?.token;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportRewardsAsCsv() {
  exportDefaultCsv(rewards.value!);
}

function exportRewardsAsKoinlyCsv() {
  exportKoinlyCsv(rewards.value!);
}

async function exportRewardsAsPdf() {
  // loading exportPdf on demand due to module size.
  const { exportPdf } = await import('../../../../shared-module/service/export-pdf');
  exportPdf(rewards.value!);
}
const amountFormatter = computed(() => tokenAmountFormatter(tokenDigits.value));
</script>
