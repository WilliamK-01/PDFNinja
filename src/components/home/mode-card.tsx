import type { AppRoute } from '@/shared/types';
import { cn } from '@/lib/cn';

interface ModeCardProps {
  title: string;
  subtitle: string;
  details: string;
  accent: 'blue' | 'violet' | 'emerald';
  route: Extract<AppRoute, 'quick-tools' | 'editor' | 'automation'>;
  onSelect: (route: AppRoute) => void;
}

const accentClasses = {
  blue: 'from-sky-500/30 to-accent/20 border-sky-400/40 hover:border-sky-300/60',
  violet: 'from-violet-500/30 to-fuchsia-500/20 border-violet-400/40 hover:border-violet-300/60',
  emerald: 'from-emerald-500/30 to-cyan-500/20 border-emerald-400/40 hover:border-emerald-300/60'
};

export function ModeCard({ title, subtitle, details, accent, route, onSelect }: ModeCardProps): JSX.Element {
  return (
    <button
      onClick={() => onSelect(route)}
      className={cn(
        'group relative flex min-h-48 flex-col rounded-2xl border bg-gradient-to-br px-5 py-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5',
        accentClasses[accent]
      )}
    >
      <div className="mb-4 inline-flex w-fit rounded-full border border-white/20 bg-panel/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-textSecondary">
        {subtitle}
      </div>
      <h3 className="text-xl font-semibold text-textPrimary">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-textSecondary">{details}</p>
      <span className="mt-auto pt-6 text-sm font-medium text-textPrimary/90 transition group-hover:text-textPrimary">Open workspace →</span>
    </button>
  );
}
