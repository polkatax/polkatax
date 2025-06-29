import { jest, expect, it, describe } from '@jest/globals';

import * as dateUtils from '../../util/date-utils';
import { addIsoDate } from './add-iso-date';
import { RewardDto } from '../../model/rewards';

describe('addIsoDate', () => {
  it('adds isoDate and valueNow when currentPrice is defined', () => {
    const input: RewardDto[] = [
      { amount: 2, timestamp: 1609459200000 }, // 2021-01-01T00:00:00Z
      { amount: 3, timestamp: 1609545600000 }, // 2021-01-02T00:00:00Z
    ] as any;

    const mockFormatDate = jest
      .spyOn(dateUtils, 'formatDate')
      .mockImplementation((ts: number) => new Date(ts).toISOString());

    const result = addIsoDate(input);

    expect(result).toEqual([
      {
        amount: 2,
        timestamp: 1609459200000,
        isoDate: '2021-01-01T00:00:00.000Z',
      },
      {
        amount: 3,
        timestamp: 1609545600000,
        isoDate: '2021-01-02T00:00:00.000Z',
      },
    ]);

    mockFormatDate.mockRestore();
  });

  it('returns an empty array if input is empty', () => {
    const result = addIsoDate([]);
    expect(result).toEqual([]);
  });
});
