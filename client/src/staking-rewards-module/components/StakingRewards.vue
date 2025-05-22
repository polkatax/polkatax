<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div
      class="q-my-md flex justify-between align-center items-center column-md row-lg row-xl column-xs column-sm"
    >
      <div class="dropdown">
        <token-dropdown
          v-model="selectedChain"
          :chains="chainList"
          @update:model-value="newChainSelected"
        />
      </div>
      <div class="dropdown">
        <currency-dropdown v-model="rewardsStore.currency" />
      </div>
      <time-frame-dropdown v-model="rewardsStore.timeFrame" />
      <address-input
        v-model="rewardsStore.address"
        @enter-pressed="fetchRewards"
      />
      <q-btn
        color="primary"
        label="Submit"
        data-testid="submit"
        @click="fetchRewards"
        :disable="isDisabled"
      />
    </div>
    <div class="text-center q-my-xl" v-if="rewards">
      <reward-summary />
    </div>
    <div class="justify-around items-center column" v-if="rewards">
      <rewards-chart :currency="false" chartType="ColumnChart" />
      <rewards-chart :currency="false" chartType="LineChart" />
      <rewards-chart :currency="true" chartType="ColumnChart" />
      <rewards-chart :currency="true" chartType="LineChart" />
    </div>
    <div class="table q-my-md" v-if="rewards">
      <staking-rewards-table />
    </div>
    <div v-if="!rewards" class="q-my-xl">
      <div class="text-h6 text-center">
        Export your staking rewards as CSV or JSON
      </div>
      <div class="text-h6 text-center q-mt-md">
        A wide range of substrate chains and fiat currencies are supported.
      </div>
      <div class="text-h6 text-center">
        Select a network, a fiat currency, a time frame and enter your wallet
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
import TokenDropdown from './token-dropdown/TokenDropdown.vue';
import AddressInput from '../../shared-module/components/address-input/AddressInput.vue';
import RewardsChart from './rewards-chart/RewardsChart.vue';
import CurrencyDropdown from '../../shared-module/components/currency-dropdown/CurrencyDropdown.vue';
import StakingRewardsTable from './staking-rewards-table/StakingRewardsTable.vue';
import TimeFrameDropdown from '../../shared-module/components/time-frame-dropdown/TimeFrameDropdown.vue';
import RewardSummary from './reward-summary/RewardSummary.vue';
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useStakingRewardsStore } from '../store/staking-rewards.store';
import { Rewards } from '../model/rewards';
import { Chain } from '../../shared-module/model/chain';
import { take } from 'rxjs';
const $q = useQuasar();

const rewardsStore = useStakingRewardsStore();

const rewards: Ref<Rewards | undefined> = ref(undefined);
const chainList: Ref<Chain[]> = ref([]);
const selectedChain: Ref<Chain | undefined> = ref(undefined);
rewardsStore.chain$.pipe(take(1)).subscribe((c) => (selectedChain.value = c));

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

const chainListSubscription = rewardsStore.chainList$.subscribe(
  (chainsList) => {
    chainList.value = chainsList.chains.sort((a: Chain, b: Chain) =>
      a.label > b.label ? 1 : -1
    );
  }
);

onUnmounted(() => {
  rewardsSubscription.unsubscribe();
  chainListSubscription.unsubscribe();
});

function fetchRewards() {
  if (!isDisabled.value) {
    rewardsStore.fetchRewards();
  }
}

function newChainSelected(chain: Chain) {
  rewardsStore.selectChain(chain);
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
