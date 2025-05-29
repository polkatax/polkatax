import { expect, it, describe } from "@jest/globals";
import { getYearRange } from "./get-time-range";

describe('getYearRange', () => {
  it('returns correct range for a past year', () => {
    const year = 2020;
    const { startDay, endDay } = getYearRange(year);

    expect(startDay.toISOString()).toBe('2019-12-31T00:00:00.000Z');
    expect(endDay?.toISOString()).toBe('2021-01-01T23:59:59.999Z');
  });

  it('returns correct range for current year with endDay not undefined (if current year is after end)', () => {
    const thisYear = new Date().getUTCFullYear();
    const year = thisYear - 2;

    const { startDay, endDay } = getYearRange(year);

    expect(startDay.getUTCFullYear()).toBe(year - 1);
    expect(endDay).toBeDefined();
    expect(endDay).toBeInstanceOf(Date);
  });

  it('returns undefined endDay if end date is in the future', () => {
    const nextYear = new Date().getUTCFullYear() + 2;
    const { startDay, endDay } = getYearRange(nextYear);

    expect(startDay.toISOString()).toBe(`${nextYear - 1}-12-31T00:00:00.000Z`);
    expect(endDay).toBeUndefined();
  });
});