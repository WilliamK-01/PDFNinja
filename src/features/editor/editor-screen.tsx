import { ModuleCard } from '@/components/layout/module-card';
import type { OpenDocument } from '@/shared/types';

interface EditorScreenProps {
  documents: OpenDocument[];
  activeDocumentId: string | null;
}

export function EditorScreen({ documents, activeDocumentId }: EditorScreenProps): JSX.Element {
  const active = documents.find((doc) => doc.id === activeDocumentId);

  return (
    <div className="space-y-4">
      <ModuleCard
        title="Editor Workspace"
        description="Canvas, layers, annotation system, and page-level controls will live in this area."
      >
        {active ? (
          <div className="rounded-lg border border-border bg-panelElevated px-3 py-2 text-sm text-textSecondary">
            Active document: <span className="text-textPrimary">{active.name}</span> ({active.pageCount} pages)
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-sm text-textSecondary">
            No document is open. Integrate file-open command to load a PDF into the editor.
          </div>
        )}
      </ModuleCard>
    </div>
  );
}
