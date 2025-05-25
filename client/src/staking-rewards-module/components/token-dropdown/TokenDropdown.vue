<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      :modelValue="props.modelValue"
      :label="props.modelValue ? props.modelValue.label : 'Blockchain'"
      :options="filteredChains"
      option-value="chain"
      option-label="token"
      color="teal"
      @update:model-value="onNewValueSelected"
      options-selected-class="text-deep-orange"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label
              >{{ scope.opt.label || scope.opt.domain }}
            </q-item-label>
            <q-item-label caption>{{ scope.opt.token }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { PropType, Ref, ref } from 'vue';
import { Chain } from '../../../shared-module/model/chain';

const filteredChains: Ref<Chain[]> = ref([]);
const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: Object as PropType<Chain>,
  chains: Array as PropType<Chain[]>,
});

function onNewValueSelected(value: Chain) {
  emits('update:modelValue', value);
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredChains.value = props.chains || [];
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredChains.value = (props.chains || []).filter(
      (v: Chain) =>
        v.label.toLowerCase().indexOf(needle) > -1 ||
        v.domain.toLowerCase().indexOf(needle) > -1 ||
        v.token.toLowerCase().indexOf(needle) > -1
    );
  });
}
</script>
