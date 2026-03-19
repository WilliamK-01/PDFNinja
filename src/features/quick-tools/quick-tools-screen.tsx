import { ModuleCard } from '@/components/layout/module-card';

const tools = ['Merge', 'Split', 'Compress', 'Convert', 'Protect', 'OCR'];

export function QuickToolsScreen(): JSX.Element {
  return (
    <div className="space-y-4">
      <ModuleCard title="Quick Tools" description="Single-purpose operations optimized for speed and batch selection.">
        <div className="grid grid-cols-3 gap-3">
          {tools.map((tool) => (
            <button
              key={tool}
              className="rounded-lg border border-border bg-panelElevated px-3 py-4 text-sm text-textPrimary hover:border-accent"
            >
              {tool}
            </button>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
