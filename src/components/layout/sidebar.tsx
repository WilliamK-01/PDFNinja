import type { AppRoute } from '@/shared/types';
import { cn } from '@/lib/cn';

interface SidebarProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const navItems: Array<{ key: AppRoute; label: string; hint: string; icon: string }> = [
  { key: 'home', label: 'Home', hint: 'Overview', icon: '⌂' },
  { key: 'quick-tools', label: 'Quick Tools', hint: 'Fast actions', icon: '⚡' },
  { key: 'editor', label: 'Editor', hint: 'Document workspace', icon: '✎' },
  { key: 'automation', label: 'Automation', hint: 'Pipelines and batches', icon: '◈' },
  { key: 'settings', label: 'Settings', hint: 'App preferences', icon: '⚙' }
];

export function Sidebar({ route, onNavigate }: SidebarProps): JSX.Element {
  return (
    <aside className="w-72 border-r border-border bg-panel px-4 py-6">
      <div className="mb-8 rounded-2xl border border-border bg-panelElevated/40 px-3 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-textSecondary">PDFNinja</p>
        <h1 className="mt-1 text-xl font-semibold text-textPrimary">Desktop Suite</h1>
        <p className="mt-2 text-xs text-textSecondary">Focused PDF production environment</p>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
              route === item.key
                ? 'border-accent/70 bg-accent/20 text-textPrimary shadow-soft'
                : 'border-transparent bg-transparent text-textSecondary hover:border-border hover:bg-panelElevated/60 hover:text-textPrimary'
            )}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panelElevated text-sm">
              {item.icon}
            </span>
            <span>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-textSecondary">{item.hint}</span>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
