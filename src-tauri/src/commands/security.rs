use crate::services::security_service;
use crate::shared_types::PdfSecurityReport;

#[tauri::command]
pub fn inspect_document_security(path: String) -> Result<PdfSecurityReport, String> {
    security_service::inspect_pdf(&path).map_err(|e| e.to_string())
}
