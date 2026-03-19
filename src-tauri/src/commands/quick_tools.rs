use tauri::State;

use crate::services::quick_tools_service::QuickToolsService;
use crate::shared_types::{JobItem, QuickToolJobRequest};
use crate::state::job_queue::JobQueue;

#[tauri::command]
pub fn run_quick_tool_job(
    queue: State<'_, JobQueue>,
    request: QuickToolJobRequest,
) -> Result<JobItem, String> {
    QuickToolsService::run_job(&queue, request).map_err(|e| e.to_string())
}
