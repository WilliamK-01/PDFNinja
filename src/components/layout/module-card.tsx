import type { ReactNode } from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function ModuleCard({ title, description, children }: ModuleCardProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-panel p-5 shadow-soft">
      <h3 className="text-base font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 text-sm text-textSecondary">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
