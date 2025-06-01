<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar class="flex justify-between">
        <q-toolbar-title
          style="flex: 0 0 auto"
          class="row-xl row-lg row-md column-sm column-xs q-pt-xs-sm q-pt-sm-sm q-pt-md-none q-pt-lg-none q-pt-xl-none items-center"
        >
          <div class="flex justify-center items-center">
            <img src="/white.ico" class="header-logo" v-if="!parentRoute" />
            <q-btn
              v-if="parentRoute"
              outline
              color="white"
              label="Back"
              :to="parentRoute"
            />
            <div class="q-ml-sm text-h5">{{ route.name }}</div>
          </div>
        </q-toolbar-title>
        <q-tabs align="left" class="desktop-only">
          <q-route-tab to="/wallets" label="Wallets" />
          <q-route-tab to="/guide" label="Guide" />
        </q-tabs>
        <CurrencyDropdown />
      </q-toolbar>
      <div class="q-py-sm q-px-md">
        <BreadCrumbs />
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="showErrorDialog">
      <q-card>
        <q-card-section class="q-pt-none q-mt-md">
          {{ errorMsg }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-footer elevated class="text-white">
      <q-toolbar>
        <div>
          Price data provided by <a href="https://coingecko.com">CoinGecko</a>
        </div>
        <q-toolbar-title class="flex justify-end">
          <a href="https://github.com/loanMaster/polkatax" class="flex">
            <img src="/img/github.png" alt="GitHub repository" />
          </a>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import CurrencyDropdown from '../shared-module/components/currency-dropdown/CurrencyDropdown.vue';
import BreadCrumbs from '../shared-module/components/bread-crumbs/BreadCrumbs.vue';
import { useSharedStore } from '../shared-module/store/shared.store';
import { Subscription } from 'rxjs';
import { useRoute } from 'vue-router';

const route = useRoute();
const showErrorDialog = ref(false);
const errorMsg = ref('');

const subscription: Subscription =
  useSharedStore().webSocketResponseError$.subscribe(handleError);

function handleError(err: any) {
  console.error(JSON.stringify(err));
  switch (err.code) {
    case 429:
      errorMsg.value = 'Too many requests. Please try again later.';
      break;
    case 400:
      errorMsg.value = 'The data sent to the server is invalid.';
      break;
    default:
      errorMsg.value =
        'There was an error connecting to the server. Please try again later.';
  }
  showErrorDialog.value = true;
}

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

const parentRoute = computed(() => {
  const parent = route.meta.parent;
  return typeof parent === 'function' ? parent(route) : undefined;
});
</script>

<style scoped>
.header-logo {
  height: 2.25rem;
  margin: 5px;
}
</style>
