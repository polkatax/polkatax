<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div
      class="q-my-md flex justify-center align-center items-center row-md row-lg row-xl column-xs row-sm"
    >
    <address-input
        v-model="rewardsStore.address"
        @enter-pressed="startSyncing"
      />
      <time-frame-dropdown v-model="rewardsStore.timeFrame" />
      <div>
        <currency-dropdown v-model="rewardsStore.currency" />
      </div>
      <q-btn
        color="primary"
        label="Submit"
        data-testid="submit"
        @click="startSyncing"
        :disable="isDisabled"
      />
    </div>
    <div class="table q-my-md" v-if="jobs?.length > 0">
        <q-list bordered class="rounded-borders" style="max-width: 600px; margin: auto">
          <q-item v-for="job in jobs" v-bind:key="job">
            <q-item-section side>
              <q-icon :name="matSync" size="lg" class="spinner" v-if="job.status === 'pending'"/>
              <q-icon :name="matSync" size="lg" class="spinner fast" v-if="job.status === 'in_progress'"/>
              <q-icon :name="matError" size="lg" v-if="job.status === 'error'" color="red"/>
              <q-icon :name="matOfflinePin" size="lg" v-if="job.status === 'done'"/>
            </q-item-section>

            <q-item-section>
              <q-item-label class="q-mt-sm">{{ job.blockchain.toUpperCase() }}</q-item-label>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                <span class="text-weight-medium">200 KSM</span>
              </q-item-label>
            </q-item-section>

            <q-item-section top side>
              <div class="text-grey-8 q-gutter-xs">
                <q-btn class="gt-xs" size="12px" flat dense round icon="picture_as_pdf" />
                <q-btn class="gt-xs" size="12px" flat dense round icon="view_list" />
                <q-btn class="gt-xs" size="12px" flat dense round icon="arrow_forward" />
              </div>
            </q-item-section>
          </q-item>
      </q-list>

    </div>
    <div v-if="!jobs || jobs.length === 0" class="q-my-xl">
      <div class="text-h6 text-center">
        Export your staking rewards as CSV or JSON
      </div>
      <div class="text-h6 text-center q-mt-md">
        A wide range of substrate chains and fiat currencies are supported.
      </div>
      <div class="text-h6 text-center">
        Select a a fiat currency, a time frame and enter your wallet
        address. Then press submit.
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
import { matSync, matOfflinePin, matError, matHourglassEmpty } from '@quasar/extras/material-icons'
import AddressInput from '../../shared-module/components/address-input/AddressInput.vue';
import CurrencyDropdown from '../../shared-module/components/currency-dropdown/CurrencyDropdown.vue';
import TimeFrameDropdown from '../../shared-module/components/time-frame-dropdown/TimeFrameDropdown.vue';
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { Rewards } from '../model/rewards';
import { Chain } from '../../shared-module/model/chain';
import { take } from 'rxjs';
const $q = useQuasar();

const rewardsStore = useStakingRewardsStore();

const rewards: Ref<Rewards | undefined> = ref(undefined);
const selectedChain: Ref<Chain | undefined> = ref(undefined);
rewardsStore.chain$.pipe(take(1)).subscribe((c) => (selectedChain.value = c));

const jobs: Ref<any[]> = ref([])

const jobsSubscription = rewardsStore.jobs$.subscribe(j => {
  jobs.value = j
  console.log("new jobs!!!")
})

// jobs.value = [{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"peaq","type":"staking_rewards","timeframe":2024,"status":"in_progress","lastModified":1748094321365,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"krest","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"zeitgeist","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"vara","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"stafi","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"shiden","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"shibuya","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"sora","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"robonomics-freemium","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"polymesh","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"polkadot","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"pendulum","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"mythos","type":"staking_rewards","timeframe":2024,"status":"in_progress","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"moonriver","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"moonbeam","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"manta","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"mangatax","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"kusama","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"spiritnet","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"heima","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"gasp","type":"staking_rewards","timeframe":2024,"status":"done","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"enjin","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"matrix","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"energywebx","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"dock","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"dbc","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"darwinia","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"dancebox","type":"staking_rewards","timeframe":2024,"status":"error","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"crust","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"creditcoin","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"clover","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"calamari","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"bifrost-kusama","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"bifrost","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"avail","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"astar","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"},{"wallet":"5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7","blockchain":"alephzero","type":"staking_rewards","timeframe":2024,"status":"pending","lastModified":1748094321367,"currency":"USD","timeZone":"Europe/Rome"}]

const rewardsSubscription = rewardsStore.rewards$.subscribe(async (r) => {
  rewards.value = r.data;
  if (r.pending) {
    $q.loading.show({
      message:
        'Fetching staking rewards. This may take a while. Please be patient...',
      html: true,
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'primary',
    });
  } else if (r.error) {
    $q.loading.hide();
    const error = r.error;
    const text = error.text ? await error.text() : undefined;
    const message =
      r.error.status && (error.status === 429 || error.status === 503)
        ? 'Too many requests. Please try again in some minutes'
        : text ||
          'There was an error fetching your data. Please try again later';
    $q.dialog({
      title:
        error.status && error.status === 429
          ? 'Request limit exceeded'
          : error.status && error.status === 503
          ? 'Server overloaded'
          : 'An error occurred',
      message,
      persistent: true,
    });
  } else {
    $q.loading.hide();
  }
});

onUnmounted(() => {
  rewardsSubscription.unsubscribe();
  jobsSubscription.unsubscribe();
});

function startSyncing() {
  if (!isDisabled.value) {
    rewardsStore.sync();
  }
}

const isDisabled = computed(() => {
  return (
    rewardsStore.address.trim() === '' ||
    !rewardsStore.currency ||
    !selectedChain.value
  );
});

const meme = ref('img/dollar-4932316_1280.jpg');
</script>

<style>
.spinner {
  animation: spin 2s linear infinite;
  display: inline-block;
  transition: 1s all;
}
.spinner.fast {
  animation: spin 0.65s linear infinite;
}

@keyframes spin {
  to { transform: rotate(-360deg); }
}
</style>