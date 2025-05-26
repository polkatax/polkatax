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
        hide-bottom>
          <template v-slot:body="props">
              <q-tr :props="props" style="cursor: pointer">
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
              <q-td key="wallet" :props="props" style="overflow-wrap: anywhere!important">
                {{ props.row.wallet.substring(0, 5) + '...' }}
              </q-td>
              <q-td key="blockchain" :props="props" style="overflow-wrap: anywhere!important">
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
                <div class="text-grey-8 q-gutter-xs" v-if="props.row.status === 'error'">
                  Retry
                </div>
                <div class="text-grey-8 q-gutter-xs" v-if="props.row.status === 'done'">
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
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { Chain } from '../../shared-module/model/chain';
import { map, take } from 'rxjs';
import { useRoute } from 'vue-router';
const rewardsStore = useStakingRewardsStore();
const route = useRoute();
const selectedChain: Ref<Chain | undefined> = ref(undefined);
rewardsStore.chain$.pipe(take(1)).subscribe((c) => (selectedChain.value = c));

const jobs: Ref<any[]> = ref([]);

const jobsSubscription = rewardsStore.jobs$
  .pipe(map((jobs : any[]) => {
    const filtered = jobs.filter(j => { return j.wallet === route.params.wallet && j.timeframe === Number(route.params.timeframe) && j.currency == route.params.currency })
    return filtered
  })).subscribe((j) => {
  jobs.value = j;
});

onUnmounted(() => {
  if (jobsSubscription) {
    jobsSubscription.unsubscribe();
  }
});

const columns = ref([
  { name: 'status', align: 'left', label: 'Status', field: 'status' },
  { name: 'wallet', align: 'left', label: 'Wallet', field: 'wallet' },
  { name: 'blockchain', align: 'left', label: 'Blockchain', field: 'blockchain' },
  { name: 'timeframe', label: 'Year', field: 'timeframe' },
  { name: 'currency', label: 'Currency', field: 'currency' },
  { name: 'actions', label: 'Actions' }
])
</script>
