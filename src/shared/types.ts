export type AppRoute = 'home' | 'quick-tools' | 'editor' | 'automation' | 'settings';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type DocumentSource = 'file-picker' | 'recent' | 'quick-tool';

export interface DocumentMetadata {
  byteSize?: number;
  fileType?: string;
  createdAt?: string;
  modifiedAt?: string;
  author?: string;
  title?: string;
  producer?: string;
}

export interface OpenDocument {
  id: string;
  name: string;
  path: string;
  pageCount: number | null;
  activePage: number;
  modifiedAt: string;
  source: DocumentSource;
  sourceUrl?: string;
  metadata?: DocumentMetadata;
}

export interface JobItem {
  id: string;
  type: string;
  sourcePaths: string[];
  outputPath: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  progress: number;
  message?: string;
}

export interface AppSettings {
  theme: 'dark';
  defaultZoom: number;
  autosaveMinutes: number;
  recentLimit: number;
  scratchDirectory: string;
}

export type QuickToolType =
  | 'merge-pdfs'
  | 'split-pdf'
  | 'extract-pages'
  | 'remove-pages'
  | 'rotate-pages'
  | 'compress-pdf'
  | 'image-to-pdf';

export interface QuickToolJobRequest {
  tool: QuickToolType;
  sourcePaths: string[];
  outputPath: string;
  options: Record<string, unknown>;
}

export interface AppState {
  route: AppRoute;
  openDocuments: OpenDocument[];
  activeDocumentId: string | null;
  activeTool: string | null;
  jobs: JobItem[];
  settings: AppSettings;
}
