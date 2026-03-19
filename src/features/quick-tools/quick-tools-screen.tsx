import { useMemo, useState } from 'react';
import { ModuleCard } from '@/components/layout/module-card';
import { QuickToolWorkflow } from '@/features/quick-tools/quick-tool-workflow';
import { QUICK_TOOLS, getQuickTool } from '@/features/quick-tools/tool-definitions';
import { fetchJobs, runQuickToolJob } from '@/features/quick-tools/quick-tools-api';
import { createDocumentFromPath } from '@/features/editor/document-open';
import { useAppState } from '@/state/app-state';
import type { JobItem, QuickToolType } from '@/shared/types';

export function QuickToolsScreen(): JSX.Element {
  const { state, queueJob, updateJob, setActiveTool, openDocument } = useAppState();
  const [activeTool, setActiveToolLocal] = useState<QuickToolType>('merge-pdfs');

  const currentTool = useMemo(() => getQuickTool(activeTool), [activeTool]);
  const latestJob = useMemo<JobItem | null>(() => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
    const key = normalize(currentTool.id);
    const matches = state.jobs.filter((job) => normalize(job.type).includes(key));
    return matches.length ? matches[matches.length - 1] : null;
  }, [currentTool.id, state.jobs]);

  async function handleRun(request: {
    tool: QuickToolType;
    sourcePaths: string[];
    outputPath: string;
    options: Record<string, unknown>;
  }): Promise<void> {
    setActiveTool(request.tool);
    const result = await runQuickToolJob(request);

    const existing = state.jobs.find((job) => job.id === result.id);
    if (!existing) {
      queueJob(result);
    } else {
      updateJob(result.id, result);
    }

    const allJobs = await fetchJobs();
    const knownIds = new Set(state.jobs.map((job) => job.id));
    allJobs.forEach((job) => {
      if (!knownIds.has(job.id)) {
        queueJob(job);
        knownIds.add(job.id);
      } else {
        updateJob(job.id, job);
      }
    });
  }

  function handleOpenOutput(path: string): void {
    if (!path.toLowerCase().endsWith('.pdf')) return;
    openDocument(createDocumentFromPath(path, 'quick-tool'));
  }

  return (
    <div className="space-y-4">
      <ModuleCard title="Quick Tools Dashboard" description="Express workflows for fast offline PDF utility operations.">
        <div className="grid grid-cols-2 gap-3">
          {QUICK_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveToolLocal(tool.id)}
              className={`rounded-lg border px-3 py-4 text-left text-sm transition ${
                activeTool === tool.id
                  ? 'border-accent bg-accent/15 text-textPrimary'
                  : 'border-border bg-panelElevated text-textSecondary hover:border-accent/70'
              }`}
            >
              <p className="font-medium text-textPrimary">{tool.label}</p>
              <p className="mt-1 text-xs">{tool.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide">{tool.status}</p>
            </button>
          ))}
        </div>
      </ModuleCard>

      <QuickToolWorkflow tool={currentTool} recentResult={latestJob} onRun={handleRun} onOpenOutput={handleOpenOutput} />
    </div>
  );
}
