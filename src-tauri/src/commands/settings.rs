use crate::services::settings_service::SettingsService;
use crate::shared_types::AppSettings;
use crate::state::app_state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    Ok(state.settings.read().clone())
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, AppState>,
    patch: AppSettings,
) -> Result<AppSettings, String> {
    SettingsService::update(&state, patch).map_err(|e| e.to_string())
}
