import { useEffect, useMemo, useState } from 'react';
import { ModuleCard } from '@/components/layout/module-card';
import { executeWorkflow, stepLabel } from '@/features/automation/automation-engine';
import { loadWorkflows, saveWorkflows } from '@/features/automation/automation-storage';
import type { WorkflowDefinition, WorkflowHistoryItem, WorkflowQueueItem, WorkflowStep, WorkflowStepType } from '@/features/automation/automation-types';
import type { JobItem } from '@/shared/types';
import { useAppState } from '@/state/app-state';

const supportedStepTypes: WorkflowStepType[] = ['ocr', 'compress', 'merge', 'watermark', 'extract-pages', 'rename', 'save'];

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function stepDefaults(type: WorkflowStepType): Record<string, string | number | boolean> {
  switch (type) {
    case 'compress':
      return { quality: 'medium' };
    case 'watermark':
      return { text: 'CONFIDENTIAL' };
    case 'extract-pages':
      return { range: '1-2' };
    case 'rename':
      return { pattern: 'processed-{index}' };
    case 'save':
      return { subfolder: '' };
    default:
      return {};
  }
}

const starterTemplates: Array<{ name: string; description: string; steps: WorkflowStepType[] }> = [
  {
    name: 'OCR then Compress',
    description: 'Recognize scanned text, reduce file size, then save output.',
    steps: ['ocr', 'compress', 'save']
  },
  {
    name: 'Merge and Watermark',
    description: 'Merge files into one document, apply watermark, then save.',
    steps: ['merge', 'watermark', 'save']
  },
  {
    name: 'Extract, Rename, Save',
    description: 'Extract selected pages, apply readable names, then save.',
    steps: ['extract-pages', 'rename', 'save']
  }
];

function defaultWorkflow(): WorkflowDefinition {
  const timestamp = nowIso();
  return {
    id: id('workflow'),
    name: 'New workflow',
    description: 'Describe when this workflow should be used.',
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    trigger: {
      type: 'manual'
    },
    steps: [
      {
        id: id('step'),
        type: 'save',
        options: stepDefaults('save')
      }
    ]
  };
}

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function formatStatus(status: WorkflowQueueItem['status']): string {
  return status[0].toUpperCase() + status.slice(1);
}

function buildAutomationJob(queueItem: WorkflowQueueItem): JobItem {
  const timestamp = nowIso();
  return {
    id: queueItem.id,
    type: `Automation · ${queueItem.workflowName}`,
    sourcePaths: queueItem.sourcePaths,
    outputPath: queueItem.outputDirectory,
    status: queueItem.status,
    createdAt: timestamp,
    updatedAt: timestamp,
    progress: 0,
    message: 'Queued in Automation'
  };
}

function stepSummary(step: WorkflowStep): string {
  switch (step.type) {
    case 'compress':
      return `Quality: ${String(step.options.quality ?? 'medium')}`;
    case 'watermark':
      return `Text: ${String(step.options.text ?? '').trim() || '(required)'}`;
    case 'extract-pages':
      return `Range: ${String(step.options.range ?? '').trim() || '(required)'}`;
    case 'rename':
      return `Pattern: ${String(step.options.pattern ?? '').trim() || '(required)'}`;
    case 'save':
      return `Subfolder: ${String(step.options.subfolder ?? '').trim() || '(root output)'}`;
    default:
      return 'No options required';
  }
}

function StepOptionsEditor({ step, onPatch }: { step: WorkflowStep; onPatch: (patch: Record<string, string>) => void }): JSX.Element {
  if (step.type === 'compress') {
    return (
      <label className="flex flex-col gap-1 text-xs text-textSecondary">
        Quality
        <select
          className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
          value={String(step.options.quality ?? 'medium')}
          onChange={(event) => onPatch({ quality: event.target.value })}
        >
          <option value="low">Low (smaller files)</option>
          <option value="medium">Medium</option>
          <option value="high">High (best quality)</option>
        </select>
      </label>
    );
  }

  if (step.type === 'watermark') {
    return (
      <label className="flex flex-col gap-1 text-xs text-textSecondary">
        Watermark text
        <input
          className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
          value={String(step.options.text ?? '')}
          onChange={(event) => onPatch({ text: event.target.value })}
          placeholder="CONFIDENTIAL"
        />
      </label>
    );
  }

  if (step.type === 'extract-pages') {
    return (
      <label className="flex flex-col gap-1 text-xs text-textSecondary">
        Page range
        <input
          className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
          value={String(step.options.range ?? '')}
          onChange={(event) => onPatch({ range: event.target.value })}
          placeholder="1-3,5"
        />
      </label>
    );
  }

  if (step.type === 'rename') {
    return (
      <label className="flex flex-col gap-1 text-xs text-textSecondary">
        File name pattern
        <input
          className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
          value={String(step.options.pattern ?? '')}
          onChange={(event) => onPatch({ pattern: event.target.value })}
          placeholder="invoice-{index}"
        />
      </label>
    );
  }

  if (step.type === 'save') {
    return (
      <label className="flex flex-col gap-1 text-xs text-textSecondary">
        Output subfolder (optional)
        <input
          className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
          value={String(step.options.subfolder ?? '')}
          onChange={(event) => onPatch({ subfolder: event.target.value })}
          placeholder="approved"
        />
      </label>
    );
  }

  return <p className="text-xs text-textSecondary">No options needed for this step.</p>;
}

