<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="block"
      no-data-label="No trades found"
      :pagination="initialPagination"
    >
      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Trades on {{ swaps?.chain }}</span
        >
        <q-space />

        <q-btn color="primary" class="q-mr-sm" @click="exportCsv"
          >Export CSV
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportKoinlyCsv"
          >Koinly export
        </q-btn>
        <q-btn color="primary" @click="exportJson">Export JSON</q-btn>
      </template>

      <template v-slot:body-cell-tokensbought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-amountbought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-pricebought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-valuebought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-tokenssold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-amountsold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-valuesold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-pricesold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-tx="props">
        <q-td v-if="props.col.name === 'tx'" class="text-center">
          <a :href="props.value" target="_blank"
            ><img src="img/external_link.png"
          /></a>
        </q-td>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { saveAs } from 'file-saver';
import { Parser } from '@json2csv/plainjs';
import {
  formatTokenAmount,
  formatValue,
} from '../../../shared-module/util/number-formatters';
import { usePaymentsStore } from '../../../transfers-module/store/payments.store';
import {
  SaleOrPurchase,
  Swap,
  SwapList,
  TradingSummary,
} from '../../../swap-module/model/swaps';
import {
  formatDate,
  formatDateUTC,
} from '../../../shared-module/util/date-utils';
import { getTxLink } from '../../../shared-module/util/tx-link';

const store = usePaymentsStore();
const swaps: Ref<SwapList | undefined> = ref(undefined);
const swapSummary: Ref<TradingSummary[]> = ref([]);
const filteredSwaps: Ref<Swap[]> = ref([]);

const swapListSub = store.swaps$.subscribe((swapListReq) => {
  swaps.value = swapListReq.data;
});

const swapSummarySub = store.swapSummary$.subscribe((tradingSummary) => {
  swapSummary.value = tradingSummary;
});

const filteredSwapSub = store.filteredSwaps$.subscribe((swaps) => {
  filteredSwaps.value = swaps;
});

onUnmounted(() => {
  swapListSub.unsubscribe();
  swapSummarySub.unsubscribe();
  filteredSwapSub.unsubscribe();
});

const filterSwappedTokens = (transfers: SaleOrPurchase[], sales = true) =>
  transfers.filter((t) => (sales ? -1 : 1) * t.amount > 0);

const getSales = (tokens: SaleOrPurchase[]) =>
  filterSwappedTokens(tokens, true);
const getBuys = (tokens: SaleOrPurchase[]) =>
  filterSwappedTokens(tokens, false);

const calculateSwapValue = (transfers: SaleOrPurchase[]) => {
  let value = getSales(transfers).reduce(
    (acc, transfer) => acc + (transfer.fiatValue || NaN),
    0
  );
  if (isNaN(value)) {
    value = getBuys(transfers).reduce(
      (acc, transfer) => acc + (transfer.fiatValue || NaN),
      0
    );
  }
  return Math.abs(value);
};

const sortAmounts = (value1: number[], value2: number[]) =>
  (value1[0] || 0) > (value2[0] || 0) ? 1 : -1;
const sortLabels = (value1: string[], value2: string[]) =>
  (value1[0] || '') > (value2[0] || '') ? 1 : -1;

