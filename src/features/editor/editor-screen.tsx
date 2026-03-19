import { useEffect, useMemo, useRef, useState } from 'react';
import { buildViewerUrl, createDocumentFromFile } from '@/features/editor/document-open';
import { runPageOperation } from '@/features/editor/page-operations-api';
import { useAppState } from '@/state/app-state';
import type { OpenDocument, PageOperationRequest, PageOperationType } from '@/shared/types';

interface EditorScreenProps {
  documents: OpenDocument[];
  activeDocumentId: string | null;
}

type FitMode = 'none' | 'width' | 'page';

const THUMB_HEIGHT = 116;
const THUMB_OVERSCAN = 8;

function buildOutputPath(sourcePath: string, suffix: string): string {
  if (!sourcePath.toLowerCase().endsWith('.pdf')) {
    return `${sourcePath}-${suffix}.pdf`;
  }
  return sourcePath.replace(/\.pdf$/i, `-${suffix}.pdf`);
}

export function EditorScreen({ documents, activeDocumentId }: EditorScreenProps): JSX.Element {
  const { openDocument, queueJob, updateDocument, updateJob } = useAppState();
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [pageInput, setPageInput] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [rotation, setRotation] = useState(0);
  const [organizerMode, setOrganizerMode] = useState(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [pageOrder, setPageOrder] = useState<number[]>([1]);
  const [lastSelectedPage, setLastSelectedPage] = useState<number | null>(1);
  const [rotateDegrees, setRotateDegrees] = useState<90 | 180 | 270>(90);
  const [extractOutputPath, setExtractOutputPath] = useState('');
  const [operationBusy, setOperationBusy] = useState(false);
  const [thumbScrollTop, setThumbScrollTop] = useState(0);
  const pickerRef = useRef<HTMLInputElement>(null);

  const active = useMemo(() => documents.find((doc) => doc.id === activeDocumentId) ?? null, [activeDocumentId, documents]);

  useEffect(() => {
    setPageInput(String(active?.activePage ?? 1));
  }, [active?.activePage, active?.id]);

  useEffect(() => {
    const count = Math.max(active?.pageCount ?? 1, 1);
    const initialOrder = Array.from({ length: count }, (_, index) => index + 1);
    setPageOrder(initialOrder);
    setSelectedPages([active?.activePage ?? 1]);
    setLastSelectedPage(active?.activePage ?? 1);
    setExtractOutputPath(active ? buildOutputPath(active.path, 'extract') : '');
  }, [active?.id, active?.pageCount, active?.activePage, active?.path]);

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

  function selectPage(page: number, options: { append: boolean; range: boolean }): void {
    if (options.range && lastSelectedPage) {
      const start = Math.min(lastSelectedPage, page);
      const end = Math.max(lastSelectedPage, page);
      const next = Array.from(new Set([...selectedPages, ...Array.from({ length: end - start + 1 }, (_, idx) => start + idx)])).sort(
        (a, b) => a - b
      );
      setSelectedPages(next);
    } else if (options.append) {
      setSelectedPages((prev) => {
        if (prev.includes(page)) {
          return prev.filter((item) => item !== page);
        }
        return [...prev, page].sort((a, b) => a - b);
      });
      setLastSelectedPage(page);
    } else {
      setSelectedPages([page]);
      setLastSelectedPage(page);
    }

    goToPage(page);
  }

  function shiftPage(direction: -1 | 1): void {
    if (selectedPages.length === 0) return;
    const selected = new Set(selectedPages);
    const next = [...pageOrder];
    const iterate = direction === -1 ? 1 : next.length - 2;
    const end = direction === -1 ? next.length : -1;

    for (let index = iterate; index !== end; index += direction === -1 ? 1 : -1) {
      const current = next[index];
      const neighborIndex = index + direction;
      const neighbor = next[neighborIndex];

      if (!selected.has(current) && selected.has(neighbor)) {
        next[index] = neighbor;
        next[neighborIndex] = current;
      }
    }

    setPageOrder(next);
  }

  async function executePageOperation(operation: PageOperationType, override: Partial<PageOperationRequest> = {}): Promise<void> {
    if (!active || operationBusy) return;

    const selection = [...selectedPages].sort((a, b) => a - b);
    if (selection.length === 0 && operation !== 'reorder-pages') {
      alert('Select at least one page first.');
      return;
    }

    if (operation === 'delete-pages') {
      const ok = window.confirm(`Delete ${selection.length} selected page(s) from a new output file? This cannot be undone.`);
      if (!ok) return;
    }

    const outputPath =
      override.outputPath ??
      (operation === 'extract-pages' ? extractOutputPath.trim() : buildOutputPath(active.path, operation.replace('-pages', '')));

    const request: PageOperationRequest = {
      operation,
      sourcePath: active.path,
      outputPath,
      selectedPages: selection,
      targetOrder: operation === 'reorder-pages' ? pageOrder : undefined,
      degrees: operation === 'rotate-pages' ? rotateDegrees : undefined,
      ...override
    };

    setOperationBusy(true);
    try {
      const job = await runPageOperation(request);
      queueJob(job);
      updateJob(job.id, job);

      if (job.status === 'completed') {
        updateActive({
          path: job.outputPath,
          sourceUrl: undefined,
          modifiedAt: new Date().toISOString(),
          activePage: 1
        });
        setSelectedPages([1]);
        setLastSelectedPage(1);
        setPageOrder(Array.from({ length: effectivePageCount }, (_, idx) => idx + 1));
      } else {
        alert(job.message ?? 'Page operation failed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown page operation failure';
      alert(message);
    } finally {
      setOperationBusy(false);
    }
  }

  const viewerSrc = active
    ? buildViewerUrl(active, {
        page: active.activePage,
        zoom,
        fitMode
      })
    : null;

  const orderedPages = pageOrder.length === effectivePageCount ? pageOrder : Array.from({ length: effectivePageCount }, (_, index) => index + 1);
  const viewportHeight = 560;
  const startIndex = Math.max(Math.floor(thumbScrollTop / THUMB_HEIGHT) - THUMB_OVERSCAN, 0);
  const endIndex = Math.min(Math.ceil((thumbScrollTop + viewportHeight) / THUMB_HEIGHT) + THUMB_OVERSCAN, orderedPages.length);
  const visiblePages = orderedPages.slice(startIndex, endIndex);
  const topSpacer = startIndex * THUMB_HEIGHT;
  const bottomSpacer = Math.max(0, (orderedPages.length - endIndex) * THUMB_HEIGHT);

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

        <button
          onClick={() => setOrganizerMode((prev) => !prev)}
          className={`rounded-lg border px-3 py-1.5 text-xs ${organizerMode ? 'border-accent bg-accent/20' : 'border-border bg-panel'}`}
        >
          {organizerMode ? 'Organizer On' : 'Organizer Off'}
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

      <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr_320px]">
        <aside className="overflow-hidden border-r border-border bg-panelElevated/40 p-2">
          <div className="px-2 py-1">
            <h3 className="text-xs uppercase tracking-wide text-textSecondary">{organizerMode ? 'Page organizer' : 'Thumbnails'}</h3>
            {organizerMode ? <p className="mt-1 text-[11px] text-textSecondary">Cmd/Ctrl-click multi-select, Shift-click range.</p> : null}
          </div>

          <div className="mt-2 h-[560px] overflow-auto" onScroll={(event) => setThumbScrollTop(event.currentTarget.scrollTop)}>
            <div style={{ paddingTop: topSpacer, paddingBottom: bottomSpacer }} className="space-y-2">
              {visiblePages.map((page) => {
                const isActive = active?.activePage === page;
                const isSelected = selectedPages.includes(page);
                return (
                  <button
                    key={page}
                    onClick={(event) =>
                      selectPage(page, {
                        append: event.metaKey || event.ctrlKey,
                        range: event.shiftKey
                      })
                    }
                    className={`w-full rounded-lg border p-2 text-left transition ${
                      isSelected ? 'border-accent bg-accent/20' : isActive ? 'border-accent/70 bg-panel' : 'border-border bg-panel hover:border-accent/60'
                    }`}
                  >
                    <div className="flex h-20 items-center justify-center rounded border border-border bg-background text-xs text-textSecondary">
                      Page {page}
                    </div>
                    <p className="mt-1 text-xs text-textSecondary">{isSelected ? 'Selected' : isActive ? 'Active' : 'Click to select'}</p>
                  </button>
                );
              })}
            </div>
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
          <h3 className="text-sm font-semibold text-textPrimary">Page Actions</h3>
          <p className="mt-1 text-xs text-textSecondary">{selectedPages.length} selected · {effectivePageCount} total pages</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => shiftPage(-1)}
              disabled={operationBusy}
              className="rounded border border-border bg-panel px-2 py-1 text-xs disabled:opacity-50"
            >
              Move up
            </button>
            <button
              onClick={() => shiftPage(1)}
              disabled={operationBusy}
              className="rounded border border-border bg-panel px-2 py-1 text-xs disabled:opacity-50"
            >
              Move down
            </button>
            <button
              onClick={() => void executePageOperation('reorder-pages')}
              disabled={operationBusy}
              className="col-span-2 rounded border border-accent/70 bg-accent/20 px-2 py-1 text-xs disabled:opacity-50"
            >
              Apply page order
            </button>
            <button
              onClick={() => void executePageOperation('delete-pages')}
              disabled={operationBusy}
              className="rounded border border-red-400/70 bg-red-500/10 px-2 py-1 text-xs text-red-200 disabled:opacity-50"
            >
              Delete selected
            </button>
            <button
              onClick={() => void executePageOperation('duplicate-pages')}
              disabled={operationBusy}
              className="rounded border border-border bg-panel px-2 py-1 text-xs disabled:opacity-50"
            >
              Duplicate selected
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-panel p-3 text-xs">
            <h4 className="font-medium text-textPrimary">Rotate selected pages</h4>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={rotateDegrees}
                onChange={(event) => setRotateDegrees(Number(event.target.value) as 90 | 180 | 270)}
                className="flex-1 rounded border border-border bg-panelElevated px-2 py-1"
              >
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
              <button
                onClick={() => void executePageOperation('rotate-pages')}
                disabled={operationBusy}
                className="rounded border border-border bg-panel px-2 py-1 disabled:opacity-50"
              >
                Rotate
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-panel p-3 text-xs">
            <h4 className="font-medium text-textPrimary">Extract selected pages</h4>
            <input
              value={extractOutputPath}
              onChange={(event) => setExtractOutputPath(event.target.value)}
              className="mt-2 w-full rounded border border-border bg-panelElevated px-2 py-1 text-xs text-textPrimary"
              placeholder="/path/to/extracted.pdf"
            />
            <button
              onClick={() => void executePageOperation('extract-pages', { outputPath: extractOutputPath })}
              disabled={operationBusy || !extractOutputPath.trim()}
              className="mt-2 w-full rounded border border-border bg-panel px-2 py-1 disabled:opacity-50"
            >
              Extract to new PDF
            </button>
          </div>

          {active ? (
            <dl className="mt-4 space-y-2 text-xs">
              <div>
                <dt className="text-textSecondary">Name</dt>
                <dd className="text-textPrimary">{active.name}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">Path</dt>
                <dd className="break-all text-textPrimary">{active.path}</dd>
              </div>
              <div>
                <dt className="text-textSecondary">Pages</dt>
                <dd className="text-textPrimary">{active.pageCount ?? 'Unknown (native viewer managed)'}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-textSecondary">No document selected.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
