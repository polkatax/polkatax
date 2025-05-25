import { Job, JobId } from "../../model/job";
import { Subject, Observable } from 'rxjs'

export class JobsCache {
    private jobs: Job[] = []
    private jobQueue$: Subject<Job> = new Subject<Job>();
    public jobUpdate$: Subject<Job> = new Subject<Job>();

    addJob(wallet: string, blockchain: string, type: 'staking_rewards' | 'transactions', timeframe: number, currency: string, timeZone: string) {
        const job: Job = {
            wallet, blockchain, type, timeframe, status: 'pending', lastModified: Date.now(), currency, timeZone
        }
        this.jobs.push(job)
        this.jobQueue$.next({
            ...job
        })
        return job
    }

    private findJobOrThrough(jobId: JobId): Job {
        const job = this.jobs.find(j => 
            j.wallet === jobId.wallet && j.blockchain === jobId.blockchain && j.type === jobId.type && j.timeframe === jobId.timeframe 
         );
         if (!job) {
            throw Error(`Job not found: ${jobId.wallet}, ${jobId.blockchain}, ${jobId.type}, ${jobId.timeframe}`)
         }
         return job
    }

    fetchJob(wallet: string, blockchain: string, type: 'staking_rewards' | 'transactions', timeframe: number): Job | undefined {
        return this.jobs.find(j => 
           j.wallet === wallet && j.blockchain === blockchain && j.type === type && j.timeframe === timeframe 
        );
    }

    setInProgress(jobId: JobId) {
        const job = this.findJobOrThrough(jobId)
        job.status = 'in_progress'
        job.lastModified = Date.now()
        this.jobUpdate$.next(job)
    }

    setDone(value: any, jobId: JobId) {
        const job = this.findJobOrThrough(jobId)
        job.value = value
        job.status = 'done'
        job.lastModified = Date.now()
        this.jobUpdate$.next(job)
    }

    setError(error: any, jobId: JobId) {
        const job = this.findJobOrThrough(jobId)
        job.error = error
        job.status = 'error'
        job.lastModified = Date.now()
        this.jobUpdate$.next(job)
    }

    cleanUp() {
        this.jobs = this.jobs.filter(j => (j.status !== 'done' && j.status !== 'error') || Date.now() - j.lastModified < 72 * 60 * 60 * 1000)
    }
    
    get pendingJobs$(): Observable<Job> {
        return this.jobQueue$.asObservable()
    }

    fetchJobs(wallet: string) {
        return this.jobs.filter(j => j.wallet === wallet)
    }
}