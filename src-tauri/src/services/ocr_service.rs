use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::json;

use crate::shared_types::{JobItem, OcrJobRequest};
use crate::state::job_queue::JobQueue;

pub struct OcrService;

impl OcrService {
    pub fn run_job(queue: &JobQueue, request: OcrJobRequest) -> Result<JobItem, OcrServiceError> {
        validate_request(&request)?;

        let job_id = format!("ocr-{}", unix_millis());
        let now = now_iso();
        let initial_language = normalize_languages(&request);

        let mut job = JobItem {
            id: job_id.clone(),
            job_type: "ocr/pdf".to_string(),
            source_paths: vec![request.source_path.clone()],
            output_path: request.output_path.clone(),
            status: "queued".to_string(),
            created_at: now.clone(),
            updated_at: now,
            progress: 0,
            message: Some("Queued OCR job".to_string()),
            details: Some(json!({
                "stage": "queued",
                "languageUsed": initial_language,
                "pipeline": [
                    "raster/page input",
                    "preprocessing",
                    "ocr",
                    "text layer generation",
                    "output pdf generation"
                ],
                "hooks": {
                    "deskew": request.preprocessing.deskew,
                    "despeckle": request.preprocessing.despeckle,
                    "multiLanguage": !request.languages.is_empty(),
                    "uncertainTextReview": request.review_uncertain_text
                }
            })),
        };

        queue.enqueue(job.clone());

        update_stage(queue, &job_id, 10, "raster/page input", "Inspecting source pages", None);
        let pages = detect_page_count(&request.source_path).unwrap_or(0);

        update_stage(
            queue,
            &job_id,
            25,
            "preprocessing",
            "Preparing OCR pipeline and preprocessing options",
            Some(json!({ "pagesDetected": pages })),
        );

        update_stage(queue, &job_id, 45, "ocr", "Running OCR engine offline", None);

        let tmp_output = format!("{}.partial.pdf", request.output_path);
        let summary = run_ocrmypdf(&request, &tmp_output, pages)?;

        update_stage(
            queue,
            &job_id,
            75,
            "text layer generation",
            "Building searchable text layer",
            None,
        );

        std::fs::rename(&tmp_output, &request.output_path)?;

        update_stage(
            queue,
            &job_id,
            95,
            "output pdf generation",
            "Finalizing output PDF",
            None,
        );

        queue.update(&job_id, |entry| {
            entry.status = "completed".to_string();
            entry.progress = 100;
            entry.message = Some(format!(
                "OCR complete: {} page(s), lang={}, confidence={}",
                summary.pages_processed,
                summary.language_used,
                summary
                    .confidence
                    .map(|value| format!("{value:.2}"))
                    .unwrap_or_else(|| "n/a".to_string())
            ));
            entry.details = Some(json!({
                "stage": "completed",
                "pagesProcessed": summary.pages_processed,
                "languageUsed": summary.language_used,
                "confidence": summary.confidence,
                "hooks": {
                    "deskew": request.preprocessing.deskew,
                    "despeckle": request.preprocessing.despeckle,
                    "multiLanguage": !request.languages.is_empty(),
                    "uncertainTextReview": request.review_uncertain_text
                }
            }));
            entry.updated_at = now_iso();
        });

        job = queue
            .list()
            .into_iter()
            .find(|entry| entry.id == job_id)
            .ok_or_else(|| OcrServiceError::Validation("Unable to read OCR job state".to_string()))?;

        Ok(job)
    }
}

#[derive(Debug)]
struct OcrSummary {
    pages_processed: u32,
    language_used: String,
    confidence: Option<f32>,
}

fn validate_request(request: &OcrJobRequest) -> Result<(), OcrServiceError> {
    if request.source_path.trim().is_empty() {
        return Err(OcrServiceError::Validation(
            "Source PDF path is required".to_string(),
        ));
    }
    if request.output_path.trim().is_empty() {
        return Err(OcrServiceError::Validation(
            "Output PDF path is required".to_string(),
        ));
    }
    if !Path::new(&request.source_path).exists() {
        return Err(OcrServiceError::Validation(format!(
            "Source file does not exist: {}",
            request.source_path
        )));
    }

    let language = normalize_languages(request);
    if language.trim().is_empty() {
        return Err(OcrServiceError::Validation(
            "At least one OCR language code is required".to_string(),
        ));
    }

    ensure_binary_available("ocrmypdf")?;
    Ok(())
}

fn detect_page_count(source_path: &str) -> Result<u32, OcrServiceError> {
    let output = Command::new("pdfinfo").arg(source_path).output();
    let Ok(output) = output else {
        return Ok(0);
    };

    if !output.status.success() {
        return Ok(0);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if let Some(rest) = line.strip_prefix("Pages:") {
            if let Ok(value) = rest.trim().parse::<u32>() {
                return Ok(value);
            }
        }
    }

    Ok(0)
}

fn run_ocrmypdf(
    request: &OcrJobRequest,
    tmp_output: &str,
    detected_pages: u32,
) -> Result<OcrSummary, OcrServiceError> {
    let mut command = Command::new("ocrmypdf");
    command
        .arg("--force-ocr")
        .arg("--skip-text")
        .arg("--optimize")
        .arg("1")
        .arg("--language")
        .arg(normalize_languages(request));

    if request.preprocessing.deskew {
        command.arg("--deskew");
    }
    if request.preprocessing.despeckle {
        command.arg("--clean");
    }

    command.arg(&request.source_path).arg(tmp_output);

    let output = command.output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(OcrServiceError::CommandFailed(stderr.trim().to_string()));
    }

    let pages = if detected_pages == 0 {
        detect_page_count(tmp_output).unwrap_or(0)
    } else {
        detected_pages
    };

    Ok(OcrSummary {
        pages_processed: pages,
        language_used: normalize_languages(request),
        confidence: None,
    })
}

fn update_stage(
    queue: &JobQueue,
    job_id: &str,
    progress: u8,
    stage: &str,
    message: &str,
    extra: Option<serde_json::Value>,
) {
    queue.update(job_id, |entry| {
        entry.status = "running".to_string();
        entry.progress = progress;
        entry.message = Some(message.to_string());
        let mut details = entry.details.clone().unwrap_or_else(|| json!({}));
        details["stage"] = json!(stage);
        if let Some(extra) = extra {
            if let Some(obj) = extra.as_object() {
                for (key, value) in obj {
                    details[key] = value.clone();
                }
            }
        }
        entry.details = Some(details);
        entry.updated_at = now_iso();
    });
}

fn ensure_binary_available(binary: &str) -> Result<(), OcrServiceError> {
    let output = Command::new(binary).arg("--version").output();
    match output {
        Ok(result) if result.status.success() => Ok(()),
        _ => Err(OcrServiceError::DependencyMissing(format!(
            "Missing native dependency `{binary}`. Install ocrmypdf (+ tesseract + language data)."
        ))),
    }
}

fn normalize_languages(request: &OcrJobRequest) -> String {
    if !request.languages.is_empty() {
        return request.languages.join("+");
    }
    request.language.trim().to_string()
}

#[derive(Debug, thiserror::Error)]
pub enum OcrServiceError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error("native dependency not found: {0}")]
    DependencyMissing(String),
    #[error("OCR command failed: {0}")]
    CommandFailed(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
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
