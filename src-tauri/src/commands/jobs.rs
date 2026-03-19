use crate::services::job_service::JobService;
use crate::shared_types::JobItem;
use crate::state::job_queue::JobQueue;
use tauri::State;

#[tauri::command]
pub fn list_jobs(queue: State<'_, JobQueue>) -> Vec<JobItem> {
    queue.list()
}

#[tauri::command]
pub fn enqueue_job(queue: State<'_, JobQueue>, job: JobItem) -> Result<JobItem, String> {
    JobService::enqueue(&queue, job).map_err(|e| e.to_string())
}
