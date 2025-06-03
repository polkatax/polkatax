<template>
  <div class="q-pa-md row items-center">
    <q-input
      class="address-input"
      filled
      no-error-icon
      :model-value="props.modelValue"
      @update:model-value="onAddressChanged"
      label="Wallet address"
      data-testid="wallet-input"
      @keyup.enter="onEnterPressed"
      aria-describedby="wallet-info-tooltip"
      :rules="[
        (val) => !val || validateAddress(val) || 'Wallet address invalid',
      ]"
    >
      <template v-slot:after>
        <q-icon name="info" aria-describedby="wallet-info-tooltip">
          <q-tooltip
            anchor="top middle"
            self="bottom middle"
            :offset="[10, 10]"
            class="text-body2"
          >
            Copy the wallet address from your browser extension and paste it
            here
          </q-tooltip>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>
<script setup lang="ts">
import 'vue';
import { isValidAddress } from '../../../wallets-module/util/is-valid-address';

const emits = defineEmits(['update:modelValue', 'enter-pressed']);

const props = defineProps({
  modelValue: String,
});

function onAddressChanged(value: string | number | null) {
  emits('update:modelValue', value ? String(value) : undefined);
}

function onEnterPressed() {
  emits('enter-pressed');
}

function validateAddress(adr: string) {
  return isValidAddress(adr);
}
</script>
<style lang="css" scoped>
.address-input {
  max-width: 250px;
  min-width: 250px;
  padding-bottom: 0;
}
</style>
