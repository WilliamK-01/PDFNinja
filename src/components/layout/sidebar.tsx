import type { AppRoute } from '@/shared/types';
import { cn } from '@/lib/cn';

interface SidebarProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const navItems: Array<{ key: AppRoute; label: string; hint: string }> = [
  { key: 'home', label: 'Home', hint: 'Overview' },
  { key: 'quick-tools', label: 'Quick Tools', hint: 'Fast actions' },
  { key: 'editor', label: 'Editor', hint: 'Document workspace' },
  { key: 'automation', label: 'Automation', hint: 'Pipelines and batches' },
  { key: 'settings', label: 'Settings', hint: 'App preferences' }
];

export function Sidebar({ route, onNavigate }: SidebarProps): JSX.Element {
  return (
    <aside className="w-64 border-r border-border bg-panel px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.18em] text-textSecondary">PDFNinja</p>
        <h1 className="mt-2 text-xl font-semibold text-textPrimary">Desktop Suite</h1>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-left transition',
              route === item.key
                ? 'border-accent bg-accent/20 text-textPrimary shadow-soft'
                : 'border-transparent bg-transparent text-textSecondary hover:border-border hover:bg-panelElevated'
            )}
          >
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-textSecondary">{item.hint}</div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
