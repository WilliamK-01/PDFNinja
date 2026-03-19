import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionPanelProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
}

export function SectionPanel({ title, subtitle, actionLabel, children, className }: SectionPanelProps): JSX.Element {
  return (
    <section className={cn('rounded-2xl border border-border bg-panel/95 p-5 shadow-soft', className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-textPrimary">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-textSecondary">{subtitle}</p> : null}
        </div>
        {actionLabel ? (
          <button className="rounded-lg border border-border bg-panelElevated px-3 py-1.5 text-xs font-medium text-textSecondary transition hover:border-accent hover:text-textPrimary">
            {actionLabel}
          </button>
        ) : null}
      </header>
      {children}
    </section>
  );
}
