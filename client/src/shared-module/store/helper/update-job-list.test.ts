import { expect, it, describe, jest, beforeEach } from '@jest/globals';
import { updateJobList } from './update-job-list';
import { addIsoDate } from './add-iso-date';
import { filterFromBeginningLastYear } from './filter-from-beginning-last-year';
import { mapRawValuesToRewards } from './job.service';
import { createOrUpdateJobInIndexedDB } from '../../service/job.repository';
import { JobResult } from '../../model/job-result';

jest.mock('./add-iso-date', () => ({
  addIsoDate: jest.fn((vals) => vals),
}));

jest.mock('./filter-from-beginning-last-year', () => ({
  filterFromBeginningLastYear: jest.fn(),
}));

jest.mock('./job.service', () => ({
  mapRawValuesToRewards: jest.fn((job, token, values) => ({
    token,
    values,
    dummyMapped: true,
  })),
  sortJobs: jest.fn((jobs) =>
    [...(jobs as any)].sort((a, b) => a.wallet.localeCompare(b.wallet))
  ),
}));

jest.mock('../../service/job.repository', () => ({
  createOrUpdateJobInIndexedDB: jest.fn(),
}));

describe('updateJobList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseJob: JobResult = {
    wallet: 'abc',
    blockchain: 'eth',
    currency: 'USD',
    type: 'staking_rewards',
    status: 'done',
    lastModified: Date.now(),
    syncFromDate: 1700000000000,
    syncedUntil: 1710000000000,
    data: {
      token: 'ETH',
      values: [
        { timestamp: 1701000000000, amount: 1 },
        { timestamp: 1702000000000, amount: 2 },
      ],
    },
  } as any;

  it('merges and updates an existing matching job', async () => {
    const existingJob: JobResult = {
      ...baseJob,
      data: {
        token: 'ETH',
        values: [{ timestamp: 1690000000000, amount: 0.5 }],
      },
    } as any;

    const updatedList = await updateJobList(baseJob, [existingJob]);

    expect(addIsoDate).toHaveBeenCalled();
    expect(filterFromBeginningLastYear).toHaveBeenCalled();
    expect(mapRawValuesToRewards).toHaveBeenCalled();
    expect(createOrUpdateJobInIndexedDB).toHaveBeenCalledWith(
      expect.objectContaining({ wallet: 'abc' })
    );
    expect(updatedList).toHaveLength(1);
  });

  it('adds a new job if no match found', async () => {
    const newJob: JobResult = {
      ...baseJob,
      wallet: 'newWallet',
    };

    const updatedList = await updateJobList(newJob, []);

    expect(filterFromBeginningLastYear).toHaveBeenCalled();
    expect(mapRawValuesToRewards).toHaveBeenCalled();
    expect(createOrUpdateJobInIndexedDB).toHaveBeenCalledWith(
      expect.objectContaining({ wallet: 'newWallet' })
    );
    expect(updatedList).toHaveLength(1);
  });

  it('handles job with no data gracefully', async () => {
    const noDataJob: JobResult = {
      ...baseJob,
      wallet: 'nodata',
      data: undefined,
    } as any;

    const updatedList = await updateJobList(noDataJob, []);
    expect(mapRawValuesToRewards).not.toHaveBeenCalled();
    expect(filterFromBeginningLastYear).not.toHaveBeenCalled();
    expect(updatedList).toHaveLength(1);
  });
});
