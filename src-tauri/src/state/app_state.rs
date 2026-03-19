use parking_lot::RwLock;

use crate::shared_types::AppSettings;

pub struct AppState {
    pub settings: RwLock<AppSettings>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            settings: RwLock::new(AppSettings::default()),
        }
    }
}
