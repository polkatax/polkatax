import { expect, it, describe } from '@jest/globals';
import { Reward } from '../model/rewards';
import { calculateRewardSummary } from './calculate-reward-summary';

describe('calculateRewardSummary', () => {
  it('calculates total amount, fiatValue and valueNow correctly', () => {
    const rewards: Reward[] = [
      { amount: 1, fiatValue: 10, valueNow: 15, timestamp: 0, isoDate: '' },
      { amount: 2, fiatValue: 20, valueNow: 25, timestamp: 0, isoDate: '' },
    ] as any;

    const result = calculateRewardSummary(rewards);

    expect(result).toEqual({
      amount: 3,
      fiatValue: 30,
      valueNow: 40,
    });
  });

  it('sets fiatValue to undefined if any reward.fiatValue is undefined', () => {
    const rewards: Reward[] = [
      { amount: 1, fiatValue: 10, valueNow: 15, timestamp: 0, isoDate: '' },
      {
        amount: 2,
        fiatValue: undefined,
        valueNow: 25,
        timestamp: 0,
        isoDate: '',
      },
    ] as any;

    const result = calculateRewardSummary(rewards);

    expect(result).toEqual({
      amount: 3,
      fiatValue: undefined,
      valueNow: 40,
    });
  });

  it('sets valueNow to undefined if any reward.valueNow is undefined', () => {
    const rewards: Reward[] = [
      { amount: 1, fiatValue: 10, valueNow: 15, timestamp: 0, isoDate: '' },
      {
        amount: 2,
        fiatValue: 20,
        valueNow: undefined,
        timestamp: 0,
        isoDate: '',
      },
    ] as any;

    const result = calculateRewardSummary(rewards);

    expect(result).toEqual({
      amount: 3,
      fiatValue: 30,
      valueNow: undefined,
    });
  });

  it('sets both fiatValue and valueNow to undefined if all are undefined', () => {
    const rewards: Reward[] = [
      {
        amount: 1,
        fiatValue: undefined,
        valueNow: undefined,
        timestamp: 0,
        isoDate: '',
      },
      {
        amount: 2,
        fiatValue: undefined,
        valueNow: undefined,
        timestamp: 0,
        isoDate: '',
      },
    ] as any;

    const result = calculateRewardSummary(rewards);

    expect(result).toEqual({
      amount: 3,
      fiatValue: undefined,
      valueNow: undefined,
    });
  });

  it('returns initial summary when input is empty', () => {
    const result = calculateRewardSummary([]);

    expect(result).toEqual({
      amount: 0,
      fiatValue: 0,
      valueNow: 0,
    });
  });
});
