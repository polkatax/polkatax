<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      :model-value="props.modelValue"
      label="Currency"
      :options="filteredCurrencies"
      option-value="name"
      color="teal"
      @update:model-value="onNewValueSelected"
      :options-html="true"
      options-selected-class="text-deep-orange"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label
              ><span v-html="scope.opt.flag" />
              {{ scope.opt.name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Currency } from '../../../shared-module/model/currency';
import { currencyList } from '../../../shared-module/const/currencyList';

const currencies = currencyList
  .sort((a, b) => (a.name > b.name ? 1 : -1))
  .map((c) => {
    return {
      ...c,
      label: `${c.flag} ${c.name}`,
    };
  });
const filteredCurrencies = ref(currencies);

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: String,
});

function onNewValueSelected(value: Currency) {
  emits('update:modelValue', value ? value.name : '');
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredCurrencies.value = currencies;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredCurrencies.value = currencies.filter(
      (v: Currency) => v.name.toLowerCase().indexOf(needle) > -1
    );
  });
}
</script>