export function AutomationScreen({ jobs }: { jobs: JobItem[] }): JSX.Element {
  const { queueJob, updateJob } = useAppState();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(() => loadWorkflows());
  const [draft, setDraft] = useState<WorkflowDefinition>(() => defaultWorkflow());
  const [queue, setQueue] = useState<WorkflowQueueItem[]>([]);
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [sourceInput, setSourceInput] = useState<string>('');
  const [outputDirectory, setOutputDirectory] = useState<string>('/processed');

  useEffect(() => {
    saveWorkflows(workflows);
  }, [workflows]);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  const automationJobs = useMemo(() => jobs.filter((job) => job.type.startsWith('Automation ·')), [jobs]);

  useEffect(() => {
    const nextJob = queue.find((item) => item.status === 'queued');
    if (!nextJob || activeJobId) {
      return;
    }

    const workflow = workflows.find((item) => item.id === nextJob.workflowId);
    if (!workflow) {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === nextJob.id ? { ...item, status: 'failed', error: 'Workflow definition not found.', updatedAt: nowIso() } : item
        )
      );
      updateJob(nextJob.id, { status: 'failed', message: 'Workflow definition not found.', progress: 0 });
      return;
    }

    const startedAt = nowIso();
    setActiveJobId(nextJob.id);
    setQueue((prev) => prev.map((item) => (item.id === nextJob.id ? { ...item, status: 'running', updatedAt: startedAt } : item)));
    updateJob(nextJob.id, { status: 'running', message: 'Starting workflow...', progress: 5 });

    void executeWorkflow(workflow, nextJob, {
      onStepStart: (stepIndex, step) => {
        const progress = Math.max(10, Math.round(((stepIndex + 1) / workflow.steps.length) * 90));
        setQueue((prev) =>
          prev.map((item) =>
            item.id === nextJob.id
              ? { ...item, currentStepIndex: stepIndex, currentStepLabel: stepLabel(step.type), updatedAt: nowIso() }
              : item
          )
        );
        updateJob(nextJob.id, { status: 'running', progress, message: `Running ${stepLabel(step.type)}...` });
      }
    })
      .then((result) => {
        const finishedAt = nowIso();
        setQueue((prev) => prev.map((item) => (item.id === nextJob.id ? { ...item, status: 'completed', updatedAt: finishedAt } : item)));
        updateJob(nextJob.id, { status: 'completed', progress: 100, message: `Saved ${result.outputFiles.length} file(s).` });

        const newHistory: WorkflowHistoryItem = {
          id: nextJob.id,
          workflowId: nextJob.workflowId,
          workflowName: nextJob.workflowName,
          sourcePaths: nextJob.sourcePaths,
          outputDirectory: nextJob.outputDirectory,
          status: 'completed',
          startedAt,
          finishedAt,
          executedSteps: result.executedSteps,
          outputFiles: result.outputFiles
        };

        setHistory((prev) => [newHistory, ...prev].slice(0, 30));
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Workflow execution failed.';
        const finishedAt = nowIso();
        setQueue((prev) =>
          prev.map((item) =>
            item.id === nextJob.id ? { ...item, status: 'failed', error: message, updatedAt: finishedAt } : item
          )
        );
        updateJob(nextJob.id, { status: 'failed', progress: 0, message });

        const failedHistory: WorkflowHistoryItem = {
          id: nextJob.id,
          workflowId: nextJob.workflowId,
          workflowName: nextJob.workflowName,
          sourcePaths: nextJob.sourcePaths,
          outputDirectory: nextJob.outputDirectory,
          status: 'failed',
          startedAt,
          finishedAt,
          executedSteps: [],
          outputFiles: [],
          error: message
        };

        setHistory((prev) => [failedHistory, ...prev].slice(0, 30));
      })
      .finally(() => {
        setActiveJobId(null);
      });
  }, [activeJobId, queue, updateJob, workflows]);

  const saveDraftWorkflow = (): void => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      return;
    }

    const timestamp = nowIso();
    setWorkflows((prev) => {
      const exists = prev.some((item) => item.id === draft.id);
      if (exists) {
        return prev.map((item) => (item.id === draft.id ? { ...draft, name: trimmedName, updatedAt: timestamp } : item));
      }
      return [...prev, { ...draft, name: trimmedName, createdAt: timestamp, updatedAt: timestamp }];
    });
    setSelectedWorkflowId(draft.id);
  };

  const queueSelectedWorkflow = (): void => {
    if (!selectedWorkflow) {
      return;
    }

    const sourcePaths = parseLines(sourceInput);
    if (sourcePaths.length === 0) {
      return;
    }

    const queueItem: WorkflowQueueItem = {
      id: id('run'),
      workflowId: selectedWorkflow.id,
      workflowName: selectedWorkflow.name,
      sourcePaths,
      outputDirectory: outputDirectory.trim() || '/processed',
      status: 'queued',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      currentStepIndex: 0
    };

    setQueue((prev) => [...prev, queueItem]);
    queueJob(buildAutomationJob(queueItem));
    setSourceInput('');
  };

  const applyTemplate = (template: (typeof starterTemplates)[number]): void => {
    setDraft({
      ...defaultWorkflow(),
      name: template.name,
      description: template.description,
      steps: template.steps.map((stepType) => ({
        id: id('step'),
        type: stepType,
        options: stepDefaults(stepType)
      }))
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <ModuleCard
          title="Workflow Builder"
          description="Create reusable, human-readable automation sequences. Keep every step explicit so operators can understand what runs."
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-textSecondary">
                Workflow name
                <input
                  className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-textSecondary">
                Trigger mode
                <select
                  className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                  value={draft.trigger.type}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      trigger: {
                        ...prev.trigger,
                        type: event.target.value as WorkflowDefinition['trigger']['type']
                      }
                    }))
                  }
                >
                  <option value="manual">Manual (current)</option>
                  <option value="watched-folder">Watched folder (future-ready)</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-textSecondary">
              Description
              <textarea
                rows={2}
                className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>

            {draft.trigger.type === 'watched-folder' ? (
              <p className="rounded-md border border-border bg-panelElevated px-2 py-2 text-xs text-textSecondary">
                Watched-folder triggers are not active yet. This field is stored to keep workflow models forward-compatible.
              </p>
            ) : null}

            <div className="space-y-2 rounded-xl border border-border/80 bg-panelElevated p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-textPrimary">Workflow steps</p>
                <button
                  type="button"
                  className="rounded-md border border-border px-2 py-1 text-xs text-textPrimary"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: [...prev.steps, { id: id('step'), type: 'save', options: stepDefaults('save') }]
                    }))
                  }
                >
                  + Add step
                </button>
              </div>

              <div className="space-y-2">
                {draft.steps.map((step, stepIndex) => (
                  <div key={step.id} className="rounded-lg border border-border bg-panel p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs text-textSecondary">{stepIndex + 1}.</span>
                      <select
                        className="flex-1 rounded-md border border-border bg-panelElevated px-2 py-1 text-sm text-textPrimary"
                        value={step.type}
                        onChange={(event) => {
                          const nextType = event.target.value as WorkflowStepType;
                          setDraft((prev) => ({
                            ...prev,
                            steps: prev.steps.map((item) =>
                              item.id === step.id ? { ...item, type: nextType, options: stepDefaults(nextType) } : item
                            )
                          }));
                        }}
                      >
                        {supportedStepTypes.map((stepType) => (
                          <option key={stepType} value={stepType}>
                            {stepLabel(stepType)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-1 text-xs text-textSecondary"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, steps: prev.steps.filter((item) => item.id !== step.id) }))
                        }
                        disabled={draft.steps.length <= 1}
                      >
                        Remove
                      </button>
                    </div>

                    <StepOptionsEditor
                      step={step}
                      onPatch={(patch) =>
                        setDraft((prev) => ({
                          ...prev,
                          steps: prev.steps.map((item) =>
                            item.id === step.id ? { ...item, options: { ...item.options, ...patch } } : item
                          )
                        }))
                      }
                    />
                    <p className="mt-2 text-xs text-textSecondary">{stepSummary(step)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-border px-3 py-1.5 text-sm" onClick={saveDraftWorkflow}>
                Save workflow
              </button>
              <button type="button" className="rounded-md border border-border px-3 py-1.5 text-sm" onClick={() => setDraft(defaultWorkflow())}>
                New blank
              </button>
              {starterTemplates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-textSecondary"
                  onClick={() => applyTemplate(template)}
                >
                  Use template: {template.name}
                </button>
              ))}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Saved Workflows" description="Reusable workflows are stored locally so teams can rerun dependable processes.">
          <div className="space-y-2">
            {workflows.length === 0 ? (
              <p className="text-sm text-textSecondary">No saved workflows yet.</p>
            ) : (
              workflows.map((workflow) => (
                <div key={workflow.id} className="rounded-lg border border-border bg-panelElevated p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-textPrimary">{workflow.name}</p>
                      <p className="text-xs text-textSecondary">{workflow.steps.map((step) => stepLabel(step.type)).join(' → ')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-1 text-xs"
                        onClick={() => {
                          setDraft(workflow);
                          setSelectedWorkflowId(workflow.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-1 text-xs text-textSecondary"
                        onClick={() => setWorkflows((prev) => prev.filter((item) => item.id !== workflow.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ModuleCard>
      </div>

      <div className="space-y-4">
        <ModuleCard title="Job Queue" description="Queue multiple document jobs and process them one workflow run at a time for reliable sequencing.">
          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-xs text-textSecondary">
              Workflow to run
              <select
                className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                value={selectedWorkflowId}
                onChange={(event) => setSelectedWorkflowId(event.target.value)}
              >
                <option value="">Select a saved workflow</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-textSecondary">
              Source files (one path per line)
              <textarea
                rows={3}
                className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                value={sourceInput}
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder={'/docs/a.pdf\n/docs/b.pdf'}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-textSecondary">
              Output directory
              <input
                className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-textPrimary"
                value={outputDirectory}
                onChange={(event) => setOutputDirectory(event.target.value)}
              />
            </label>

            <button type="button" className="rounded-md border border-border px-3 py-1.5 text-sm" onClick={queueSelectedWorkflow}>
              Queue workflow job
            </button>

            <div className="space-y-2 rounded-xl border border-border/80 bg-panelElevated p-3">
              <p className="text-sm font-medium text-textPrimary">Queued / running jobs</p>
              {queue.length === 0 ? (
                <p className="text-sm text-textSecondary">No workflow jobs queued yet.</p>
              ) : (
                queue.map((job) => (
                  <div key={job.id} className="rounded-md border border-border bg-panel p-2 text-xs">
                    <p className="font-medium text-textPrimary">{job.workflowName}</p>
                    <p className="text-textSecondary">
                      {formatStatus(job.status)}
                      {job.currentStepLabel ? ` · ${job.currentStepLabel}` : ''}
                    </p>
                    {job.error ? <p className="mt-1 text-red-300">{job.error}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard
          title="Job History"
          description="Review outcomes quickly. Failures include a step-level message so teams can troubleshoot without logs."
        >
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-textSecondary">No workflow runs completed yet.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-panelElevated p-3">
                  <p className="text-sm font-medium text-textPrimary">{item.workflowName}</p>
                  <p className="text-xs text-textSecondary">
                    {item.status === 'completed' ? 'Completed' : 'Failed'} · {item.sourcePaths.length} source file(s)
                  </p>
                  {item.executedSteps.length > 0 ? (
                    <p className="mt-1 text-xs text-textSecondary">Steps: {item.executedSteps.join(' → ')}</p>
                  ) : null}
                  {item.error ? <p className="mt-1 text-xs text-red-300">{item.error}</p> : null}
                </div>
              ))
            )}
          </div>
        </ModuleCard>

        <ModuleCard title="Automation Module Status" description="Shared global queue visibility for all automation runs.">
          <div className="rounded-lg border border-border bg-panelElevated px-3 py-2 text-sm text-textSecondary">
            {automationJobs.length} automation jobs tracked globally ({jobs.length} total application jobs).
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
