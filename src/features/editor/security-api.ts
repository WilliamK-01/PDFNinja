import { invoke } from '@tauri-apps/api/core';
import type { PdfSecurityReport } from '@/shared/types';

export async function inspectDocumentSecurity(path: string): Promise<PdfSecurityReport> {
  return invoke<PdfSecurityReport>('inspect_document_security', { path });
}
