export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'waiting_for_input';

export interface JobInput {
  key: string;
  value: string;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  input: JobInput[];
  result?: JobResult;
  createdAt: Date;
  updatedAt: Date;
}
