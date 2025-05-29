<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="table q-my-md flex justify-center" v-if="jobs?.length > 0">
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
            <q-td key="status" :props="props">
              <q-icon
                :name="matSync"
                size="lg"
                class="spinner"
                v-if="props.row.status === 'pending'"
              />
              <q-icon
                :name="matSync"
                size="lg"
                class="spinner fast"
                v-if="props.row.status === 'in_progress'"
              />
              <q-icon
                :name="matError"
                size="lg"
                v-if="props.row.status === 'error'"
                color="red"
              />
              <q-icon
                :name="matOfflinePin"
                size="lg"
                v-if="props.row.status === 'done'"
              />
            </q-td>
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
              {{ props.row.blockchain.toUpperCase() }}
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
      <div class="text-h6 text-center">
        No jobs found. Return to start page.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  matSync,
  matOfflinePin,
  matError,
} from '@quasar/extras/material-icons';
import { onUnmounted, Ref, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBlockchainsStore } from '../store/blockchains.store';
import { JobResult } from '../../shared-module/model/job-result';

const store = useBlockchainsStore();
const route = useRoute();
const router = useRouter();

const jobs: Ref<JobResult[]> = ref([]);

store.setCurrency(route.params.currency as string);
store.setWallet(route.params.wallet as string);
store.setTimeframe(Number(route.params.timeframe));

const jobsSubscription = store.walletJobs$.subscribe((jobResults) => {
  jobs.value = jobResults;
});

onUnmounted(() => {
  if (jobsSubscription) {
    jobsSubscription.unsubscribe();
  }
});

const columns = ref([
  {
    name: 'status',
    align: 'left',
    label: 'Status',
    field: 'status',
    sortable: true,
  },
  { name: 'wallet', align: 'left', label: 'Wallet', field: 'wallet' },
  {
    name: 'blockchain',
    align: 'left',
    label: 'Blockchain',
    field: 'blockchain',
    sortable: true,
  },
  { name: 'timeframe', label: 'Year', field: 'timeframe' },
  { name: 'currency', label: 'Currency', field: 'currency' },
  { name: 'actions', label: 'Actions' },
]);

function showTaxableEvents(row: any) {
  router.push(
    `/taxable-events/${row.wallet}/${row.blockchain}/${row.timeframe}/${row.currency}`
  );
}
</script>
