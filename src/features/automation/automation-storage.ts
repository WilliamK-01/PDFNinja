import type { WorkflowDefinition } from '@/features/automation/automation-types';

const STORAGE_KEY = 'pdfninja.automation.workflows.v1';

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadWorkflows(): WorkflowDefinition[] {
  if (!hasWindow()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as WorkflowDefinition[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((workflow) => Array.isArray(workflow.steps));
  } catch {
    return [];
  }
}

export function saveWorkflows(workflows: WorkflowDefinition[]): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}
