<template>
  <q-page class="q-px-sm q-mx-auto content margin-auto">
    <div
      class="q-my-md flex justify-center align-center items-center row-md row-lg row-xl column-xs row-sm"
    >
      <address-input
        v-model="rewardsStore.address"
        @enter-pressed="startSyncing"
      />
      <time-frame-dropdown v-model="rewardsStore.timeFrame" />
      <q-btn
        color="primary"
        label="Add"
        data-testid="submit"
        @click="startSyncing"
        :disable="isDisabled"
      />
    </div>
    <div class="table q-my-md flex justify-center" v-if="requests?.length > 0">
      <q-table
        :rows="requests"
        :columns="columns"
        row-key="name"
        :table-style="{ overflow: 'hidden' }"
        table-class="flex"
        class="content"
        hide-bottom>
          <template v-slot:body="props">
              <q-tr :props="props" style="cursor: pointer" @click="navigateToJob(props.row)">
                <q-td key="done" :props="props">
                  <q-icon
                    :name="matSync"
                    size="md"
                    class="spinner"
                    v-if="!props.row.done"
                  />
                  <q-icon
                    :name="matOfflinePin"
                    size="md"
                    v-if="props.row.done"
                  />
                </q-td>
              <q-td key="wallet" :props="props" style="overflow-wrap: anywhere!important">
                {{ props.row.wallet }}
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
            </q-tr>
        </template>
      </q-table>
    </div>
    <div v-if="!requests || requests.length === 0" class="q-my-xl">
      <div class="text-h6 text-center">
        Export your staking rewards as CSV or JSON
      </div>
      <div class="text-h6 text-center q-mt-md">
        A wide range of substrate chains and fiat currencies are supported.
      </div>
      <div class="text-h6 text-center">
        Select a a fiat currency, a time frame and enter your wallet address.
        Then press submit.
      </div>
      <div class="text-center q-my-md">
        This program returns the staking rewards earned as nominator. This
        software comes without warranty. Please verify the exported results
      </div>
      <div class="q-mx-auto text-center">
        <img :src="meme" style="max-width: 40%" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  matSync,
  matOfflinePin,
} from '@quasar/extras/material-icons';
import AddressInput from '../../shared-module/components/address-input/AddressInput.vue';
import TimeFrameDropdown from '../../shared-module/components/time-frame-dropdown/TimeFrameDropdown.vue';
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { useRouter } from 'vue-router';

const rewardsStore = useStakingRewardsStore();
const router = useRouter();

const requests: Ref<{ wallet: string, timeframe: number, currency: string, done: boolean }[]> = ref([]);

const jobsSubscription = rewardsStore.jobs$.subscribe((jobs) => {
  const r: any[] = [];
  jobs.forEach(j => {
    const existing = r.find(r => (r.wallet === j.wallet && r.timeframe === j.timeframe && r.currency === j.currency))
    if (!existing) {
      r.push({
        wallet: j.wallet,
        timeframe: j.timeframe,
        currency: j.currency,
        done: j.status === 'done' || j.status === 'error'
      })
    } else {
      existing.done = existing.done && (j.status === 'done' || j.status === 'error')
    }
  })
  requests.value = r
});

onUnmounted(() => {
  jobsSubscription.unsubscribe();
});

function startSyncing() {
  if (!isDisabled.value) {
    rewardsStore.sync();
  }
}

const isDisabled = computed(() => {
  return (
    rewardsStore.address.trim() === ''
  );
});

const meme = ref('img/dollar-4932316_1280.jpg');

const columns = ref([
  { name: 'done', align: 'left', label: 'Status', field: 'done' },
  { name: 'wallet', align: 'left', label: 'Wallet', field: 'wallet' },
  { name: 'timeframe', label: 'Year', field: 'timeframe' },
  { name: 'currency', label: 'Currency', field: 'currency' }
])

function navigateToJob(job: any) {
  router.push(`/staking-rewards/${job.wallet}/${job.timeframe}/${job.currency}`);
}
</script>
