<template>
  <div class="q-pt-md q-pb-xl q-px-md row items-center">
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
      <template
        v-if="
          isValidAddress(props.modelValue) && !isEvmAddress && !isGenericAddress
        "
        v-slot:hint
      >
        <div
          class="text-caption text-grey-7"
          style="
            white-space: nowrap;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
          "
        >
          Hint: You entered a parachain-specific address.<br />
          This address maps to the generic address
          {{
            convertToGenericAddress(props.modelValue.trim()).substring(0, 4)
          }}.... All results are shown using the canonical address format.
        </div>
      </template>
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
import { computed } from 'vue';
import { isValidAddress, isValidEvmAddress } from '../../util/is-valid-address';
import {
  isGenericSubstrateAddress,
  convertToGenericAddress,
} from '../../util/convert-to-generic-address';

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
  return isValidAddress(adr.trim());
}

const isGenericAddress = computed(() => {
  return isGenericSubstrateAddress(props.modelValue.trim());
});

const isEvmAddress = computed(() => {
  return isValidEvmAddress(props.modelValue.trim());
});
</script>
<style lang="css" scoped>
.address-input {
  max-width: 250px;
  min-width: 250px;
  padding-bottom: 0;
}
</style>
