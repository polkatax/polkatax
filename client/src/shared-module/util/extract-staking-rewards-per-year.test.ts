import { expect, it, describe, jest, beforeEach } from '@jest/globals';

import { getBeginningAndEndOfYear } from './date-utils';
import { Rewards } from '../model/rewards';
import { extractStakingRewardsPerYear } from './extract-staking-rewards-per-year';

jest.mock('./date-utils', () => ({
  getBeginningAndEndOfYear: jest.fn(),
}));

describe('extractStakingRewardsPerYear', () => {
  const mockBeginning = new Date('2023-01-01T00:00:00Z').getTime();
  const mockEnd = new Date('2023-12-31T23:59:59Z').getTime();

  beforeEach(() => {
    (getBeginningAndEndOfYear as jest.Mock).mockReturnValue({
      beginning: mockBeginning,
      end: mockEnd,
    });
  });

  it('should return undefined if input is undefined', () => {
    expect(extractStakingRewardsPerYear(undefined, 2023)).toBeUndefined();
  });

  it('should extract rewards for the given year', () => {
    const rewards: Rewards = {
      chain: 'ethereum',
      token: 'ETH',
      currency: 'USD',
      address: '0x123',
      dailyValues: {
        '2022-12-31': { amount: 1, fiatValue: 100 },
        '2023-01-01': { amount: 2, fiatValue: 200 },
        '2023-12-31': { amount: 3, fiatValue: 300 },
        '2024-01-01': { amount: 4, fiatValue: 400 },
      },
      values: [
        { timestamp: new Date('2022-12-31').getTime() },
        { timestamp: mockBeginning },
        { timestamp: mockEnd },
        { timestamp: new Date('2024-01-01').getTime() },
      ] as any,
      summary: {
        fiatValue: 600,
        amount: 5,
        perYear: [
          { year: 2023, fiatValue: 500, amount: 5 },
          { year: 2022, fiatValue: 100, amount: 1 },
        ],
      },
    };

    const result = extractStakingRewardsPerYear(rewards, 2023);
    expect(result).toBeDefined();
    expect(result?.year).toBe(2023);
    expect(Object.keys(result!.dailyValues)).toEqual([
      '2023-01-01',
      '2023-12-31',
    ]);
    expect(result!.values.length).toBe(2); // beginning and end of year timestamps
    expect(result!.summary.fiatValue).toBe(500);
  });
});
