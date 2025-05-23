<template>
  <div class="q-pa-md flex justify-center relative-position">
    <q-select
      filled
      @filter="filterFn"
      use-input
      v-model="model"
      :label="label"
      :options="filteredPools"
      option-value="pool_id"
      option-label="pool_id"
      color="teal"
      @update:model-value="onNewValueSelected"
      clearable
      behavior="dialog"
      :disable="nominationPoolsDisabled || nominationPools.length === 0"
      options-selected-class="text-deep-orange"
      style="max-width: 100%"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>
              {{ scope.opt.metadata }} ({{ scope.opt.pool_id }})
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <q-tooltip
      v-if="nominationPoolsDisabled"
      anchor="top middle"
      self="bottom middle"
      :offset="[10, 10]"
      class="text-body2"
    >
      Nomination pools are only supported for KSM and DOT
    </q-tooltip>
    <div
      class="absolute full-height flex justify-center items-center"
      style="top: 0"
      v-if="showLoading"
    >
      <q-spinner color="primary" size="3em" :thickness="2" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, Ref } from 'vue';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { NominationPool } from '../../model/nomination-pool';

const rewardsStore = useStakingRewardsStore();
const nominationPools: Ref<NominationPool[]> = ref([]);
const model: Ref<NominationPool | undefined> = ref(undefined);
const showLoading = ref(false);
const nominationPoolsDisabled: Ref<boolean> = ref(false);
const filteredPools = ref(nominationPools.value);

const chainSubscription = rewardsStore.chain$.subscribe((c) => {
  nominationPoolsDisabled.value =
    !c || (c.domain !== 'kusama' && c.domain !== 'polkadot');
});

const nominationPoolSubscription = rewardsStore.nominationPools$.subscribe(
  (dataRequest) => {
    if (!dataRequest.pending) {
      showLoading.value = false;
    } else {
      showLoading.value = true;
    }
    nominationPools.value = dataRequest.data || [];
    filteredPools.value = nominationPools.value;
    model.value = undefined;
  }
);

onUnmounted(() => {
  chainSubscription.unsubscribe();
  nominationPoolSubscription.unsubscribe();
});

function onNewValueSelected(value: NominationPool | undefined) {
  rewardsStore.nominationPoolId = value?.pool_id;
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredPools.value = nominationPools.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredPools.value = nominationPools.value.filter(
      (v: NominationPool) =>
        v.metadata.toLowerCase().indexOf(needle) > -1 ||
        v.pool_id === Number(needle)
    );
  });
}

const label = computed(() => {
  if (model.value) {
    return String(model.value?.metadata);
  } else {
    return 'Nomination Pool';
  }
});
</script>
<style scoped>
@media (max-width: 1439px) {
  label {
    width: 100%;
  }
}
</style>
