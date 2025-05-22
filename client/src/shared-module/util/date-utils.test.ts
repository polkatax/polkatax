import { expect, beforeAll, test, jest, describe } from '@jest/globals';
import {
  formatDate,
  formatDateUTC,
  getEndDate,
  getFirstDayOfYear,
  getStartDate,
  getStartOfCurrentDay,
} from './date-utils';

jest.mock('../model/time-frames', () => ({
  TimeFrames: {
    'This Year': 'This Year',
    lastYear: 2022,
    twoYearsAgo: 2021,
    threeYearsAgo: 2020,
    yourYearsAgo: 2019,
    fiveYearsAgo: 2018,
  },
}));

const mockDate = new Date(2023, 4, 15); // May 15, 2023

describe('Timeframe Functions', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(mockDate);
  });

  describe('getStartOfCurrentDay', () => {
    test('should return the start of the current day', () => {
      const startOfDay = getStartOfCurrentDay();
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });
  });

  describe('getFirstDayOfYear', () => {
    test('should return the first day of the current year', () => {
      const firstDayOfYear = getFirstDayOfYear();
      expect(firstDayOfYear.getFullYear()).toBe(2023);
      expect(firstDayOfYear.getMonth()).toBe(0);
      expect(firstDayOfYear.getDate()).toBe(1);
    });
  });

  describe('getStartDate', () => {
    test('should return the correct start date for "This Year"', () => {
      const startDate = getStartDate('This Year');
      expect(startDate).toBe(new Date(2023, 0, 1).getTime());
    });

    test('should return the correct start date for a last year', () => {
      const startDate = getStartDate('lastYear');
      expect(startDate).toBe(new Date(2022, 0, 1).getTime()); // January 1, 2022
    });
  });

  describe('getEndDate', () => {
    test('should return the correct end date for "This Year"', () => {
      const endDate = getEndDate('This Year');
      const expectedEndDate = new Date(2023, 4, 16);
      expect(endDate).toBe(expectedEndDate.getTime());
    });

    test('should return the correct end date for "2022"', () => {
      const endDate = getEndDate('lastYear');
      const expectedEndDate = new Date(2023, 0, 1);
      expect(endDate).toBe(expectedEndDate.getTime());
    });
  });

  describe.skip('formatDateUTC', () => {
    test('should correctly format a date in UTC format', () => {
      const utcDate = formatDateUTC(new Date(2023, 4, 15).getTime());
      expect(utcDate).toBe('2023-05-14T22:00:00Z');
    });
  });

  describe('formatDate', () => {
    test('should format a date correctly', () => {
      const formattedDate = formatDate(new Date(2023, 4, 15).getTime());
      expect(formattedDate).toBe('2023-05-15');
    });
  });
});
