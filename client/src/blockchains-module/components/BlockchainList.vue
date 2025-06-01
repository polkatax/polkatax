<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="flex justify-center q-pa-md">
      <q-btn
        color="purple"
        label="Synchronizing"
        icon="sync"
        class="icon-spinner"
        :style="{ cursor: 'default', opacity: isSynchronizing ? 1 : 0 }"
      />
    </div>
    <div
      class="table q-my-md flex justify-center"
      v-if="jobs?.length > 0 && chains.length > 0"
    >
      <q-table
        :rows="jobs"
        :columns="columns"
        :pagination="{ rowsPerPage: 0 }"
        row-key="name"
        :table-style="{ overflow: 'hidden' }"
        table-class="flex"
        class="content"
        hide-bottom
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            style="cursor: pointer"
            @click="showTaxableEvents(props.row)"
          >
            <q-td
              key="wallet"
              :props="props"
              style="overflow-wrap: anywhere !important"
            >
              {{ props.row.wallet.substring(0, 5) + '...' }}
              <q-tooltip>{{ props.row.wallet }}</q-tooltip>
            </q-td>
            <q-td
              key="blockchain"
              :props="props"
              style="overflow-wrap: anywhere !important"
            >
              {{ getLabelForBlockchain(props.row.blockchain) }}
            </q-td>
            <q-td key="currency" :props="props">
              <q-badge color="green">
                {{ props.row.currency }}
              </q-badge>
            </q-td>
            <q-td key="amountRewards" :props="props">
              {{ calculateTotalReward(props.row) }}
            </q-td>
            <q-td key="token" :props="props">
              {{ props.row?.data?.token }}
            </q-td>
            <q-td key="syncFromDate" :props="props">
              {{ syncedFrom }}
            </q-td>
            <q-td key="lastSynchronized" :props="props">
              {{
                props.row?.lastModified
                  ? formatDate(props.row?.lastModified)
                  : '?'
              }}
            </q-td>
            <q-td key="actions" :props="props">
              <div
                class="text-grey-8 q-gutter-xs"
                v-if="props.row.status === 'error'"
              >
                <q-btn
                  color="secondary"
                  flat
                  @click.stop="retry(props.row)"
                  dense
                  >Retry</q-btn
                >
              </div>
              <div
                class="text-grey-8 q-gutter-xs"
                v-if="props.row.status !== 'error'"
              >
                <q-btn
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="picture_as_pdf"
                  @click.stop="openMenu($event, props.row, 'pdf')"
                  ><q-tooltip anchor="top middle" self="bottom middle"
                    >Export as PDF</q-tooltip
                  ></q-btn
                >
                <q-btn
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="view_list"
                  @click.stop="openMenu($event, props.row, 'CSV')"
                  ><q-tooltip anchor="top middle" self="bottom middle"
                    >Export as CSV</q-tooltip
                  ></q-btn
                >
                <q-btn
                  ref="btnRef"
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="receipt"
                  @click.stop="openMenu($event, props.row, 'Koinly')"
                >
                  <q-tooltip anchor="top middle" self="bottom middle"
                    >Kionly export</q-tooltip
                  ></q-btn
                >
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div v-if="!jobs || jobs.length === 0" class="q-my-xl">
      <div class="text-h6 text-center" v-if="!isSynchronizing">
        No staking rewards found.
      </div>
      <div class="text-h6 text-center" v-if="isSynchronizing">
        No staking rewards found yet. Synchronization is in ongoing.
      </div>
    </div>
    <div class="q-pa-md"></div>
    <q-menu
      v-model="exportMenu"
      :target="exportMenuTarget"
      anchor="bottom middle"
      self="top middle"
      v-if="exportMenu"
    >
      <div class="q-pa-sm bg-primary text-white">Select year to export</div>
      <q-list style="min-width: 150px">
        <q-item v-for="year in exportYears" :key="year" clickable>
          <q-item-section
            class="q-mx-auto text-center"
            @click.stop="exportStakingRewards(year)"
            >{{ year }}</q-item-section
          >
        </q-item>
      </q-list>
    </q-menu>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBlockchainsStore } from '../store/blockchains.store';
