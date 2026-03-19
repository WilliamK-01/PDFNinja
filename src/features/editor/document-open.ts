import type { DocumentSource, OpenDocument } from '@/shared/types';

function makeDocumentId(seed: string): string {
  return `doc-${seed.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
}

export function createDocumentFromPath(path: string, source: DocumentSource): OpenDocument {
  const name = path.split(/[\\/]/).pop() ?? 'Untitled.pdf';
  const now = new Date().toISOString();
  return {
    id: makeDocumentId(path),
    name,
    path,
    pageCount: null,
    activePage: 1,
    modifiedAt: now,
    source,
    metadata: {
      fileType: 'application/pdf'
    }
  };
}

export function createDocumentFromFile(file: File): OpenDocument {
  const path = (file as File & { path?: string }).path ?? file.name;
  return {
    id: makeDocumentId(`${path}-${file.lastModified}`),
    name: file.name,
    path,
    pageCount: null,
    activePage: 1,
    modifiedAt: new Date(file.lastModified).toISOString(),
    source: 'file-picker',
    sourceUrl: URL.createObjectURL(file),
    metadata: {
      byteSize: file.size,
      fileType: file.type || 'application/pdf',
      modifiedAt: new Date(file.lastModified).toISOString()
    }
  };
}

export interface ViewerUrlState {
  page: number;
  zoom: number;
  fitMode: 'none' | 'width' | 'page';
}

export function buildViewerUrl(document: OpenDocument, state: ViewerUrlState): string {
  const source = document.sourceUrl ?? document.path;
  const fit = state.fitMode === 'width' ? 'page-width' : state.fitMode === 'page' ? 'page-fit' : String(state.zoom);
  return `${source}#page=${state.page}&zoom=${fit}`;
}
