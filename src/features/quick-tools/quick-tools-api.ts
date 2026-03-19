import { invoke } from '@tauri-apps/api/core';
import type { JobItem, QuickToolJobRequest } from '@/shared/types';

interface RustJobItem {
  id: string;
  jobType: string;
  sourcePaths: string[];
  outputPath: string;
  status: JobItem['status'];
  createdAt: string;
  updatedAt: string;
  progress: number;
  message?: string;
  details?: Record<string, unknown>;
}

function mapRustJob(job: RustJobItem): JobItem {
  return {
    id: job.id,
    type: job.jobType,
    sourcePaths: job.sourcePaths,
    outputPath: job.outputPath,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    progress: job.progress,
    message: job.message,
    details: job.details
  };
}

export async function runQuickToolJob(request: QuickToolJobRequest): Promise<JobItem> {
  const job = await invoke<RustJobItem>('run_quick_tool_job', { request });
  return mapRustJob(job);
}

export async function fetchJobs(): Promise<JobItem[]> {
  const jobs = await invoke<RustJobItem[]>('list_jobs');
  return jobs.map(mapRustJob);
}
