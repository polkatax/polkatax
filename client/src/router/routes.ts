import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'staking-rewards',
      },
      {
        path: 'staking-rewards',
        component: () =>
          import(
            'src/staking-rewards-module/components/StakingRewardsDashboard.vue'
          ),
      },
      {
        path: 'staking-rewards/:wallet/:timeframe/:currency',
        component: () =>
          import(
            'src/staking-rewards-module/components/StakingRewardsJobList.vue'
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
