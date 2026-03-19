use tauri::State;

use crate::services::ocr_service::OcrService;
use crate::shared_types::{JobItem, OcrJobRequest};
use crate::state::job_queue::JobQueue;

#[tauri::command]
pub fn run_ocr_job(queue: State<'_, JobQueue>, request: OcrJobRequest) -> Result<JobItem, String> {
    OcrService::run_job(&queue, request).map_err(|e| e.to_string())
}
