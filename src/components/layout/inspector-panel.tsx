export function InspectorPanel(): JSX.Element {
  return (
    <aside className="w-72 border-l border-border bg-panel p-4">
      <h3 className="text-sm font-semibold text-textPrimary">Inspector</h3>
      <p className="mt-2 text-sm text-textSecondary">
        Context-aware properties, annotations, and object controls will appear here.
      </p>
    </aside>
  );
}
