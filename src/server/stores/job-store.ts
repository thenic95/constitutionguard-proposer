import { Job, JobInput, JobResult, JobStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class JobStore {
  private jobs = new Map<string, Job>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Allow process to exit even if timer is active
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  create(input: JobInput[]): Job {
    const job: Job = {
      id: uuidv4(),
      status: 'queued',
      input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  updateStatus(id: string, status: JobStatus): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
    }
  }

  setResult(id: string, result: JobResult): void {
    const job = this.jobs.get(id);
    if (job) {
      job.result = result;
      job.status = result.success ? 'completed' : 'failed';
      job.updatedAt = new Date();
    }
  }

  addInput(id: string, input: JobInput[]): void {
    const job = this.jobs.get(id);
    if (job) {
      job.input.push(...input);
      job.updatedAt = new Date();
    }
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, job] of this.jobs) {
      if (now - job.createdAt.getTime() > JOB_TTL_MS) {
        this.jobs.delete(id);
        removed++;
      }
    }
    return removed;
  }

  size(): number {
    return this.jobs.size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.jobs.clear();
  }
}

export const jobStore = new JobStore();
