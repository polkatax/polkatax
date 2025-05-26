import { RewardsDto } from '../model/rewards';
import { expect, jest, test, describe, afterEach } from '@jest/globals';
import { fetchStakingRewards } from './fetch-staking-rewards';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('fetchStakingRewards', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should call fetch with the correct URL and return parsed JSON', async () => {
    const mockResponse: RewardsDto = { values: [] } as unknown as RewardsDto;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchStakingRewards(
      'Ethereum',
      '0xABC123',
      'usd',
      1609459200,
      1612137600
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/staking-rewards/ethereum/0xABC123?startdate=1609459200&enddate=1612137600&currency=usd',
      { method: 'GET' }
    );
    expect(result).toEqual(mockResponse);
  });

  test('should throw if fetch response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    await expect(
      fetchStakingRewards('Polkadot', '0xDEF456', 'eur', 1600000000, 1609999999)
    ).rejects.toEqual({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
  });
});
