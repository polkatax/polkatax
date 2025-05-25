<template>
  <div class="q-pa-md">
    <q-btn-dropdown color="primary" no-caps>
      <template v-slot:label>
        <span v-html="currency?.flag" />
        {{ currency?.name }}
      </template>
      <q-list>
        <q-item
          clickable
          v-close-popup
          @click="onNewValueSelected(currency)"
          v-for="currency of currencies"
          v-bind:key="currency.name"
        >
          <q-item-section>
            <q-item-label
              ><span v-html="currency.flag"></span>
              {{ currency.name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, Ref, ref } from 'vue';
import { Currency } from '../../../shared-module/model/currency';
import { currencyList } from '../../../shared-module/const/currencyList';
import { useSharedStore } from '../../store/shared.store';

const currencies = ref(currencyList);

const currency: Ref<Currency | undefined> = ref(undefined);
const store = useSharedStore();
const currencySubscription = store.currency$.subscribe((c) => {
  currency.value = currencies.value.find((temp) => temp.name === c);
});

onBeforeUnmount(() => {
  currencySubscription.unsubscribe();
});

function onNewValueSelected(value: Currency) {
  currency.value = value;
  store.selectCurrency(currency.value.name);
}
</script>
