import { addIsoDate } from './add-iso-date';
import { filterFromBeginningLastYear } from './filter-from-beginning-last-year';
import { mapRawValuesToRewards, sortJobs } from './job.service';
import { createOrUpdateJobInIndexedDB } from '../../service/job.repository';
import { JobResult } from '../../model/job-result';

export const updateJobList = async (
  incomingJob: JobResult,
  jobs: JobResult[]
) => {
  const match = jobs.find(
    (j) =>
      j.wallet === incomingJob.wallet &&
      j.blockchain === incomingJob.blockchain &&
      j.currency === incomingJob.currency
  );

  if (match) {
    if (incomingJob.status === 'done' && incomingJob.data) {
      const newValues = (incomingJob.data.values ?? []).filter(
        (v) => v.timestamp >= incomingJob.syncFromDate!
      );
      const oldValues = (match.data?.values ?? []).filter(
        (v) => v.timestamp < incomingJob.syncFromDate!
      );

      const merged = addIsoDate(newValues).concat(oldValues);
      filterFromBeginningLastYear(incomingJob.data);
      match.data = mapRawValuesToRewards(match, incomingJob.data.token, merged);
      match.syncedUntil = incomingJob.syncedUntil;
    }

    if (incomingJob.status === 'done' || incomingJob.status === 'error') {
      match.error = incomingJob.error;
    }

    Object.assign(match, {
      lastModified: incomingJob.lastModified,
      status: incomingJob.status,
    });

    await createOrUpdateJobInIndexedDB(match);
  } else {
    if (incomingJob.data) {
      filterFromBeginningLastYear(incomingJob.data);
      incomingJob.data = mapRawValuesToRewards(
        incomingJob,
        incomingJob.data.token,
        addIsoDate(incomingJob.data.values)
      );
    }

    jobs.push(incomingJob);
    await createOrUpdateJobInIndexedDB(incomingJob);
  }

  return sortJobs(jobs);
};
