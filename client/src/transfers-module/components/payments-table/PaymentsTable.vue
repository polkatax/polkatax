<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="block"
      no-data-label="No payments found"
      :pagination="initialPagination"
      selection="multiple"
      v-model:selected="excludedPayments"
    >
      <template v-slot:header-selection>
        Excluded
        <q-toggle
          :model-value="allExcluded"
          @update:model-value="toggleAllExcludedPayments"
        />
      </template>

      <template v-slot:body-selection="scope">
        <q-toggle
          :model-value="isExcluded(scope.row.hash)"
          @update:model-value="() => toggleExcludedPayment(scope.row.hash)"
        />
      </template>

      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Transfers ({{ (selectedToken || '').toUpperCase() }} on
          {{ paymentPortfolio?.chain }})</span
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

      <template v-slot:body-cell="props">
        <q-td
          :props="props"
          :style="{ color: props.row.amount < 0 ? 'red' : undefined }"
          v-if="props.col.name !== 'tx'"
        >
          {{ props.value }}
        </q-td>
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
  formatValue,
  tokenAmountFormatter,
} from '../../../shared-module/util/number-formatters';
import { usePaymentsStore } from '../../store/payments.store';
import { getTxLink } from '../../../shared-module/util/tx-link';
import {
  formatDate,
  formatDateUTC,
} from '../../../shared-module/util/date-utils';
import {
  PaymentPortfolio,
  TokenPayment,
  TokenPaymentsData,
} from '../../model/payments';

const store = usePaymentsStore();
const sortAmounts = (value1: number, value2: number) =>
  Math.abs(value1) > Math.abs(value2) ? 1 : -1;

const paymentsCurrentToken: Ref<TokenPaymentsData | undefined> = ref(undefined);
const excludedPayments: Ref<{ hash: string }[]> = ref([]);
const selectedToken: Ref<string | undefined> = ref(undefined);
const paymentPortfolio: Ref<PaymentPortfolio | undefined> = ref(undefined);

const subscription = store.paymentsCurrentToken$.subscribe((payments) => {
  paymentsCurrentToken.value = payments;
});

const excludedPaymentsSub = store.excludedPayments$.subscribe((excluded) => {
  excludedPayments.value = excluded;
});

const selectedTokenSub = store.selectedToken$.subscribe((token) => {
  selectedToken.value = token;
});

const paymentPortfolioSub = store.paymentList$.subscribe((portfolioReq) => {
  paymentPortfolio.value = portfolioReq.data;
});

const allExcluded = computed(() => {
  return (
    paymentsCurrentToken.value &&
    excludedPayments.value.length === paymentsCurrentToken.value.payments.length
  );
});

function isExcluded(hash: string) {
  return (
    hash && excludedPayments.value.filter((p) => p.hash === hash).length > 0
  );
}

onUnmounted(() => {
  subscription.unsubscribe();
  excludedPaymentsSub.unsubscribe();
  selectedTokenSub.unsubscribe();
  paymentPortfolioSub.unsubscribe();
});

const columns = computed(() => [
  {
    name: 'Date',
    required: true,
    label: 'Date',
    align: 'left',
    field: (row: TokenPayment) => formatDate(row.timestamp * 1000),
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
    name: 'transfer',
    align: 'right',
    label: `Amount (${(selectedToken.value || '').toUpperCase()})`,
    field: 'amount',
    format: (num: number) => amountFormatter.value.format(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'transferFrom',
    align: 'center',
    label: 'from',
    field: 'from',
    format: (value: string) => value.substring(0, 10) + '...',
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'transferTo',
    align: 'center',
    label: 'to',
    field: 'to',
    format: (value: string) => value.substring(0, 10) + '...',
    sortable: true,
  },
  {
    name: 'price',
    align: 'right',
    label: `Price (${paymentPortfolio.value?.currency})`,
    field: 'price',
    format: (num: number) => formatValue(num),
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Value (${paymentPortfolio.value?.currency})`,
    field: 'fiatValue',
    format: (num: number) => formatValue(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'valueNow',
    align: 'right',
    label: `Value now (${paymentPortfolio.value?.currency})`,
    field: 'valueNow',
    format: (num: number) => formatValue(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'label',
    align: 'left',
    label: 'Contract/Function',
    field: 'label',
    sortable: false,
  },
  {
    name: 'tx',
    align: 'center',
    label: 'Transaction',
    field: 'hash',
    format: (hash: string) =>
      getTxLink(hash, paymentPortfolio.value?.chain || ''),
    sortable: false,
  },
]);

const rows = computed(() => {
  return paymentsCurrentToken.value?.payments || [];
});

function toggleAllExcludedPayments() {
  store.toggleAllExcludedPayments();
}

function toggleExcludedPayment(hash: string) {
  store.toggleExcludedPayment(hash);
}

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportKoinlyCsv() {
  const parser = new Parser();
  const excludedHashes = excludedPayments.value.map((e) => e.hash);
  const values = [...(paymentsCurrentToken.value?.payments || [])]
    .filter((v) => excludedHashes.indexOf(v.hash ?? '') === -1)
    .map((v) => {
      return {
        Date: formatDateUTC(v.timestamp * 1000),
        Amount: v.amount,
        Currency: selectedToken.value,
        TxHash: v.hash,
      };
    });
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'payments.csv');
}

function exportCsv() {
  const parser = new Parser();
  const excludedHashes = excludedPayments.value.map((e) => e.hash);
  const values = [...(paymentsCurrentToken.value?.payments || [])]
    .filter((v) => excludedHashes.indexOf(v.hash ?? '') === -1)
    .map((v) => {
      return {
        ...v,
        date: formatDateUTC(v.timestamp * 1000),
      };
    });
  values[0] = {
    Token: selectedToken.value,
    Chain: paymentPortfolio.value?.chain,
    Currency: paymentPortfolio.value?.currency,
    'Wallet address': paymentPortfolio.value?.address,
    ...values[0],
    totalAmount: paymentsCurrentToken.value?.summary!.amount,
    totalValue: paymentsCurrentToken.value?.summary!.fiatValue,
    totalValueNow: paymentsCurrentToken.value?.summary?.valueNow,
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'payments.csv');
}

function exportJson() {
  const excludedHashes = excludedPayments.value.map((e) => e.hash);
  const filteredPayments = paymentsCurrentToken
    .value!.payments.filter((v) => excludedHashes.indexOf(v.hash || '') === -1)
    .map((p: TokenPayment) => {
      return {
        ...p,
        date: formatDateUTC(p.timestamp * 1000),
      };
    });

  saveAs(
    new Blob(
      [
        JSON.stringify({
          ...(paymentsCurrentToken.value || {}),
          values: filteredPayments,
        }),
      ],
      {
        type: 'text/plain;charset=utf-8',
      }
    ),
    'payments.json'
  );
}

const amountFormatter = computed(() => tokenAmountFormatter(4));
</script>
