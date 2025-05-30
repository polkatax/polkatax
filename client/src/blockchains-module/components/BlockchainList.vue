<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="flex justify-center q-pa-md">
      <q-btn color="purple" label="Synchronizing" icon="sync" class="icon-spinner" :style="{ 'cursor': 'default', 'opacity': isSynchronizing ? 1: 0}"/>
    </div>
    <div class="table q-my-md flex justify-center" v-if="jobs?.length > 0 && chains.length > 0">
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
            </q-td>
            <q-td
              key="blockchain"
              :props="props"
              style="overflow-wrap: anywhere !important"
            >
              {{ getLabelForBlockchain(props.row.blockchain) }}
            </q-td>
            <q-td key="timeframe" :props="props">
              <q-badge color="purple">
                {{ props.row.timeframe }}
              </q-badge>
            </q-td>
            <q-td key="currency" :props="props">
              <q-badge color="green">
                {{ props.row.currency }}
              </q-badge>
            </q-td>
            <q-td key="amountRewards" :props="props">
              {{ props.row?.data?.summary?.amount !== undefined ? props.row?.data?.summary?.amount.toPrecision(4) : '-' }}
            </q-td>
            <q-td key="token" :props="props">
              {{ props.row?.data?.token }}
            </q-td>
            <q-td key="lastSynchronized" :props="props">
              {{ props.row?.lastModified ? formatDate(props.row?.lastModified) : '?' }}
            </q-td>
            <q-td key="actions" :props="props">
              <div
                class="text-grey-8 q-gutter-xs"
                v-if="props.row.status === 'error'"
              >
                Retry
              </div>
              <div
                class="text-grey-8 q-gutter-xs"
                v-if="props.row.status === 'done'"
              >
                <q-btn
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="picture_as_pdf"
                />
                <q-btn
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="view_list"
                />
                <q-btn
                  class="gt-xs"
                  size="12px"
                  flat
                  dense
                  round
                  icon="arrow_forward"
                />
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
    <div class="q-pa-md">

  </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBlockchainsStore } from '../store/blockchains.store';
import { JobResult } from '../../shared-module/model/job-result';
import { useSharedStore } from '../../shared-module/store/shared.store';
import { tokenAmountFormatter } from '../../shared-module/util/number-formatters';
import { formatDate } from '../../shared-module/util/date-utils';

const store = useBlockchainsStore();
const route = useRoute();
const router = useRouter();

const jobs: Ref<JobResult[]> = ref([]);
const chains: Ref<{ domain: string, label: string}[]> = ref([])
const isSynchronizing: Ref<boolean> = ref(true)

store.setCurrency(route.params.currency as string);
store.setWallet(route.params.wallet as string);
store.setTimeframe(Number(route.params.timeframe));

const jobsSubscription = store.syncedChains$.subscribe((jobResults) => {
  jobs.value = jobResults;
});

const syncSubscription = store.isSynchronizing$.subscribe((synchronizing) => {
  isSynchronizing.value = synchronizing;
});

const blokchainsSubscription = useSharedStore().substrateChains$.subscribe(substrateChains => {
  chains.value = substrateChains.chains
})

onUnmounted(() => {
  jobsSubscription.unsubscribe()
  blokchainsSubscription.unsubscribe()
  syncSubscription.unsubscribe()
});

const columns = ref([
  { name: 'wallet', align: 'left', label: 'Wallet' },
  {
    name: 'blockchain',
    align: 'left',
    label: 'Blockchain',
    sortable: true
  },
  { name: 'timeframe', label: 'Year' },
  { name: 'currency', label: 'Currency' },
  { name: 'amountRewards', label: 'Total rewards' },
  { name: 'token', label: 'Token symbol' },
  { name: 'lastSynchronized', label: 'Synchronized on' },
  { name: 'actions', label: 'Actions' },
]);

function getLabelForBlockchain(domain: string) {
  return chains.value.find(c => c.domain === domain)?.label ?? ''
}

function showTaxableEvents(row: any) {
  router.push(
    `/taxable-events/${row.wallet}/${row.blockchain}/${row.timeframe}/${row.currency}`
  );
}

const amountFormatter = computed(() => tokenAmountFormatter(4));
</script>
<style lang="scss">
.icon-spinner i {
  animation: spin 2s linear infinite;
  display: inline-block;
  transition: 1s all;
}
</style>