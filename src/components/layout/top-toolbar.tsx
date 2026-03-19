interface TopToolbarProps {
  title: string;
  activeTool: string | null;
}

export function TopToolbar({ title, activeTool }: TopToolbarProps): JSX.Element {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-panel/95 px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-textSecondary">Mode</p>
        <h2 className="text-sm font-semibold text-textPrimary">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden min-w-80 items-center gap-2 rounded-xl border border-border bg-panelElevated px-3 py-2 md:flex">
          <span className="text-xs text-textSecondary">⌘K</span>
          <span className="text-xs text-textSecondary">Find commands, files, and tools</span>
        </div>
        <div className="rounded-lg border border-border bg-panelElevated px-3 py-1.5 text-xs text-textSecondary">
          Active tool: <span className="text-textPrimary">{activeTool ?? 'None'}</span>
        </div>
      </div>
    </header>
  );
}
