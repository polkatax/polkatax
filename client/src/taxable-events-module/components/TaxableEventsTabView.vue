<template>
  <q-tabs
    v-model="tab"
    dense
    align="justify"
    class="bg-primary text-white shadow-2 q-pt-sm"
    :breakpoint="0"
  >
    <q-tab name="mails" label="Staking rewards" />
  </q-tabs>

  <div>
    <StakingRewards />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import StakingRewards from './staking-rewards/StakingRewards.vue';

const tab = ref('mails');
</script>
