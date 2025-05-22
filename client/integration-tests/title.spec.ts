import { test, expect } from '@playwright/test';
import { mockSubscanChainList } from './util/mock-subscan-chain-list';

test('has title', async ({ page }) => {
  await mockSubscanChainList(page);
  await page.goto('http://localhost:9000');
  await expect(page).toHaveTitle('PolkaTax');
});
