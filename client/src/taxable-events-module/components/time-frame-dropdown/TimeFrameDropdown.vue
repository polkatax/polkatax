<template>
  <q-btn-dropdown :label="selectedTimeFrame" push no-caps>
    <q-list>
      <q-item
        v-for="timeFrame in timeFrames"
        :key="timeFrame"
        :label="timeFrame"
        clickable
        v-close-popup
        @click="onListItemClick(timeFrame)"
      >
        <q-item-section>
          <q-item-label>{{ timeFrame }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

const emits = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: Number,
});

function onListItemClick(timeFrame: string | number) {
  emits('update:modelValue', Number(timeFrame));
}

const selectedTimeFrame = computed(() => {
  return props.modelValue;
});

const timeFrames = ref(
  [0, 1].map((offset) => new Date().getFullYear() - offset)
);
</script>
