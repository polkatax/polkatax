import { addIsoDate } from './add-iso-date';
import { filterFromBeginningLastYear } from './filter-from-beginning-last-year';
import { mapRawValuesToRewards, sortJobs } from './job.service';
import { createOrUpdateJobInIndexedDB } from '../../service/job.repository';
import { JobResult } from '../../model/job-result';

export const updateJobList = async (job: JobResult, jobs: JobResult[]) => {
  const matching = jobs.find(
    (j) =>
      j.wallet === job.wallet &&
      j.blockchain === job.blockchain &&
      j.currency === job.currency
  );
  if (matching) {
    if (job.status === 'done' && job.data) {
      const newValues = (job.data.values ?? []).filter(
        (v) => v.timestamp >= job.syncFromDate!
      );
      const olderValues = (matching.data?.values ?? []).filter(
        (v) => v.timestamp < job.syncFromDate!
      );
      job.data.values = addIsoDate(newValues).concat(olderValues);
      filterFromBeginningLastYear(job.data);
      matching.data = mapRawValuesToRewards(
        matching,
        job.data.token,
        job.data.values
      );
      matching.syncedUntil = job.syncedUntil;
    }
    matching.lastModified = job.lastModified;
    matching.status = job.status;
    matching.error = job.error;
    await createOrUpdateJobInIndexedDB(matching);
  } else {
    if (job.data) {
      filterFromBeginningLastYear(job.data);
      job.data = mapRawValuesToRewards(
        job,
        job.data.token,
        addIsoDate(job.data.values)
      );
    }
    jobs.push(job);
    await createOrUpdateJobInIndexedDB(job);
  }
  return sortJobs(jobs);
};
