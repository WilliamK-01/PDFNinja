mod commands;
mod services;
mod shared_types;
mod state;
mod storage;

use state::app_state::AppState;
use state::job_queue::JobQueue;

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .manage(JobQueue::default())
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_snapshot,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::jobs::list_jobs,
            commands::jobs::enqueue_job,
            commands::quick_tools::run_quick_tool_job,
            commands::page_operations::run_page_operation_job
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
