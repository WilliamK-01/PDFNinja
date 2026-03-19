export function CommandBar(): JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 shadow-soft">
      <div className="rounded-lg border border-border bg-panelElevated px-2 py-1 text-xs text-textSecondary">⌘K</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-textPrimary">Search tools, commands, and files</p>
        <p className="truncate text-xs text-textSecondary">Jump to Merge, open recent docs, or run automation recipes.</p>
      </div>
      <button className="rounded-lg border border-border bg-panelElevated px-3 py-1.5 text-xs text-textSecondary transition hover:border-accent hover:text-textPrimary">
        Open palette
      </button>
    </div>
  );
}
