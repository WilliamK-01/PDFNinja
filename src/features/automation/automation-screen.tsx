import { ModuleCard } from '@/components/layout/module-card';
import type { JobItem } from '@/shared/types';

export function AutomationScreen({ jobs }: { jobs: JobItem[] }): JSX.Element {
  return (
    <div className="space-y-4">
      <ModuleCard
        title="Automation Pipelines"
        description="Define reusable workflows composed of operations, conditions, and output strategies."
      >
        <div className="rounded-lg border border-border bg-panelElevated px-3 py-2 text-sm text-textSecondary">
          {jobs.length} jobs currently tracked by in-memory queue state.
        </div>
      </ModuleCard>
    </div>
  );
}
