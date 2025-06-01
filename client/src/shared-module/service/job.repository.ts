import { openDB } from 'idb';
import { JobResult } from '../model/job-result';

const DB_NAME = 'JobsDB';
const STORE_NAME = 'jobs';

// Open (or create) DB and store with string keys
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // we'll add 'id' = createKey(job) manually before saving
      }
    },
  });
}

const createKey = (job: JobResult) => {
  return `job_${job.type}_${job.blockchain}_${job.wallet}_${job.currency}`;
};

const getTx = async () => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  return { tx, store: tx.objectStore(STORE_NAME) };
};

export const createOrUpdateJobInIndexedDB = async (job: JobResult) => {
  const { tx, store } = await getTx();
  const jobWithId = { ...job, id: createKey(job) };
  await store.put(jobWithId);
  await tx.done;
};

export const fetchAllJobsFromIndexedDB = async (): Promise<JobResult[]> => {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
};

export const removeJobFromIndexedDB = async (job: JobResult) => {
  const { tx, store } = await getTx();
  const jobWithId = createKey(job);
  await store.delete(jobWithId);
  await tx.done;
};
