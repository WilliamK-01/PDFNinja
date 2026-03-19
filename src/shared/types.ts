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
  details?: Record<string, unknown>;
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
  | 'password-protect-pdf'
  | 'unlock-pdf'
  | 'inspect-pdf-metadata'
  | 'image-to-pdf'
  | 'pdf-to-images'
  | 'pdf-to-text'
  | 'document-to-pdf'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'ocr-pdf';

export interface QuickToolJobRequest {
  tool: QuickToolType;
  sourcePaths: string[];
  outputPath: string;
  options: Record<string, unknown>;
}

export interface OcrJobRequest {
  sourcePath: string;
  outputPath: string;
  language: string;
  preprocessing: {
    deskew: boolean;
    despeckle: boolean;
  };
  languages?: string[];
  reviewUncertainText?: boolean;
}

export type PageOperationType = 'reorder-pages' | 'delete-pages' | 'duplicate-pages' | 'extract-pages' | 'rotate-pages';

export interface PageOperationRequest {
  operation: PageOperationType;
  sourcePath: string;
  outputPath: string;
  selectedPages: number[];
  targetOrder?: number[];
  degrees?: 90 | 180 | 270;
}

export type AnnotationTool = 'select' | 'highlight' | 'underline' | 'strikeout' | 'note' | 'draw';
export type AnnotationType = Exclude<AnnotationTool, 'select'>;

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  documentId: string;
  page: number;
  type: AnnotationType;
  content: string;
  selectionContext?: string;
  rect?: AnnotationRect;
  points?: AnnotationPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityMetadataEntry {
  key: string;
  value: string;
}

export interface AttachmentSummary {
  name: string;
  sizeBytes?: number;
}

export interface PdfSecurityReport {
  sourcePath: string;
  metadata: SecurityMetadataEntry[];
  formsPresent: boolean;
  annotationsPresent: boolean;
  javascriptPresent: boolean;
  embeddedAttachments: AttachmentSummary[];
  isEncrypted: boolean;
  inspectionWarnings: string[];
}

export interface RedactionDraft {
  id: string;
  page: number;
  label: string;
  status: 'draft' | 'reviewed' | 'applied-prototype';
  source: 'manual-region' | 'text-selection-placeholder';
  rect?: AnnotationRect;
  textHint?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  route: AppRoute;
  openDocuments: OpenDocument[];
  activeDocumentId: string | null;
  activeTool: string | null;
  jobs: JobItem[];
  settings: AppSettings;
  sessionAnnotations: Record<string, AnnotationItem[]>;
  selectedAnnotationId: string | null;
}
