import { useEffect, useMemo, useRef, useState } from 'react';
import { buildViewerUrl, createDocumentFromFile } from '@/features/editor/document-open';
import { useAppState } from '@/state/app-state';
import type { OpenDocument } from '@/shared/types';

interface EditorScreenProps {
  documents: OpenDocument[];
  activeDocumentId: string | null;
}

type FitMode = 'none' | 'width' | 'page';

export function EditorScreen({ documents, activeDocumentId }: EditorScreenProps): JSX.Element {
  const { openDocument, updateDocument } = useAppState();
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [pageInput, setPageInput] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [rotation, setRotation] = useState(0);
  const pickerRef = useRef<HTMLInputElement>(null);

  const active = useMemo(() => documents.find((doc) => doc.id === activeDocumentId) ?? null, [activeDocumentId, documents]);

  useEffect(() => {
    setPageInput(String(active?.activePage ?? 1));
  }, [active?.activePage, active?.id]);

  const effectivePageCount = active?.pageCount ?? 1;

  function updateActive(patch: Partial<OpenDocument>): void {
    if (!active) return;
    updateDocument(active.id, patch);
  }

  function openFromPicker(list: FileList | null): void {
    const file = list?.[0];
    if (!file) return;
    openDocument(createDocumentFromFile(file));
    setZoom(100);
    setFitMode('width');
    setRotation(0);
  }

  function goToPage(nextPage: number): void {
    if (!active) return;
    const bounded = Math.min(Math.max(1, nextPage), effectivePageCount);
    updateActive({ activePage: bounded });
    setPageInput(String(bounded));
  }

  function zoomBy(step: number): void {
    setFitMode('none');
    setZoom((prev) => Math.min(300, Math.max(25, prev + step)));
  }

  const viewerSrc = active
    ? buildViewerUrl(active, {
        page: active.activePage,
        zoom,
        fitMode
      })
    : null;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-panel">
      <input
        ref={pickerRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => openFromPicker(event.target.files)}
      />

      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-panelElevated/70 px-3 py-2">
        <button
          onClick={() => pickerRef.current?.click()}
          className="rounded-lg border border-accent/50 bg-accent/20 px-3 py-1.5 text-xs text-textPrimary hover:border-accent"
        >
          Open PDF
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        <button onClick={() => goToPage((active?.activePage ?? 1) - 1)} className="rounded border border-border px-2 py-1 text-xs">
          ◀
        </button>
        <button onClick={() => goToPage((active?.activePage ?? 1) + 1)} className="rounded border border-border px-2 py-1 text-xs">
          ▶
        </button>

        <label className="flex items-center gap-1 rounded border border-border bg-panel px-2 py-1 text-xs text-textSecondary">
          Page
          <input
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={() => goToPage(Number(pageInput) || 1)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                goToPage(Number(pageInput) || 1);
              }
            }}
            className="w-12 border-none bg-transparent text-right text-textPrimary outline-none"
          />
          / {effectivePageCount}
        </label>

        <div className="mx-2 h-5 w-px bg-border" />

        <button onClick={() => zoomBy(-10)} className="rounded border border-border px-2 py-1 text-xs">
          -
        </button>
        <span className="rounded border border-border bg-panel px-2 py-1 text-xs text-textPrimary">{zoom}%</span>
        <button onClick={() => zoomBy(10)} className="rounded border border-border px-2 py-1 text-xs">
          +
        </button>

        <button onClick={() => setFitMode('width')} className="rounded border border-border px-2 py-1 text-xs">
          Fit width
        </button>
        <button onClick={() => setFitMode('page')} className="rounded border border-border px-2 py-1 text-xs">
          Fit page
        </button>

        <button onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)} className="rounded border border-border px-2 py-1 text-xs">
          ↺
        </button>
        <button onClick={() => setRotation((prev) => (prev + 90) % 360)} className="rounded border border-border px-2 py-1 text-xs">
          ↻
        </button>

        <label className="ml-auto flex min-w-56 items-center gap-2 rounded border border-border bg-panel px-2 py-1 text-xs text-textSecondary">
          Search
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Placeholder for in-document text search"
            className="w-full border-none bg-transparent text-textPrimary outline-none"
          />
        </label>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_280px]">
        <aside className="overflow-auto border-r border-border bg-panelElevated/40 p-2">
          <h3 className="px-2 py-1 text-xs uppercase tracking-wide text-textSecondary">Thumbnails</h3>
          <div className="mt-2 space-y-2">
            {Array.from({ length: effectivePageCount }).map((_, index) => {
              const page = index + 1;
              const isActive = active?.activePage === page;
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-full rounded-lg border p-2 text-left transition ${
                    isActive ? 'border-accent bg-accent/20' : 'border-border bg-panel hover:border-accent/60'
                  }`}
                >
                  <div className="flex h-20 items-center justify-center rounded border border-border bg-background text-xs text-textSecondary">
                    Page {page}
                  </div>
                  <p className="mt-1 text-xs text-textSecondary">{isActive ? 'Active' : 'Jump to page'}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-h-0 overflow-auto bg-background p-4">
          {active && viewerSrc ? (
            <div className="mx-auto max-w-5xl rounded-xl border border-border bg-panel p-2 shadow-soft">
              <iframe
                title={active.name}
                src={viewerSrc}
                className="h-[76vh] w-full rounded-lg border border-border bg-white"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-panelElevated/40 p-6 text-sm text-textSecondary">
              Open a PDF from the toolbar, recent files, or a Quick Tool output to start viewing.
            </div>
          )}
        </main>

        <aside className="overflow-auto border-l border-border bg-panelElevated/40 p-4">
          <h3 className="text-sm font-semibold text-textPrimary">Inspector</h3>
          {active ? (
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="text-textSecondary">Name</dt>
                <dd className="text-textPrimary">{active.name}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">Source</dt>
                <dd className="text-textPrimary">{active.source}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">Path</dt>
                <dd className="break-all text-textPrimary">{active.path}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">Pages</dt>
                <dd className="text-textPrimary">{active.pageCount ?? 'Unknown (native viewer managed)'}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">File size</dt>
                <dd className="text-textPrimary">
                  {active.metadata?.byteSize ? `${(active.metadata.byteSize / 1024 / 1024).toFixed(2)} MB` : 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt className="text-textSecondary">Last modified</dt>
                <dd className="text-textPrimary">{active.modifiedAt}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-textSecondary">No document selected.</p>
          )}

          <div className="mt-5 rounded-lg border border-border bg-panel p-3 text-xs text-textSecondary">
            Annotation, redaction, compare, page-organization, and forms modules can register here through future panel slots.
          </div>
        </aside>
      </div>
    </section>
  );
}
