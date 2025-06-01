import { expect, it, describe } from '@jest/globals';
import {
  formatDate,
  formatDateUTC,
  getBeginningAndEndOfYear,
} from './date-utils';

describe('formatDateUTC', () => {
  it('should format timestamp to UTC date string', () => {
    const timestamp = Date.UTC(2024, 4, 31, 14, 30, 45); // 2024-05-31T14:30:45Z
    expect(formatDateUTC(timestamp)).toBe('2024-05-31T14:30:45Z');
  });
});

describe('formatDate', () => {
  it('should format timestamp to YYYY-MM-DD string', () => {
    const timestamp = new Date(2025, 0, 2).getTime(); // 2025-01-02
    expect(formatDate(timestamp)).toBe('2025-01-02');
  });
});

describe('getBeginningAndEndOfYear', () => {
  it('should return correct timestamps for start and end of year', () => {
    const year = 2023;
    const { beginning, end } = getBeginningAndEndOfYear(year);
    const beginningDate = new Date(beginning);
    const endDate = new Date(end);

    expect(beginningDate.getFullYear()).toBe(2023);
    expect(beginningDate.getMonth()).toBe(0); // Jan
    expect(beginningDate.getDate()).toBe(1);
    expect(beginningDate.getHours()).toBe(0);

    expect(endDate.getFullYear()).toBe(2023);
    expect(endDate.getMonth()).toBe(11); // Dec
    expect(endDate.getDate()).toBe(31);
    expect(endDate.getHours()).toBe(23);
  });
});
