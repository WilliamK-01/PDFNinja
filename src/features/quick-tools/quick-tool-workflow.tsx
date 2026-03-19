import { useMemo, useState } from 'react';
import type { JobItem, QuickToolJobRequest } from '@/shared/types';
import type { QuickToolDefinition } from '@/features/quick-tools/tool-definitions';

interface SelectedFile {
  name: string;
  path: string;
}

interface QuickToolWorkflowProps {
  tool: QuickToolDefinition;
  recentResult: JobItem | null;
  onRun: (request: QuickToolJobRequest) => Promise<void>;
}

function parsePages(value: string): number[] {
  return value
    .split(',')
    .flatMap((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return [];
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((part) => Number(part.trim()));
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
      }
      const num = Number(trimmed);
      return Number.isFinite(num) ? [num] : [];
    })
    .filter((page) => page > 0);
}

export function QuickToolWorkflow({ tool, recentResult, onRun }: QuickToolWorkflowProps): JSX.Element {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [outputPath, setOutputPath] = useState('');
  const [pagesValue, setPagesValue] = useState('1');
  const [degrees, setDegrees] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const requiresPages = tool.id === 'extract-pages' || tool.id === 'remove-pages' || tool.id === 'rotate-pages';
  const requiresDegrees = tool.id === 'rotate-pages';

  const options = useMemo(() => {
    if (tool.id === 'extract-pages' || tool.id === 'remove-pages') {
      return { pages: parsePages(pagesValue) };
    }
    if (tool.id === 'rotate-pages') {
      return { pages: parsePages(pagesValue), degrees: Number(degrees) || 90 };
    }
    return {};
  }, [degrees, pagesValue, tool.id]);

  function addFiles(list: FileList | null): void {
    if (!list?.length) return;
    const nextFiles = Array.from(list)
      .map((file) => {
        const path = (file as File & { path?: string }).path;
        return {
          name: file.name,
          path: path ?? ''
        };
      })
      .filter((file) => file.path);

    setFiles((current) => [...current, ...nextFiles]);
    if (nextFiles.length === 0) {
      setError('Unable to detect native file paths from drag/drop. Please run inside the desktop shell.');
    } else {
      setError(null);
    }
  }

  async function runTool(): Promise<void> {
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    if (!outputPath.trim()) {
      setError('Please provide an output destination path.');
      return;
    }

    if (requiresPages && (options as { pages?: number[] }).pages?.length === 0) {
      setError('Please provide valid page numbers.');
      return;
    }

    setRunning(true);
    setError(null);

    try {
      await onRun({
        tool: tool.id,
        sourcePaths: files.map((file) => file.path),
        outputPath,
        options
      });
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Unknown quick-tool failure';
      setError(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-panelElevated p-4">
        <h3 className="text-base font-semibold text-textPrimary">{tool.label}</h3>
        <p className="mt-1 text-sm text-textSecondary">{tool.description}</p>
        <p className="mt-2 text-xs text-textSecondary">{tool.optionsHelp}</p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-border bg-panel px-4 py-5"
      >
        <p className="text-sm text-textPrimary">Drag & drop files here</p>
        <p className="mt-1 text-xs text-textSecondary">{tool.sourceHint}</p>
        <input
          type="file"
          multiple={tool.id === 'merge-pdfs' || tool.id === 'image-to-pdf'}
          onChange={(event) => addFiles(event.target.files)}
          className="mt-3 block text-xs text-textSecondary"
        />
      </div>

      <div className="rounded-lg border border-border bg-panel px-4 py-3">
        <h4 className="text-sm font-medium text-textPrimary">Selected files ({files.length})</h4>
        <ul className="mt-2 space-y-1 text-xs text-textSecondary">
          {files.length === 0 ? <li>No files selected</li> : files.map((file) => <li key={`${file.path}-${file.name}`}>{file.path}</li>)}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-panel px-4 py-3 space-y-3">
        <h4 className="text-sm font-medium text-textPrimary">Options</h4>
        {requiresPages ? (
          <label className="block text-xs text-textSecondary">
            Page list
            <input
              value={pagesValue}
              onChange={(event) => setPagesValue(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-panelElevated px-2 py-1 text-sm text-textPrimary"
              placeholder="1,2,5-8"
            />
          </label>
        ) : null}

        {requiresDegrees ? (
          <label className="block text-xs text-textSecondary">
            Rotation degrees
            <select
              value={degrees}
              onChange={(event) => setDegrees(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-panelElevated px-2 py-1 text-sm text-textPrimary"
            >
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </label>
        ) : null}
      </div>

      <label className="block rounded-lg border border-border bg-panel px-4 py-3 text-xs text-textSecondary">
        Output destination
        <input
          value={outputPath}
          onChange={(event) => setOutputPath(event.target.value)}
          className="mt-1 w-full rounded border border-border bg-panelElevated px-2 py-1 text-sm text-textPrimary"
          placeholder={tool.outputHint}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void runTool()}
          disabled={running}
          className="rounded-lg border border-accent bg-accent/20 px-4 py-2 text-sm font-medium text-textPrimary disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run tool'}
        </button>
        <span className="text-xs text-textSecondary">
          {tool.status === 'implemented' ? 'Fully implemented' : 'Scaffolded placeholder with TODO boundary'}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-panel px-4 py-3 text-sm">
        <h4 className="font-medium text-textPrimary">Status & result</h4>
        {error ? <p className="mt-1 text-red-300">{error}</p> : null}
        {recentResult ? (
          <p className="mt-1 text-textSecondary">
            Last run: <span className="text-textPrimary">{recentResult.status}</span> — {recentResult.message ?? 'Completed'}
          </p>
        ) : (
          <p className="mt-1 text-textSecondary">No runs yet.</p>
        )}
      </div>
    </div>
  );
}
