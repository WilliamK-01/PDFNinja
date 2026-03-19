import { CommandBar } from '@/components/home/command-bar';
import { ModeCard } from '@/components/home/mode-card';
import { SectionPanel } from '@/components/home/section-panel';
import type { AppRoute, OpenDocument } from '@/shared/types';

interface HomeScreenProps {
  recentFiles: OpenDocument[];
  onNavigate: (route: AppRoute) => void;
  onOpenRecent: (doc: OpenDocument) => void;
}

const pinnedTools = [
  { label: 'Merge PDFs', route: 'quick-tools' as const, hint: 'Combine files quickly' },
  { label: 'Compress PDF', route: 'quick-tools' as const, hint: 'Reduce sharing size' },
  { label: 'Edit Pages', route: 'editor' as const, hint: 'Reorder, rotate, crop' },
  { label: 'Compare Docs', route: 'editor' as const, hint: 'Detect revision changes' },
  { label: 'Batch Convert', route: 'automation' as const, hint: 'Office/image to PDF' },
  { label: 'Build Workflow', route: 'automation' as const, hint: 'Saved repeatable pipeline' }
];

export function HomeScreen({ recentFiles, onNavigate, onOpenRecent }: HomeScreenProps): JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-5">
      <section className="rounded-2xl border border-border bg-panel p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">Workspace</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-textPrimary">Welcome back to PDFNinja</h1>
            <p className="mt-2 max-w-3xl text-sm text-textSecondary">
              Pick how you want to work today: speed through simple fixes, dive into advanced editing, or set up repeatable automation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('quick-tools')}
            className="rounded-xl border border-accent/50 bg-accent/20 px-4 py-2 text-sm font-medium text-textPrimary transition hover:border-accent hover:bg-accent/30"
          >
            Start in Express
          </button>
        </div>
      </section>

      <CommandBar />

      <section className="grid gap-4 lg:grid-cols-3">
        <ModeCard
          title="Express"
          subtitle="Quick actions"
          details="Merge, split, compress, and convert PDFs with streamlined flows for one-off tasks and fast turnarounds."
          accent="blue"
          route="quick-tools"
          onSelect={onNavigate}
        />
        <ModeCard
          title="Editor"
          subtitle="Deep document control"
          details="Open complex files for viewing, annotation, editing, side-by-side compare, and form preparation."
          accent="violet"
          route="editor"
          onSelect={onNavigate}
        />
        <ModeCard
          title="Automation"
          subtitle="Scale repeat work"
          details="Batch process documents, save workflows, and prepare for watched-folder jobs as automation grows."
          accent="emerald"
          route="automation"
          onSelect={onNavigate}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <SectionPanel title="Recent files" subtitle="Resume your latest documents where you left off." actionLabel="View all">
          {recentFiles.length > 0 ? (
            <div className="space-y-2">
              {recentFiles.slice(0, 5).map((file) => (
                <button
                  key={file.id}
                  onClick={() => onOpenRecent(file)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-panelElevated px-3 py-2 text-left transition hover:border-accent/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-textPrimary">{file.name}</p>
                    <p className="truncate text-xs text-textSecondary">{file.path}</p>
                  </div>
                  <span className="ml-3 text-xs text-textSecondary">{file.pageCount ?? '—'} pages</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-panelElevated/50 px-4 py-6 text-sm text-textSecondary">
              No recent files yet. Open a PDF in Express or Editor and it will appear here.
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Pinned tools" subtitle="Most-used actions for high-throughput work." actionLabel="Customize">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {pinnedTools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => onNavigate(tool.route)}
                className="rounded-xl border border-border bg-panelElevated px-3 py-2 text-left transition hover:border-accent/70 hover:bg-panel"
              >
                <p className="text-sm font-medium text-textPrimary">{tool.label}</p>
                <p className="mt-1 text-xs text-textSecondary">{tool.hint}</p>
              </button>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
