import { test, Page, expect } from '@playwright/test';
import { mockSubscanChainList } from './util/mock-subscan-chain-list';
import { mockNominationPools } from './util/mock-nomination-pools';

const mockRewards = {
  values: [
    {
      block: '24084680',
      timestamp: 1735660422,
      amount: 9.9695478019,
      hash: '0x4595313dad194295ee45fb86b934323d3789db2c09793e0970597e0f57334c20',
      price: 6.642342862506173,
      fiatValue: 66.22115468436456,
    },
    {
      block: '24075647',
      timestamp: 1735606212,
      amount: 9.5471414129,
      hash: '0xbd342b699ab7d6f24bab39112acb2dc7866654ed2127efffe68b01892d10132c',
      price: 6.642342862506173,
      fiatValue: 63.415386621313424,
    },
    {
      block: '24055766',
      timestamp: 1735486878,
      amount: 10.3157327645,
      hash: '0x3a9e24bb726082f651a9168daf27a3393f023941fd75c80286ef923a769b60c4',
      price: 6.867609733029039,
      fiatValue: 70.84442673680675,
    },
    {
      block: '24055286',
      timestamp: 1735483998,
      amount: 10.7996012667,
      hash: '0x20f8c9ece95ce0c9581e153acaa2f8fd83e0fb6dc2b3a3c222f7ffafdbaf7fdd',
      price: 6.867609733029039,
      fiatValue: 74.16744677202166,
    },
    {
      block: '24041334',
      timestamp: 1735400250,
      amount: 10.8816476218,
      hash: '0xaf800fed140ceedc0ab72a0a24dd582df16da3489a871f60579d7ec058750122',
      price: 7.102445975088033,
      fiatValue: 77.28631435377967,
    },
  ],
  currentPrice: 4.55,
  priceEndDay: 6.642342862506173,
  token: 'DOT',
};

export const mockStakingRewardsResponse = async (page: Page) => {
  await page.route(
    'http://localhost:9000/api/staking-rewards/polkadot/2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83*',
    async (route) => {
      await route.fulfill({ json: mockRewards });
    }
  );
};

test('shows staking rewards', async ({ page }) => {
  await mockNominationPools(page);
  await mockSubscanChainList(page);
  await mockStakingRewardsResponse(page);
  await page.goto('http://localhost:9000');
  await page.fill(
    '[data-testid="wallet-input"]',
    '2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83'
  );
  await page.click('[data-testid="submit"]');
  await page.waitForSelector('.q-loading', {
    state: 'visible',
    timeout: 10000,
  });
  await page.waitForSelector('.q-loading', { state: 'hidden', timeout: 10000 });
  await expect(page.getByTestId('total-rewards')).toHaveText('51.5137 DOT');
  await expect(page.getByTestId('value-at-payout-time')).toHaveText('$351.93');
});