import { JobResult } from '../../shared-module/model/job-result';
import { useSharedStore } from '../../shared-module/store/shared.store';
import { formatDate } from '../../shared-module/util/date-utils';
import { exportDefaultCsv } from '../../shared-module/service/export-default-csv';
import { exportKoinlyCsv } from '../../shared-module/service/export-koinly-csv';
import { getBeginningAndEndOfYear } from '../../shared-module/helper/get-beginning-and-end-of-year';
import { extractStakingRewardsPerYear } from '../../shared-module/helper/extract-staking-rewards-per-year';

const exportMenu = ref(false);
const exportMenuTarget: Ref<HTMLElement | undefined> = ref(undefined);
let exportType = '';
let exportData: Ref<JobResult | undefined> = ref(undefined);

const store = useBlockchainsStore();
const route = useRoute();
const router = useRouter();

function openMenu(event: Event, _exportData: JobResult, _exportType: string) {
  console.log('openMenu');
  event.stopPropagation();
  exportData.value = _exportData;
  exportType = _exportType;
  exportMenuTarget.value = event.currentTarget as HTMLElement;
  setTimeout(() => {
    exportMenu.value = true;
  }, 0);
}

async function exportStakingRewards(year: number) {
  const rewardsForYear = extractStakingRewardsPerYear(
    exportData.value!.data,
    year
  )!;
  switch (exportType) {
    case 'CSV':
      return exportDefaultCsv(rewardsForYear);
    case 'Koinly':
      return exportKoinlyCsv(rewardsForYear);
    case 'pdf':
      const { exportPdf } = await import(
        '../../shared-module/service/export-pdf'
      );
      exportPdf(rewardsForYear);
  }
}

const exportYears = computed(() => {
  return [new Date().getFullYear(), new Date().getFullYear() - 1].filter(
    (year) => {
      return (
        (exportData.value?.data.summary.perYear || []).find(
          (s) => s.year === year
        )?.amount ?? 0 > 0
      );
    }
  );
});

const jobs: Ref<JobResult[]> = ref([]);
const chains: Ref<{ domain: string; label: string }[]> = ref([]);
const isSynchronizing: Ref<boolean> = ref(true);

store.setCurrency(route.params.currency as string);
store.setWallet(route.params.wallet as string);

const jobsSubscription = store.syncedChains$.subscribe((jobResults) => {
  jobs.value = jobResults;
});

const syncSubscription = store.isSynchronizing$.subscribe((synchronizing) => {
  isSynchronizing.value = synchronizing;
});

const blokchainsSubscription = useSharedStore().substrateChains$.subscribe(
  (substrateChains) => {
    chains.value = substrateChains.chains;
  }
);

onUnmounted(() => {
  jobsSubscription.unsubscribe();
  blokchainsSubscription.unsubscribe();
  syncSubscription.unsubscribe();
});

const columns = ref([
  { name: 'wallet', align: 'left', label: 'Wallet' },
  {
    name: 'blockchain',
    align: 'left',
    label: 'Blockchain',
  },
  { name: 'currency', label: 'Currency' },
  { name: 'amountRewards', label: 'Total rewards' },
  { name: 'token', label: 'Token symbol' },
  { name: 'syncFromDate', label: 'Since' },
  { name: 'lastSynchronized', label: 'Synchronized on' },
  { name: 'actions', label: 'Actions' },
]);

function getLabelForBlockchain(domain: string) {
  return chains.value.find((c) => c.domain === domain)?.label ?? '';
}

function showTaxableEvents(row: any) {
  router.push(`/wallets/${row.wallet}/${row.currency}/${row.blockchain}`);
}

function calculateTotalReward(jobResult: JobResult) {
  return jobResult.data?.summary?.amount ?? '-';
}

const syncedFrom = computed(() => {
  return formatDate(
    getBeginningAndEndOfYear(new Date().getFullYear() - 1).beginning
  );
});

function retry(job: JobResult) {
  store.retry(job);
}
</script>
<style lang="scss">
.icon-spinner i {
  animation: spin 2s linear infinite;
  display: inline-block;
  transition: 1s all;
}
</style>
