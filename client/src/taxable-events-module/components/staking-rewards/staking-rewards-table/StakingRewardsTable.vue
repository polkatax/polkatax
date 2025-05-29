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
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsPdf"
          >Export Pdf
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsCsv"
          >Export CSV
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportRewardsAsKoinlyCsv"
          >Koinly Export
        </q-btn>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { Reward, Rewards } from '../../../../shared-module/model/rewards';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import {
  tokenAmountFormatter,
  valueFormatter,
} from '../../../../shared-module/util/number-formatters';
import { formatDate } from '../../../../shared-module/util/date-utils';
import { exportDefaultCsv } from '../service/export-default-csv';
import { exportKoinlyCsv } from '../service/export-koinly-csv';

const rewardsStore = useStakingRewardsStore();
const rewards: Ref<Rewards | undefined> = ref(undefined);

const subscription = rewardsStore.rewards$.subscribe(async (r) => {
  rewards.value = r;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

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
  {
    name: 'valueNow',
    align: 'right',
    label: `Value now (${rewards.value?.currency})`,
    field: 'valueNow',
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
  const { exportPdf } = await import('../service/export-pdf');
  exportPdf(rewards.value!);
}
const amountFormatter = computed(() => tokenAmountFormatter(tokenDigits.value));
</script>
