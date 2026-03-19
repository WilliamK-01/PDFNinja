export type WorkflowStepType = 'ocr' | 'compress' | 'merge' | 'watermark' | 'extract-pages' | 'rename' | 'save';

export type WorkflowJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface WorkflowTriggerConfig {
  type: 'manual' | 'watched-folder';
  watchPath?: string;
  filePattern?: string;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  options: Record<string, string | number | boolean>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  trigger: WorkflowTriggerConfig;
  steps: WorkflowStep[];
}

export interface WorkflowQueueItem {
  id: string;
  workflowId: string;
  workflowName: string;
  sourcePaths: string[];
  outputDirectory: string;
  status: WorkflowJobStatus;
  createdAt: string;
  updatedAt: string;
  currentStepIndex: number;
  currentStepLabel?: string;
  error?: string;
}

export interface WorkflowHistoryItem {
  id: string;
  workflowId: string;
  workflowName: string;
  sourcePaths: string[];
  outputDirectory: string;
  status: Exclude<WorkflowJobStatus, 'queued' | 'running'>;
  startedAt: string;
  finishedAt: string;
  executedSteps: string[];
  outputFiles: string[];
  error?: string;
}

export interface WorkflowExecutionResult {
  executedSteps: string[];
  outputFiles: string[];
}
