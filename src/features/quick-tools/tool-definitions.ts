import type { QuickToolType } from '@/shared/types';

export interface QuickToolDefinition {
  id: QuickToolType;
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
    label: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single output document.',
    sourceHint: 'Drop two or more PDF files in the order you want them merged.',
    outputHint: 'Output file path, e.g. /Users/me/output/merged.pdf',
    optionsHelp: 'No extra options required.',
    status: 'scaffolded'
  },
  {
    id: 'split-pdf',
    label: 'Split PDF',
    description: 'Split one PDF into per-page PDF files.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output folder path, e.g. /Users/me/output/split-pages',
    optionsHelp: 'Each source page is exported as its own PDF.',
    status: 'scaffolded'
  },
  {
    id: 'extract-pages',
    label: 'Extract pages',
    description: 'Create a new PDF from selected pages.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for extracted pages.',
    optionsHelp: 'Enter pages as comma-separated values, e.g. 1,2,5-8.',
    status: 'scaffolded'
  },
  {
    id: 'remove-pages',
    label: 'Remove pages',
    description: 'Delete selected pages from a PDF copy.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path after page removal.',
    optionsHelp: 'Enter pages as comma-separated values, e.g. 1,2,5-8.',
    status: 'scaffolded'
  },
  {
    id: 'rotate-pages',
    label: 'Rotate pages',
    description: 'Rotate chosen pages by a fixed angle.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path with updated rotation.',
    optionsHelp: 'Choose degrees and page range list.',
    status: 'scaffolded'
  },
  {
    id: 'compress-pdf',
    label: 'Compress PDF',
    description: 'Apply PDF object compression to reduce file size.',
    sourceHint: 'Drop one source PDF file.',
    outputHint: 'Output PDF path for compressed file.',
    optionsHelp: 'Uses lossless object stream compression.',
    status: 'scaffolded'
  },
  {
    id: 'image-to-pdf',
    label: 'Image to PDF',
    description: 'Convert images into a PDF document.',
    sourceHint: 'Drop one or more image files.',
    outputHint: 'Output PDF path for generated document.',
    optionsHelp: 'Current pipeline is scaffolded and returns a TODO status.',
    status: 'scaffolded'
  }
];

export function getQuickTool(toolId: QuickToolType): QuickToolDefinition {
  const found = QUICK_TOOLS.find((tool) => tool.id === toolId);
  if (!found) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return found;
}