const columns = computed(() => [
  {
    name: 'date',
    label: 'Date',
    align: 'left',
    field: (row: Swap) => formatDate(row.timestamp * 1000),
    sortable: true,
  },
  {
    name: 'block',
    align: 'right',
    label: 'Block',
    field: 'block',
    sortable: true,
  },
  {
    name: 'tokenssold',
    align: 'right',
    label: 'Token sold',
    field: 'tokensSold',
    sort: sortLabels,
    sortable: true,
  },
  {
    name: 'amountsold',
    align: 'right',
    label: 'Amount',
    field: 'amountSold',
    format: (amounts: number[]) =>
      amounts.map((amount) => formatTokenAmount(Math.abs(amount), 4)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'pricesold',
    align: 'right',
    label: `Price (${swaps.value?.currency})`,
    field: 'priceSold',
    format: (amounts: number[]) => amounts.map((amount) => formatValue(amount)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'tokensbought',
    align: 'right',
    label: 'Token bought',
    field: 'tokensBought',
    sort: sortLabels,
    sortable: true,
  },
  {
    name: 'amountbought',
    align: 'right',
    label: 'Amount',
    field: 'amountBought',
    format: (value: number[]) =>
      value.map((value) => formatTokenAmount(value, 4)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'pricebought',
    align: 'right',
    label: `Price (${swaps.value?.currency})`,
    format: (value: number[]) => value.map((value) => formatValue(value)),
    sort: sortAmounts,
    field: 'priceBought',
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Transaction Value (${swaps.value?.currency})`,
    format: (swapValue: number) => formatValue(swapValue),
    field: 'swapValue',
    sortable: true,
  },
  {
    name: 'label',
    required: true,
    align: 'left',
    label: 'Contract/Function',
    field: 'label',
    sortable: true,
  },
  {
    name: 'tx',
    align: 'center',
    label: 'Transaction',
    field: 'hash',
    format: (hash: string) => getTxLink(hash, swaps.value?.chain || ''),
    sortable: false,
  },
]);

const rows = computed(() => {
  const flattened: any[] = [];
  filteredSwaps.value.forEach((swap: Swap) => {
    flattened.push({
      block: swap.block,
      timestamp: swap.timestamp,
      contract: swap.contract || '',
      label: swap.label,
      hash: swap.hash,
      tokensSold: getSales(swap.transfers).map((t) => t.symbol),
      amountSold: getSales(swap.transfers).map((transfer) => transfer.amount),
      priceSold: getSales(swap.transfers).map((transfer) => transfer.price),
      tokensBought: getBuys(swap.transfers).map((t) => t.symbol),
      amountBought: getBuys(swap.transfers).map((t) => t.amount),
      priceBought: getBuys(swap.transfers).map((t) => t.price),
      swapValue: calculateSwapValue(swap.transfers),
    });
  });
  return flattened;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function extractRowForCSVExport(swap: Swap) {
  const firstTokenPair: any = {
    ...swap,
    timestamp: formatDateUTC(swap.timestamp * 1000),
  };
  const otherTokens: any = [];
  let temp: any = {};
  swap.transfers.forEach((t) => {
    if (t.amount < 0) {
      if (!firstTokenPair.sold_token) {
        firstTokenPair.sold_token = t.symbol;
        firstTokenPair.sold_amount = t.amount;
        firstTokenPair.sale_price = t.price;
        firstTokenPair.sale_value = t.fiatValue;
      } else {
        if (temp.sold_token) {
          otherTokens.push(temp);
          temp = {};
        }
        temp.sold_token = t.symbol;
        temp.sold_amount = t.amount;
        temp.sale_price = t.price;
        temp.sale_value = t.fiatValue;
      }
    }

    if (t.amount > 0) {
      if (!firstTokenPair.bought_token) {
        firstTokenPair.bought_token = t.symbol;
        firstTokenPair.bought_amount = t.amount;
        firstTokenPair.purchase_price = t.price;
        firstTokenPair.purchase_value = t.fiatValue;
      } else {
        if (temp.bought_token) {
          otherTokens.push(temp);
          temp = {};
        }
        temp.bought_token = t.symbol;
        temp.bought_amount = t.amount;
        temp.purchase_price = t.price;
        temp.purchase_value = t.fiatValue;
      }
    }
  });
  if (temp.bought_token || temp.sold_token) {
    otherTokens.push(temp);
  }
  delete firstTokenPair.tokens;
  return [firstTokenPair, otherTokens];
}

function exportCsv() {
  const parser = new Parser();
  const flattened: any[] = [];
  filteredSwaps.value.forEach((swap: Swap) => {
    const [firstTokenPair, otherTokens] = extractRowForCSVExport(swap);
    flattened.push(firstTokenPair);
    otherTokens.forEach((t: any) => flattened.push(t));
  });
  const values = [...flattened];
  values[0] = {
    Chain: swaps.value?.chain,
    Currency: swaps.value?.currency,
    'Wallet address': swaps.value?.address,
    ...values[0],
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'swaps.csv');
}

function exportKoinlyCsv() {
  const parser = new Parser();
  const flattened: any[] = [];
  filteredSwaps.value.forEach((swap: Swap) => {
    const [firstTokenPair, otherTokens] = extractRowForCSVExport(swap);
    flattened.push({
      Date: firstTokenPair.date,
      'Sent Amount': firstTokenPair.sold_amount,
      'Sent Currency': firstTokenPair.sold_token,
      'Received Amount': firstTokenPair.bought_amount,
      'Received Currency': firstTokenPair.bought_token,
      TxHash: firstTokenPair.hash,
    });
    otherTokens.forEach((t: any) =>
      flattened.push({
        'Sent Amount': t.sold_amount,
        'Sent Currency': t.sold_token,
        'Received Amount': t.bought_amount,
        'Received Currency': t.bought_token,
      })
    );
  });
  const values = [...flattened];
  values[0] = {
    ...values[0],
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'swaps.csv');
}

function exportJson() {
  const swapsWithDateCol = filteredSwaps.value.map((s: Swap) => {
    return {
      ...s,
      timestamp: formatDateUTC(s.timestamp * 1000),
    };
  });
  saveAs(
    new Blob(
      [
        JSON.stringify({
          ...(swaps.value || {}),
          swaps: swapsWithDateCol,
        }),
      ],
      {
        type: 'text/plain;charset=utf-8',
      }
    ),
    'swaps.json'
  );
}
</script>
