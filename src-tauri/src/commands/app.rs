use crate::state::app_state::AppState;
use crate::state::job_queue::JobQueue;
use tauri::State;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSnapshot {
    pub settings: crate::shared_types::AppSettings,
    pub queued_jobs: usize,
}

#[tauri::command]
pub fn get_app_snapshot(
    app_state: State<'_, AppState>,
    queue: State<'_, JobQueue>,
) -> Result<AppSnapshot, String> {
    let settings = app_state.settings.read().clone();
    let queued_jobs = queue.count();

    Ok(AppSnapshot {
        settings,
        queued_jobs,
    })
}
