import type { JobItem } from '@/shared/types';

export function JobsPanel({ jobs }: { jobs: JobItem[] }): JSX.Element {
  return (
    <section className="h-36 border-t border-border bg-panel px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-textPrimary">Jobs & Status</h3>
        <span className="text-xs text-textSecondary">{jobs.length} queued</span>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {jobs.length === 0 ? (
          <p className="text-sm text-textSecondary">No active jobs. Queue operations from Quick Tools or Automation.</p>
        ) : (
          jobs.slice(-3).map((job) => (
            <div key={job.id} className="rounded-lg border border-border bg-panelElevated px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-textPrimary">{job.type}</span>
                <span className="text-xs text-textSecondary">{job.status}</span>
              </div>
              {job.message ? <p className="mt-1 text-xs text-textSecondary">{job.message}</p> : null}
              <div className="mt-1 h-1.5 rounded bg-border">
                <div className="h-full rounded bg-accent" style={{ width: `${Math.max(job.progress, 6)}%` }} />
              </div>
              {job.type.includes('ocr') && job.details ? (
                <p className="mt-1 text-[11px] text-textSecondary">
                  Pages: {String(job.details.pagesProcessed ?? 'n/a')} · Lang: {String(job.details.languageUsed ?? 'n/a')} · Confidence:{' '}
                  {String(job.details.confidence ?? 'n/a')}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
