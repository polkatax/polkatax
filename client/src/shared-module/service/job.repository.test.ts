import { expect, jest, it, describe, beforeEach } from '@jest/globals';
import {
  createOrUpdateJobInIndexedDB,
  fetchAllJobsFromIndexedDB,
  removeJobFromIndexedDB,
} from './job.repository';
import { openDB } from 'idb';
import { JobResult } from '../model/job-result';

jest.mock('idb');

const mockPut = jest.fn();
const mockGetAll = jest.fn<any>();
const mockDelete = jest.fn();
const mockTxDone = Promise.resolve();

const mockTx = {
  objectStore: () => ({
    put: mockPut,
    getAll: mockGetAll,
    delete: mockDelete,
  }),
  done: mockTxDone,
};

const mockDB = {
  transaction: jest.fn(() => mockTx),
  getAll: mockGetAll,
};

(openDB as jest.Mock<any>).mockResolvedValue(mockDB);

const sampleJob: JobResult = {
  type: 'staking_rewards',
  blockchain: 'polkadot',
  wallet: 'wallet123',
  currency: 'USD',
  status: 'pending',
  lastModified: Date.now(),
} as any;

describe('IndexedDB Job Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create or update a job in IndexedDB', async () => {
    await createOrUpdateJobInIndexedDB(sampleJob);
    expect(openDB).toHaveBeenCalled();
    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        ...sampleJob,
        id: 'job_staking_rewards_polkadot_wallet123_USD',
      })
    );
  });

  it('should fetch all jobs from IndexedDB', async () => {
    mockGetAll.mockResolvedValueOnce([sampleJob]);
    const jobs = await fetchAllJobsFromIndexedDB();
    expect(openDB).toHaveBeenCalled();
    expect(jobs).toEqual([sampleJob]);
  });

  it('should remove a job from IndexedDB', async () => {
    await removeJobFromIndexedDB(sampleJob);
    expect(openDB).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith(
      'job_staking_rewards_polkadot_wallet123_USD'
    );
  });
});
