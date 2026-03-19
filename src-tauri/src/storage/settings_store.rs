use std::fs;
use std::path::PathBuf;

use crate::shared_types::AppSettings;

pub struct SettingsStore;

impl SettingsStore {
    pub fn save(settings: &AppSettings) -> Result<(), SettingsStoreError> {
        let path = config_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let raw = serde_json::to_vec_pretty(settings)?;
        fs::write(path, raw)?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn load() -> Result<AppSettings, SettingsStoreError> {
        let path = config_path()?;
        if !path.exists() {
            return Ok(AppSettings::default());
        }

        let raw = fs::read(path)?;
        Ok(serde_json::from_slice(&raw)?)
    }
}

fn config_path() -> Result<PathBuf, SettingsStoreError> {
    let mut path = std::env::current_dir()?;
    path.push(".pdfninja");
    path.push("settings.json");
    Ok(path)
}

#[derive(Debug, thiserror::Error)]
pub enum SettingsStoreError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
}
