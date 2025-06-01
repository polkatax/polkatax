import { expect, jest, it, describe, afterEach } from '@jest/globals';
import { fetchCurrency } from './fetch-currency';

// Mock the currency list
jest.mock('../const/currencyList', () => ({
  currencyList: [
    { name: 'EUR', countries: ['DE', 'FR', 'IT'] },
    { name: 'GBP', countries: ['GB'] },
    { name: 'USD', countries: ['US'] },
  ],
}));

describe('fetchCurrency', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the currency based on country code from API', async () => {
    global.fetch = jest.fn<any>().mockResolvedValue({
      json: jest.fn<any>().mockResolvedValue({ country: 'DE' }), // Germany
    }) as any;

    const result = await fetchCurrency();
    expect(result).toBe('EUR');
  });

  it('should return USD if country is not in list', async () => {
    global.fetch = jest.fn<any>().mockResolvedValue({
      json: jest.fn<any>().mockResolvedValue({ country: 'ZZ' }), // unknown
    }) as any;

    const result = await fetchCurrency();
    expect(result).toBe('USD');
  });

  it('should return USD if fetch fails', async () => {
    global.fetch = jest.fn<any>().mockRejectedValue(new Error('Network error'));

    const result = await fetchCurrency();
    expect(result).toBe('USD');
  });
});
