<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="q-my-xl" v-if="jobs?.length > 0">
      <q-table
        :rows="jobs"
        :columns="columns"
        :pagination="{ rowsPerPage: 0 }"
        row-key="name"
        data-testid="connected-chains-data-table"
        hide-bottom
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            class="clickable-row"
            tabindex="0"
            role="button"
            @click="showTaxableEvents(props.row)"
            @keydown.enter.prevent="showTaxableEvents(props.row)"
            @keydown.space.prevent="showTaxableEvents(props.row)"
          >
            <q-td key="status" :props="props" style="overflow: hidden">
              <q-icon
                :name="matSync"
                size="md"
                class="spinner"
                data-testid="wallet-status-icon"
                v-if="
                  props.row.status === 'in_progress' ||
                  props.row.status === 'pending'
                "
              />
              <q-icon
                :name="matOfflinePin"
                size="md"
                v-if="props.row.status === 'done'"
              />
              <q-icon
                :name="matError"
                size="md"
                v-if="props.row.status === 'error'"
                @click.stop
              >
                <q-tooltip
                  anchor="top middle"
                  self="bottom middle"
                  aria-label="Error infor tooltip"
                  >{{
                    props.row.error?.msg ??
                    'An error occured when fetching data.'
                  }}</q-tooltip
                ></q-icon
              >
            </q-td>
            <q-td key="wallet" :props="props" class="wallet-cell">
              {{ props.row.wallet.substring(0, 5) + '...' }}
              <q-tooltip aria-label="Full wallet address">{{
                props.row.wallet
              }}</q-tooltip>
            </q-td>
            <q-td key="blockchain" :props="props" class="blockchain-cell">
              {{ getLabelForBlockchain(props.row.blockchain) }}
            </q-td>
            <q-td key="currency" :props="props">
              <q-badge color="green" aria-label="Currency">
                {{ props.row.currency }}
              </q-badge>
            </q-td>
            <q-td key="amountRewards" :props="props">
              {{
                formatAmount(calculateTotalReward(props.row), '-') +
                ' ' +
                (props.row?.data?.token ?? '')
              }}
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
                  aria-label="Retry synchronization"
                  >Retry</q-btn
                >
              </div>
              <div
                class="text-grey-8 q-gutter-xs"
                v-if="props.row.status === 'done'"
              >
                <q-btn
                  size="12px"
                  flat
                  dense
                  round
                  icon="picture_as_pdf"
                  @click.stop="openMenu($event, props.row, 'pdf')"
                  aria-label="Export as PDF"
                >
                  <q-tooltip
                    anchor="top middle"
                    self="bottom middle"
                    aria-label="Export as PDF tooltip"
                    >Export as PDF</q-tooltip
                  >
                </q-btn>
                <q-btn
                  size="12px"
                  flat
                  dense
                  round
                  icon="view_list"
                  @click.stop="openMenu($event, props.row, 'CSV')"
                  aria-label="Export as CSV"
                >
                  <q-tooltip
                    anchor="top middle"
                    self="bottom middle"
                    aria-label="Export as CSV tooltip"
                    >Export as CSV</q-tooltip
                  >
                </q-btn>
                <q-btn
                  ref="btnRef"
                  size="12px"
                  flat
                  dense
                  round
                  icon="receipt"
                  @click.stop="openMenu($event, props.row, 'Koinly')"
                  aria-label="Export as Koinly CSV"
                >
                  <q-tooltip
                    anchor="top middle"
                    self="bottom middle"
                    aria-label="Export as Koinly tooltip"
                    >Koinly export</q-tooltip
                  >
                </q-btn>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div v-if="!jobs || jobs.length === 0" class="q-my-xl">
      <div class="text-h6 text-center" role="alert" aria-live="polite">
        {{
          isSynchronizing
            ? 'No staking rewards found yet. Synchronization is ongoing.'
            : 'No staking rewards found.'
        }}
      </div>
    </div>
    <div class="q-pa-md"></div>
    <q-menu
      v-model="exportMenu"
      :target="exportMenuTarget"
      anchor="bottom middle"
      self="top middle"
      v-if="exportMenu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-menu-label"
    >
      <div id="export-menu-label" class="q-pa-sm bg-primary text-white">
        Select year to export
      </div>
      <q-list>
        <q-item
          v-for="year in exportYears"
          :key="year"
          clickable
          tabindex="0"
          @keydown.enter.stop.prevent="exportStakingRewards(year)"
        >
          <q-item-section
            class="q-mx-auto text-center"
            @click.stop="exportStakingRewards(year)"
            role="button"
            >{{ year }}</q-item-section
          >
        </q-item>
      </q-list>
    </q-menu>
  </q-page>
  <div class="flex justify-center q-pa-md">
    <q-btn
      color="purple"
      label="Synchronizing"
      icon="sync"
      class="icon-spinner synchronizing-btn"
      aria-live="polite"
      aria-atomic="true"
      :aria-hidden="!isSynchronizing"
      tabindex="-1"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { JobResult } from '../../shared-module/model/job-result';
