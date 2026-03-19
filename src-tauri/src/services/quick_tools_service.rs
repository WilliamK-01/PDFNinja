use std::time::{SystemTime, UNIX_EPOCH};

use serde::Deserialize;

use crate::services::ocr_service::OcrService;
use crate::services::pdf_tools::{run_tool, PdfToolError};
use crate::shared_types::{JobItem, OcrJobRequest, OcrPreprocessingOptions, QuickToolJobRequest, QuickToolType};
use crate::state::job_queue::JobQueue;

pub struct QuickToolsService;

impl QuickToolsService {
    pub fn run_job(
        queue: &JobQueue,
        request: QuickToolJobRequest,
    ) -> Result<JobItem, QuickToolsError> {
        if matches!(request.tool, QuickToolType::OcrPdf) {
            let options: OcrQuickToolOptions = serde_json::from_value(request.options.clone())
                .map_err(|_| QuickToolsError::Validation("OCR requires language + preprocessing options".to_string()))?;
            return OcrService::run_job(
                queue,
                OcrJobRequest {
                    source_path: request
                        .source_paths
                        .first()
                        .cloned()
                        .unwrap_or_default(),
                    output_path: request.output_path,
                    language: options.language,
                    preprocessing: options.preprocessing,
                    languages: options.languages,
                    review_uncertain_text: options.review_uncertain_text,
                },
            )
            .map_err(QuickToolsError::Ocr);
        }

        if request.source_paths.is_empty() {
            return Err(QuickToolsError::Validation(
                "At least one source file is required".to_string(),
            ));
        }

        if request.output_path.trim().is_empty() {
            return Err(QuickToolsError::Validation(
                "Output destination is required".to_string(),
            ));
        }

        let now = now_iso();
        let job_id = format!("job-{}", unix_millis());

        let mut job = JobItem {
            id: job_id.clone(),
            job_type: format!("quick-tools/{:?}", request.tool),
            source_paths: request.source_paths.clone(),
            output_path: request.output_path.clone(),
            status: "queued".to_string(),
            created_at: now.clone(),
            updated_at: now,
            progress: 0,
            message: Some("Queued".to_string()),
            details: None,
        };

        queue.enqueue(job.clone());

        queue.update(&job_id, |entry| {
            entry.status = "running".to_string();
            entry.progress = 15;
            entry.message = Some("Preparing files".to_string());
            entry.updated_at = now_iso();
        });

        match run_tool(&request) {
            Ok(result) => {
                queue.update(&job_id, |entry| {
                    entry.status = "completed".to_string();
                    entry.progress = 100;
                    entry.message = Some(result.message.clone());
                    entry.updated_at = now_iso();
                });
            }
            Err(error) => {
                queue.update(&job_id, |entry| {
                    entry.status = "failed".to_string();
                    entry.progress = 100;
                    entry.message = Some(error.to_string());
                    entry.updated_at = now_iso();
                });
            }
        }

        job = queue
            .list()
            .into_iter()
            .find(|entry| entry.id == job_id)
            .ok_or_else(|| {
                QuickToolsError::Validation("Unable to read queued job state".to_string())
            })?;

        Ok(job)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum QuickToolsError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error(transparent)]
    Tool(#[from] PdfToolError),
    #[error(transparent)]
    Ocr(#[from] crate::services::ocr_service::OcrServiceError),
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OcrQuickToolOptions {
    language: String,
    preprocessing: OcrPreprocessingOptions,
    #[serde(default)]
    languages: Vec<String>,
    #[serde(default)]
    review_uncertain_text: bool,
}

fn unix_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn now_iso() -> String {
    unix_millis().to_string()
}
