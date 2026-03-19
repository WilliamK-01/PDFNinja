use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub default_zoom: u16,
    pub autosave_minutes: u16,
    pub recent_limit: usize,
    pub scratch_directory: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_zoom: 100,
            autosave_minutes: 3,
            recent_limit: 15,
            scratch_directory: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobItem {
    pub id: String,
    pub job_type: String,
    pub source_paths: Vec<String>,
    pub output_path: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub progress: u8,
    pub message: Option<String>,
}
