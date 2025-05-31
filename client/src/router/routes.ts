import { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router';

const breadcrumbs = {
  Wallets: () => ({ label: 'Wallets', route: '/wallets' }),
  Blockchains: (route: RouteLocationNormalizedLoaded) => ({
    label: 'Blockchains',
    route: `/wallets/${route.params.wallet}/${route.params.currency}`,
  }),
  TaxableEvents: (route: RouteLocationNormalizedLoaded) => ({
    label: 'Taxable Events',
    route: `/wallets/${route.params.wallet}/${route.params.currency}/${route.params.blockchain}`,
  }),
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'wallets',
        meta: { breadcrumbs: [breadcrumbs.Wallets] },
      },
      {
        name: 'Wallets',
        path: 'wallets',
        component: () =>
          import('src/wallets-module/components/WalletsDashboard.vue'),
        meta: { breadcrumbs: [breadcrumbs.Wallets] },
      },
      {
        name: 'Blockchains',
        path: 'wallets/:wallet/:currency',
        component: () =>
          import('src/blockchains-module/components/BlockchainList.vue'),
        meta: {
          breadcrumbs: [breadcrumbs.Wallets, breadcrumbs.Blockchains],
          parent: () => '/wallets',
        },
      },
      {
        name: 'Taxable Events',
        path: 'wallets/:wallet/:currency/:blockchain',
        component: () =>
          import(
            'src/taxable-events-module/components/TaxableEventsTabView.vue'
          ),
        meta: {
          breadcrumbs: [
            breadcrumbs.Wallets,
            breadcrumbs.Blockchains,
            breadcrumbs.TaxableEvents,
          ],
          parent: (route: RouteLocationNormalizedLoaded) =>
            `/wallets/${route.params.wallet}/${route.params.currency}`,
        },
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
