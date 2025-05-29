import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'wallets',
      },
      {
        path: 'wallets',
        component: () =>
          import('src/wallets-module/components/WalletsDashboard.vue'),
      },
      {
        path: 'blockchains/:wallet/:timeframe/:currency',
        component: () =>
          import('src/blockchains-module/components/BlockchainList.vue'),
      },
      {
        path: 'taxable-events/:wallet/:blockchain/:timeframe/:currency',
        component: () =>
          import(
            'src/taxable-events-module/components/TaxableEventsTabView.vue'
          ),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () =>
      import('src/shared-module/components/error/ErrorNotFound.vue'),
  },
];

export default routes;
