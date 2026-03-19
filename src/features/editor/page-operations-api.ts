import { invoke } from '@tauri-apps/api/core';
import type { JobItem, PageOperationRequest } from '@/shared/types';

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
    message: job.message
  };
}

export async function runPageOperation(request: PageOperationRequest): Promise<JobItem> {
  const job = await invoke<RustJobItem>('run_page_operation_job', { request });
  return mapRustJob(job);
}
