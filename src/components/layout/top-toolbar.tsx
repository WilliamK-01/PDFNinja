interface TopToolbarProps {
  title: string;
  activeTool: string | null;
}

export function TopToolbar({ title, activeTool }: TopToolbarProps): JSX.Element {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-panel px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Mode</p>
        <h2 className="text-sm font-semibold text-textPrimary">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-border bg-panelElevated px-3 py-1.5 text-xs text-textSecondary">
          Active tool: <span className="text-textPrimary">{activeTool ?? 'None'}</span>
        </div>
        <button className="rounded-lg border border-border bg-panelElevated px-3 py-1.5 text-xs text-textSecondary hover:text-textPrimary">
          Command Palette
        </button>
      </div>
    </header>
  );
}
