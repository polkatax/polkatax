<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div
      class="q-my-md flex justify-between align-center items-center column-md row-lg row-xl column-xs column-sm"
    >
      <address-input v-model="store.address" />
      <div class="dropdown">
        <chain-dropdown
          v-model="selectedChain"
          :chains="chainList"
          @update:model-value="newChainSelected"
        />
      </div>
      <div class="dropdown">
        <date-picker
          v-model="store.startDate"
          label="Start date"
          @update:modelValue="validateDate"
        />
      </div>
      <div class="dropdown">
        <date-picker
          v-model="store.endDate"
          label="End date"
          @update:modelValue="validateDate"
        />
        <div
          :style="{ opacity: dateValidationError ? 1 : 0 }"
          style="color: red; margin-top: -12px; position: absolute"
          class="q-ml-md q-field--error"
        >
          ⓘ {{ dateValidationError }}
        </div>
      </div>
      <q-btn
        color="primary"
        label="Submit"
        @click="fetchRewards"
        :disable="isDisabled"
      />
    </div>
    <q-tabs
      v-model="tab"
      dense
      align="center"
      class="bg-primary text-white shadow-2"
      :breakpoint="0"
    >
      <q-tab name="payments" label="Transfers" />
      <q-tab name="swaps" label="Swaps" />
    </q-tabs>
    <div>
      <token-transfers v-if="paymentList !== undefined && tab === 'payments'" />
      <token-swaps v-if="paymentList !== undefined && tab === 'swaps'" />
      <div v-if="paymentList === undefined" class="q-my-xl">
        <div class="text-h6 text-center">
          ⚠ This is an Alpha version and subject to change ⚠
        </div>
        <div class="text-h6 text-center">
          Export your transfers and swaps as CSV or JSON. <br />
          This information can be useful for taxation of air drops, LP rewards,
          trades and other payments.
        </div>
        <div class="text-h6 text-center q-mt-md">
          Polkadot SDK chains, Ethereum chains (L1/L2) and fiat currencies are
          supported.
        </div>
        <div class="text-h6 text-center">
          Select a network, a fiat currency, a time frame and enter your wallet
          address. Then press submit.
        </div>
        <div class="text-center q-my-md">
          This software comes without warranty. Please verify the exported
          results.
        </div>
        <div class="q-mx-auto text-center">
          <img :src="meme" style="max-width: 40%" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AddressInput from '../../shared-module/components/address-input/AddressInput.vue';
import ChainDropdown from '../../shared-module/components/chain-dropdown/ChainDropdown.vue';
import DatePicker from '../../shared-module/components/date-picker/DatePicker.vue';
import TokenTransfers from './TokenTransfers.vue';
import TokenSwaps from '../../swap-module/components/TokenSwaps.vue';

import { computed, onUnmounted, Ref, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import { usePaymentsStore } from '../store/payments.store';
import { PaymentPortfolio } from '../model/payments';
import { Chain } from '../../shared-module/model/chain';
import { take } from 'rxjs';
const $q = useQuasar();

const store = usePaymentsStore();
const tab = ref('payments');
const dateValidationError = ref('');

const paymentList: Ref<PaymentPortfolio | undefined> = ref(undefined);
const chainList: Ref<Chain[]> = ref([]);
const selectedChain: Ref<Chain | undefined> = ref(undefined);
store.chain$.pipe(take(1)).subscribe((c) => (selectedChain.value = c));

const chainSubscription = store.chainList$.subscribe((chains) => {
  chainList.value = chains;
});

const paymentSubscription = store.paymentList$.subscribe(
  async (paymentsRequest) => {
    paymentList.value = paymentsRequest.data;
    if (paymentsRequest.pending) {
      $q.loading.show({
        message:
          'Fetching transfers. This may take a while. Please be patient...',
        html: true,
        boxClass: 'bg-grey-2 text-grey-9',
        spinnerColor: 'primary',
      });
    } else if (paymentsRequest.error) {
      $q.loading.hide();
      const error = paymentsRequest.error;
      const text = error.text ? await error.text() : undefined;
      const message =
        error.status && (error.status === 429 || error.status === 503)
          ? 'Too many requests. Please try again in some minutes'
          : text
          ? text
          : 'There was an error fetching your data. Please try again later';
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
  }
);

onUnmounted(() => {
  paymentSubscription.unsubscribe();
  chainSubscription.unsubscribe();
});

function fetchRewards() {
  if (!isDisabled.value) {
    store.fetchTransfers();
  }
}

function newChainSelected(chain: Chain) {
  store.selectChain(chain);
}

const isDisabled = computed(() => {
  return (
    store.address.trim() === '' ||
    !store.currency ||
    !selectedChain.value ||
    !validateDate()
  );
});

function validateDate() {
  const timeStamp = Date.now();
  dateValidationError.value = '';
  const maxDate = date.formatDate(timeStamp, 'YYYY/MM/DD');
  if (store.startDate <= maxDate && store.endDate <= maxDate) {
    if (store.startDate > store.endDate) {
      dateValidationError.value = 'End date must not be before start date';
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

const meme = ref('img/dollar-4932316_1280.jpg');
</script>
