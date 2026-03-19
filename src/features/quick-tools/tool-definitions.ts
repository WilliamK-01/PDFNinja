import type { QuickToolType } from '@/shared/types';

export interface QuickToolDefinition {
  id: QuickToolType;
  section: 'pdf-core' | 'security' | 'conversions';
  label: string;
  description: string;
  sourceHint: string;
  outputHint: string;
  optionsHelp: string;
  status: 'implemented' | 'scaffolded';
}

export const QUICK_TOOLS: QuickToolDefinition[] = [
  {
    id: 'merge-pdfs',
    section: 'pdf-core',
    label: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single output document.',
    sourceHint: 'Drop two or more PDF files in the order you want them merged.',
    outputHint: 'Output file path, e.g. /Users/me/output/merged.pdf',
    optionsHelp: 'No extra options required.',
    status: 'scaffolded'
  },
  {
    id: 'split-pdf',
    section: 'pdf-core',
    label: 'Split PDF',
    description: 'Split one PDF into per-page PDF files.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output folder path, e.g. /Users/me/output/split-pages',
    optionsHelp: 'Each source page is exported as its own PDF.',
    status: 'scaffolded'
  },
  {
    id: 'extract-pages',
    section: 'pdf-core',
    label: 'Extract pages',
    description: 'Create a new PDF from selected pages.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for extracted pages.',
    optionsHelp: 'Enter pages as comma-separated values, e.g. 1,2,5-8.',
    status: 'scaffolded'
  },
  {
    id: 'remove-pages',
    section: 'pdf-core',
    label: 'Remove pages',
    description: 'Delete selected pages from a PDF copy.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path after page removal.',
    optionsHelp: 'Enter pages as comma-separated values, e.g. 1,2,5-8.',
    status: 'scaffolded'
  },
  {
    id: 'rotate-pages',
    section: 'pdf-core',
    label: 'Rotate pages',
    description: 'Rotate chosen pages by a fixed angle.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path with updated rotation.',
    optionsHelp: 'Choose degrees and page range list.',
    status: 'scaffolded'
  },
  {
    id: 'compress-pdf',
    section: 'pdf-core',
    label: 'Compress PDF',
    description: 'Apply PDF object compression to reduce file size.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for compressed file.',
    optionsHelp: 'Uses lossless object stream compression.',
    status: 'scaffolded'
  },
  {
    id: 'password-protect-pdf',
    section: 'security',
    label: 'Password protect PDF',
    description: 'Encrypt a PDF with an owner/user password policy for controlled access.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for encrypted document.',
    optionsHelp: 'Implemented through a qpdf adapter when qpdf is installed in runtime. Use a strong password and verify with a second reader.',
    status: 'implemented'
  },
  {
    id: 'unlock-pdf',
    section: 'security',
    label: 'Unlock PDF',
    description: 'Decrypt a password-protected PDF when you know the password.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for unlocked copy.',
    optionsHelp: 'Requires the valid document password. This writes a decrypted PDF copy; handle output securely.',
    status: 'implemented'
  },
  {
    id: 'inspect-pdf-metadata',
    section: 'security',
    label: 'Inspect PDF metadata',
    description: 'Export a basic metadata/security inspection report as JSON.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output JSON report path.',
    optionsHelp: 'Implemented for common PDF structures. Detection for advanced/obfuscated content remains best-effort.',
    status: 'implemented'
  },
  {
    id: 'image-to-pdf',
    section: 'conversions',
    label: 'Image to PDF',
    description: 'Convert images into a PDF document.',
    sourceHint: 'Drop one or more image files.',
    outputHint: 'Output PDF path for generated document.',
    optionsHelp: 'Implemented for JPEG now (multi-image). PNG/WebP and other formats are planned.',
    status: 'implemented'
  },
  {
    id: 'pdf-to-images',
    section: 'conversions',
    label: 'PDF to images',
    description: 'Render PDF pages to image files (PNG/JPEG).',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output folder path, e.g. /Users/me/output/pdf-pages',
    optionsHelp: 'Scaffolded with renderer boundary. Planned: Poppler/PDFium adapter.',
    status: 'scaffolded'
  },
  {
    id: 'pdf-to-text',
    section: 'conversions',
    label: 'PDF to text',
    description: 'Extract text content from digital PDFs into TXT or JSON.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output file path, e.g. /Users/me/output/notes.txt',
    optionsHelp: 'Implemented for selectable-text PDFs. Scanned PDFs should use OCR first.',
    status: 'implemented'
  },
  {
    id: 'document-to-pdf',
    section: 'conversions',
    label: 'Document to PDF',
    description: 'Architecture hook for Office-to-PDF conversion workflows.',
    sourceHint: 'Drop one source office document, e.g. DOCX/XLSX/PPTX.',
    outputHint: 'Output PDF file path.',
    optionsHelp: 'Scaffolded boundary for future LibreOffice/Office bridge.',
    status: 'scaffolded'
  },
  {
    id: 'pdf-to-word',
    section: 'conversions',
    label: 'PDF to Word',
    description: 'Architecture hook for high-fidelity PDF to DOCX conversion.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output DOCX path.',
    optionsHelp: 'Scaffolded boundary for external conversion provider.',
    status: 'scaffolded'
  },
  {
    id: 'pdf-to-excel',
    section: 'conversions',
    label: 'PDF to Excel',
    description: 'Architecture hook for table extraction into XLSX.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output XLSX path.',
    optionsHelp: 'Scaffolded boundary for table-aware conversion backend.',
    status: 'scaffolded'
  },
  {
    id: 'ocr-pdf',
    section: 'conversions',
    label: 'OCR PDF',
    description: 'Convert scanned PDFs into searchable PDFs fully offline.',
    sourceHint: 'Drop one scanned or image-based PDF file.',
    outputHint: 'Output PDF path, e.g. /Users/me/output/scan-searchable.pdf',
    optionsHelp: 'Select OCR language and optional preprocessing hooks (deskew/despeckle).',
    status: 'implemented'
  }

];

export function getQuickTool(toolId: QuickToolType): QuickToolDefinition {
  const found = QUICK_TOOLS.find((tool) => tool.id === toolId);
  if (!found) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return found;
}
