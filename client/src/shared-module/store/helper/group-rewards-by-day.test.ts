import { expect, test, describe } from '@jest/globals';
import { groupRewardsByDay } from './group-rewards-by-day';
import { Reward } from '../../model/rewards';

describe('groupRewardsByDay', () => {
  test('should group rewards by isoDate and sum values correctly', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-20', amount: 5, fiatValue: 50, valueNow: 60 },
      { isoDate: '2024-04-20', amount: 3, fiatValue: 30, valueNow: 40 },
      { isoDate: '2024-04-21', amount: 2, fiatValue: 20, valueNow: 25 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({
      '2024-04-20': {
        amount: 8,
        fiatValue: 80,
        valueNow: 100,
      },
      '2024-04-21': {
        amount: 2,
        fiatValue: 20,
        valueNow: 25,
      },
    });
  });

  test('should return undefined for value if any value is undefined in a group', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-20', amount: 5, fiatValue: 50, valueNow: 60 },
      { isoDate: '2024-04-20', amount: 3, fiatValue: undefined, valueNow: 40 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result['2024-04-20'].fiatValue).toBeUndefined();
    expect(result['2024-04-20'].valueNow).toBe(100);
  });

  test('should return undefined for valueNow if any valueNow is undefined in a group', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-21', amount: 4, fiatValue: 20, valueNow: 25 },
      { isoDate: '2024-04-21', amount: 2, fiatValue: 10, valueNow: undefined },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result['2024-04-21'].fiatValue).toBe(30);
    expect(result['2024-04-21'].valueNow).toBeUndefined();
  });

  test('should handle empty reward list', () => {
    const rewards: Reward[] = [];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({});
  });

  test('should group correctly with only one reward', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-22', amount: 1, fiatValue: 10, valueNow: 12 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({
      '2024-04-22': {
        amount: 1,
        fiatValue: 10,
        valueNow: 12,
      },
    });
  });
});
