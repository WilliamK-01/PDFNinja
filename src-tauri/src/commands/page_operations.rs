use tauri::State;

use crate::services::page_operations_service::PageOperationsService;
use crate::shared_types::{JobItem, PageOperationRequest};
use crate::state::job_queue::JobQueue;

#[tauri::command]
pub fn run_page_operation_job(
    queue: State<'_, JobQueue>,
    request: PageOperationRequest,
) -> Result<JobItem, String> {
    PageOperationsService::run_job(&queue, request).map_err(|e| e.to_string())
}