import { useSharedStore } from '../../shared-module/store/shared.store';
import {
  formatDate,
  getBeginningAndEndOfYear,
} from '../../shared-module/util/date-utils';
import {
  matSync,
  matOfflinePin,
  matError,
} from '@quasar/extras/material-icons';
import { exportDefaultCsv } from '../../shared-module/service/export-default-csv';
import { exportKoinlyCsv } from '../../shared-module/service/export-koinly-csv';
import { extractStakingRewardsPerYear } from '../../shared-module/util/extract-staking-rewards-per-year';
import { useConnectedBlockchainsStore } from '../store/connected-blockchains.store';
import { formatCryptoAmount } from '../../shared-module/util/number-formatters';

const exportMenu = ref(false);
const exportMenuTarget: Ref<HTMLElement | undefined> = ref(undefined);
const exportType = ref('');
let exportData: Ref<JobResult | undefined> = ref(undefined);

const store = useConnectedBlockchainsStore();
const route = useRoute();
const router = useRouter();

function openMenu(event: Event, _exportData: JobResult, _exportType: string) {
  console.log('openMenu');
  event.stopPropagation();
  exportData.value = _exportData;
  exportType.value = _exportType;
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
  switch (exportType.value) {
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
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1].filter((year) => {
    return (
      (exportData.value?.data.summary.perYear || []).find(
        (s) => s.year === year
      )?.amount ?? 0 > 0
    );
  });
});

const jobs: Ref<JobResult[]> = ref([]);
const chains: Ref<{ domain: string; label: string }[] | undefined> =
  ref(undefined);
const isSynchronizing: Ref<boolean> = ref(true);

store.setCurrency(route.params.currency as string);
store.setWallet(route.params.wallet as string);

const jobsSubscription = store.syncedChains$.subscribe((jobResults) => {
  jobs.value = jobResults;
});

const syncSubscription = store.isSynchronizing$.subscribe((synchronizing) => {
  isSynchronizing.value = synchronizing;
});

const blockchainsSubscription = useSharedStore().subscanChains$.subscribe(
  (subscanChains) => {
    chains.value = subscanChains.chains;
  }
);

onUnmounted(() => {
  jobsSubscription.unsubscribe();
  blockchainsSubscription.unsubscribe();
  syncSubscription.unsubscribe();
});

const columns = ref([
  { name: 'status', align: 'left', label: 'Status' },
  { name: 'wallet', align: 'left', label: 'Wallet' },
  {
    name: 'blockchain',
    align: 'left',
    label: 'Blockchain',
  },
  { name: 'currency', label: 'Currency' },
  { name: 'amountRewards', label: 'Total staking rewards' },
  { name: 'syncFromDate', label: 'Since' },
  { name: 'lastSynchronized', label: 'Synchronized on' },
  { name: 'actions', label: 'Actions' },
]);

function getLabelForBlockchain(domain: string) {
  return !chains.value
    ? domain
    : chains.value.find((c) => c.domain === domain)?.label ?? '';
}

function showTaxableEvents(row: JobResult) {
  router.push(`/wallets/${row.wallet}/${row.currency}/${row.blockchain}`);
}

function calculateTotalReward(jobResult: JobResult) {
  return jobResult.data?.summary?.amount;
}

const syncedFrom = computed(() => {
  return formatDate(
    getBeginningAndEndOfYear(new Date().getFullYear() - 1).beginning
  );
});

function retry(job: JobResult) {
  store.retry(job);
}

function formatAmount(amount: number | undefined, alt: string) {
  if (amount === undefined) {
    return alt;
  }
  return formatCryptoAmount(amount);
}
</script>
<style lang="scss">
.icon-spinner i {
  animation: spin 2s linear infinite;
  display: inline-block;
  transition: 1s all;
}

.synchronizing-btn {
  cursor: default;
  opacity: 1;
  transition: opacity 0.3s ease;
  position: fixed;
  left: 50%;
  z-index: 1;
  bottom: 150px;
  pointer-events: none;
  transform: translateX(-50%);
}
.synchronizing-btn[aria-hidden='true'] {
  opacity: 0;
}

.wallet-cell,
.blockchain-cell {
  overflow-wrap: anywhere !important;
}

.clickable-row {
  cursor: pointer;
  outline: none;
}
</style>
