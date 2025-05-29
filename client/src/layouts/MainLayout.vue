<script setup lang="ts">
import CurrencyDropdown from '../shared-module/components/currency-dropdown/CurrencyDropdown.vue';
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar class="flex justify-between">
        <q-toolbar-title
          style="flex: 0 0 auto"
          class="row-xl row-lg row-md column-sm column-xs q-pt-xs-sm q-pt-sm-sm q-pt-md-none q-pt-lg-none q-pt-xl-none items-center"
        >
          <div class="flex justify-center items-center">
            <img src="/white.ico" style="height: 3rem; margin: 5px" />
            <div class="q-ml-sm text-h5">PolkaTax</div>
          </div>
        </q-toolbar-title>
        <q-tabs align="left" class="desktop-only">
          <q-route-tab to="/wallets" label="Wallets" />
          <q-route-tab to="/blockchains" label="Blockchains" />
          <q-route-tab to="/taxable-events" label="Taxable events" />
        </q-tabs>
        <div>
          <CurrencyDropdown />
        </div>
      </q-toolbar>
      <q-tabs align="left" class="mobile-only2">
        <q-route-tab to="/staking-rewards" label="Staking rewards" />
        <q-route-tab to="/transfers" label="Transfers & Swaps" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="text-white">
      <q-toolbar>
        <div>
          Price data provided by <a href="https://coingecko.com">CoinGecko</a>
        </div>
        <q-toolbar-title class="flex justify-end"
          ><a href="https://github.com/loanMaster/polkatax" class="flex"
            ><img src="/img/github.png" /></a
        ></q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>
