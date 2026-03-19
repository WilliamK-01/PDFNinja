use crate::shared_types::AppSettings;
use crate::state::app_state::AppState;
use crate::storage::settings_store::SettingsStore;

pub struct SettingsService;

impl SettingsService {
    pub fn update(state: &AppState, patch: AppSettings) -> Result<AppSettings, SettingsServiceError> {
        *state.settings.write() = patch.clone();
        SettingsStore::save(&patch)?;
        Ok(patch)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SettingsServiceError {
    #[error("{0}")]
    Storage(#[from] crate::storage::settings_store::SettingsStoreError),
}
