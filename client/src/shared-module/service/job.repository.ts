import { openDB } from 'idb';
import { Job } from '../model/job-result';

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
    }
  });
}

const createKey = (job: Job) => {
  return `job_${job.type}_${job.wallet}_${job.timeframe}_${job.currency}_${job.blockchain}`;
};

// Save or update a job in IndexedDB
export const createOrUpdateJobInIndexedDB = async (job: Job) => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Add the 'id' property to the job for keyPath
  const jobWithId = { ...job, id: createKey(job) };

  await store.put(jobWithId);
  await tx.done;
};

// Fetch all jobs from IndexedDB
export const fetchAllJobsFromIndexedDB = async (): Promise<Job[]> => {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
};
