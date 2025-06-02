import { test, Page, expect } from '@playwright/test';
import { mockSubscanChainList } from './util/mock-subscan-chain-list';
import { WsWrapper } from './util/WsWrapper';

const mockRewards = {
  values: [
    {
      block: '24084680',
      timestamp: new Date().getTime(),
      amount: 9.9695478019,
      hash: '0x4595313dad194295ee45fb86b934323d3789db2c09793e0970597e0f57334c20',
      price: 6.642342862506173,
      fiatValue: 66.22115468436456,
    },
    {
      block: '24075647',
      timestamp: new Date().getTime(),
      amount: 9.5471414129,
      hash: '0xbd342b699ab7d6f24bab39112acb2dc7866654ed2127efffe68b01892d10132c',
      price: 6.642342862506173,
      fiatValue: 63.415386621313424,
    },
    {
      block: '24055766',
      timestamp: new Date().getTime(),
      amount: 10.3157327645,
      hash: '0x3a9e24bb726082f651a9168daf27a3393f023941fd75c80286ef923a769b60c4',
      price: 6.867609733029039,
      fiatValue: 70.84442673680675,
    },
    {
      block: '24055286',
      timestamp: new Date().getTime(),
      amount: 10.7996012667,
      hash: '0x20f8c9ece95ce0c9581e153acaa2f8fd83e0fb6dc2b3a3c222f7ffafdbaf7fdd',
      price: 6.867609733029039,
      fiatValue: 74.16744677202166,
    },
    {
      block: '24041334',
      timestamp: new Date().getTime(),
      amount: 10.8816476218,
      hash: '0xaf800fed140ceedc0ab72a0a24dd582df16da3489a871f60579d7ec058750122',
      price: 7.102445975088033,
      fiatValue: 77.28631435377967,
    },
  ],
  currentPrice: 4.55,
  token: 'DOT',
};

export const mockCountry = async (page: Page, country: string) => {
  await page.route('https://ipinfo.io/json', async (route) => {
    await route.fulfill({ json: { country } });
  });
};

test.describe('Wallet', () => {
  let wsWrapper: WsWrapper;

  test('Add wallet and sync', async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`Browser log: ${msg.type()}: ${msg.text()}`);
    });

    wsWrapper = new WsWrapper();

    await mockCountry(page, 'IT');
    await mockSubscanChainList(page);
    await page.goto('http://localhost:9000');
    await page.fill(
      '[data-testid="wallet-input"]',
      '2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83'
    );
    await page.click('[data-testid="submit"]');
    await wsWrapper.waitForNMessages(1);
    const msg = wsWrapper.receivedMessages[0];
    expect(msg).toMatchObject({
      type: 'fetchDataRequest',
      payload: {
        wallet: '2Fd1UGzT8yuhksiKy98TpDg794dEELvNFqenJjRHFvwfuU83',
        currency: 'EUR',
      },
      timestamp: expect.any(Number),
      reqId: expect.any(String),
    });
    wsWrapper.send({
      type: 'data',
      reqId: msg.reqId,
      payload: [
        {
          reqId: msg.reqId,
          wallet: msg.payload.wallet,
          blockchain: 'polkadot',
          type: 'staking_rewards',
          status: 'pending',
          currency: 'EUR',
          syncFromDate: 1703980800000,
        },
        {
          reqId: msg.reqId,
          wallet: msg.payload.wallet,
          blockchain: 'kusama',
          type: 'staking_rewards',
          status: 'pending',
          currency: 'EUR',
          syncFromDate: 1703980800000,
        },
      ],
    });
    const rows = page.locator('[data-testid="wallet-data-table"] tr');
    await expect(rows).toHaveCount(2);

    wsWrapper.send({
      type: 'data',
      reqId: msg.reqId,
      payload: [
        {
          reqId: msg.reqId,
          wallet: msg.payload.wallet,
          blockchain: 'polkadot',
          type: 'staking_rewards',
          status: 'in_progress',
          currency: 'EUR',
          syncFromDate: 1703980800000,
        },
      ],
    });

    const statusIcon = page.getByTestId('wallet-status-icon').first();
    await expect(statusIcon).toContainClass('spinner');
    const walletAddress = page.getByTestId('wallet-address').first();
    await expect(walletAddress).toHaveText(msg.payload.wallet);

    wsWrapper.send({
      type: 'data',
      reqId: msg.reqId,
      payload: [
        {
          reqId: msg.reqId,
          wallet: msg.payload.wallet,
          blockchain: 'polkadot',
          type: 'staking_rewards',
          status: 'done',
          currency: 'EUR',
          syncFromDate: 1703980800000,
          data: mockRewards,
        },
      ],
    });
    await expect(statusIcon).not.toHaveClass('spinner');
  });

  test.afterEach(async () => {
    await wsWrapper.close();
  });
});
