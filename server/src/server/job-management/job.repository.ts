import { Client } from "pg";
import { connectToDb } from "../database/db-connection";
import { Job, JobId } from "../../model/job";
import { WsError } from "../model/ws-error";
import { Subject } from "rxjs";
import { logger } from "../logger/logger";

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapToCamelCase(row: any): any {
  const json = {};
  Object.keys(row).forEach((key) => {
    json[snakeToCamel(key)] = row[key];
  });
  return json;
}

export class JobRepository {
  pendingJobsChanged$ = new Subject<void>();
  jobChanged$ = new Subject<JobId>();

  constructor() {
    this.init();
  }

  private async init() {
    logger.info("Init JobRepository");
    const _client = await this.client;
    await _client.query(`
            LISTEN job_changed;
            LISTEN pending_jobs_changed;
        `);
    _client.on("notification", (msg) => {
      try {
        const payload = JSON.parse(msg.payload || "{}");
        if (msg.channel === "job_changed") {
          logger.info(
            `JobRepository: Received notification on channel ${msg.channel}, wallet: ${payload.wallet}, blockchain: ${payload.blockchain}`,
          );
          this.jobChanged$.next(payload);
        } else {
          logger.info(
            `JobRepository: Received notification on channel ${msg.channel}.`,
          );
          this.pendingJobsChanged$.next(payload);
        }
      } catch (e) {
        logger.error("Failed to parse payload:", msg.payload);
      }
    });
    logger.info("Init JobRepository complete.");
  }

  get client(): Promise<Client> {
    return connectToDb();
  }

  mapToJob(row: any): Job {
    const job = mapToCamelCase(row);
    job.syncFromDate = job?.syncFromDate?.getTime();
    job.syncedUntil = job?.syncedUntil?.getTime();
    job.lastModified = job?.lastModified?.getTime();
    return job as Job;
  }

  async insertJob(job: Job) {
    const query = `
            INSERT INTO jobs (
                wallet, blockchain, sync_from_date, currency, req_id, deleted, last_modified, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

    const values = [
      job.wallet,
      job.blockchain,
      new Date(job.syncFromDate),
      job.currency,
      job.reqId,
      false,
      new Date(),
      "pending",
    ];
    await (await this.client).query(query, values);
    this.notifyPendingJobsChanged();
    return job;
  }

  private async executeJobQuery(query: string, values?: any[]): Promise<Job[]> {
    const rows = (await (await this.client).query(query, values)).rows;
    return rows.map((row) => this.mapToJob(row));
  }

  async findJobysByWallet(wallet: string): Promise<Job[]> {
    const query = `SELECT * FROM jobs WHERE wallet = $1 AND deleted = false`;
    const values = [wallet];
    return this.executeJobQuery(query, values);
  }

  async findJob(jobId: JobId): Promise<Job | undefined> {
    const query = `SELECT * FROM jobs WHERE wallet = $1 AND blockchain = $2 AND currency = $3 AND deleted = false`;
    const values = [jobId.wallet, jobId.blockchain, jobId.currency];
    const jobs = await this.executeJobQuery(query, values);
    return jobs.length > 0 ? jobs[0] : undefined;
  }

  async fetchAllJobs(): Promise<Job[]> {
    const query = `SELECT req_id, wallet, error, blockchain, sync_from_date, status, last_modified, currency, synced_until, deleted FROM jobs`;
    return await this.executeJobQuery(query);
  }

  async fetchAllPendingJobs(): Promise<Job[]> {
    const query = `SELECT * FROM jobs WHERE status = 'pending' and deleted = false`;
    return await this.executeJobQuery(query);
  }

  async softDeleteJob(job: Job) {
    const query = `
            UPDATE jobs
            SET deleted = true
            WHERE wallet = $1
                AND blockchain = $2
                AND currency = $3
            `;
    const values = [job.wallet, job.blockchain, job.currency];
    console.log(values);
    await (await this.client).query(query, values);
    this.notifyJobChanged(job);
    this.notifyPendingJobsChanged();
  }

  async deleteJob(job: Job) {
    const query = `
            DELETE FROM jobs
            WHERE wallet = $1
                AND blockchain = $2
                AND currency = $3
            `;

    const values = [job.wallet, job.blockchain, job.currency];
    return (await (await this.client).query(query, values)).rows;
  }

  async setInProgress(jobId: JobId): Promise<Job[]> {
    const query = `
            UPDATE jobs
            SET status = 'in_progress', last_modified = $1
            WHERE wallet = $2
                AND blockchain = $3
                AND currency = $4
                AND status != 'in_progress'
            RETURNING *;
            `;

    const values = [new Date(), jobId.wallet, jobId.blockchain, jobId.currency];
    const result: Job[] = (await (await this.client).query(query, values)).rows;
    if (result.length > 0) {
      this.notifyJobChanged(jobId);
      this.notifyPendingJobsChanged();
    }
    return result;
  }

  async setError(jobId: JobId, error: WsError) {
    const query = `
            UPDATE jobs
            SET status = 'error', error = $1, last_modified = $2
            WHERE wallet = $3
                AND blockchain = $4
                AND currency = $5
            `;

    const values = [
      error,
      new Date(),
      jobId.wallet,
      jobId.blockchain,
      jobId.currency,
    ];
    await (await this.client).query(query, values);
    this.notifyJobChanged(jobId);
  }

  async setDone(jobId: JobId, data: any, syncedUntil: number) {
    const query = `
            UPDATE jobs
            SET status = 'done', error = 'null', last_modified = $1, data=$2, synced_until = $3
            WHERE wallet = $4
                AND blockchain = $5
                AND currency = $6
            `;

    const values = [
      new Date(),
      data,
      new Date(syncedUntil),
      jobId.wallet,
      jobId.blockchain,
      jobId.currency,
    ];
    await (await this.client).query(query, values);
    this.notifyJobChanged(jobId);
  }

  async notifyJobChanged(jobId: JobId) {
    const payload = {
      wallet: jobId.wallet,
      blockchain: jobId.blockchain,
      currency: jobId.currency,
    };
    const query = `NOTIFY job_changed, '${JSON.stringify(payload)}';`;
    await (await this.client).query(query);
  }

  async notifyPendingJobsChanged() {
    await (await this.client).query(`NOTIFY pending_jobs_changed;`);
  }
}
