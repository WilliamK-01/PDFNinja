use std::fs;
use std::path::Path;
use std::process::Command;

use serde::Deserialize;

use crate::shared_types::{AttachmentSummary, PdfSecurityReport, SecurityMetadataEntry};

#[derive(Debug, thiserror::Error)]
pub enum SecurityServiceError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtectPdfOptions {
    pub user_password: String,
    #[serde(default)]
    pub owner_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnlockPdfOptions {
    pub password: String,
}

pub fn protect_pdf(source_path: &str, output_path: &str, options: &serde_json::Value) -> Result<String, SecurityServiceError> {
    let parsed: ProtectPdfOptions = serde_json::from_value(options.clone())
        .map_err(|_| SecurityServiceError::Validation("Password protection requires userPassword".to_string()))?;
    if parsed.user_password.trim().is_empty() {
        return Err(SecurityServiceError::Validation(
            "userPassword is required".to_string(),
        ));
    }
    ensure_source_exists(source_path)?;
    ensure_output_path(output_path)?;

    let owner = if parsed.owner_password.trim().is_empty() {
        parsed.user_password.clone()
    } else {
        parsed.owner_password
    };
    run_qpdf(&[
        "--encrypt",
        &parsed.user_password,
        &owner,
        "256",
        "--",
        source_path,
        output_path,
    ])?;
    Ok("PDF encrypted with qpdf Standard security settings.".to_string())
}

pub fn unlock_pdf(source_path: &str, output_path: &str, options: &serde_json::Value) -> Result<String, SecurityServiceError> {
    let parsed: UnlockPdfOptions = serde_json::from_value(options.clone())
        .map_err(|_| SecurityServiceError::Validation("Unlock requires password".to_string()))?;
    if parsed.password.trim().is_empty() {
        return Err(SecurityServiceError::Validation("password is required".to_string()));
    }
    ensure_source_exists(source_path)?;
    ensure_output_path(output_path)?;
    run_qpdf(&[
        format!("--password={}", parsed.password).as_str(),
        "--decrypt",
        source_path,
        output_path,
    ])?;
    Ok("PDF decrypted with qpdf and written as an unencrypted copy.".to_string())
}

pub fn inspect_pdf(source_path: &str) -> Result<PdfSecurityReport, SecurityServiceError> {
    ensure_source_exists(source_path)?;
    let content = fs::read(source_path)?;
    let lossy = String::from_utf8_lossy(&content);

    let metadata = collect_metadata_from_bytes(&lossy);
    let is_encrypted = lossy.contains("/Encrypt");
    let forms_present = lossy.contains("/AcroForm");
    let annotations_present = lossy.contains("/Annots");
    let javascript_present = lossy.contains("/JavaScript") || lossy.contains("/JS ");
    let embedded_attachments = collect_attachment_hints(&lossy);

    let mut warnings = vec![
        "Inspection is currently signature-based and best-effort; false negatives/positives are possible.".to_string(),
        "This report is not a compliance certification and does not validate content-stream sanitization.".to_string(),
    ];
    if !qpdf_available() {
        warnings.push("qpdf not detected in runtime environment, so lock/unlock operations are unavailable on this machine.".to_string());
    }

    Ok(PdfSecurityReport {
        source_path: source_path.to_string(),
        metadata,
        forms_present,
        annotations_present,
        javascript_present,
        embedded_attachments,
        is_encrypted,
        inspection_warnings: warnings,
    })
}

fn collect_metadata_from_bytes(content: &str) -> Vec<SecurityMetadataEntry> {
    let mut items = Vec::new();
    for key in ["Title", "Author", "Creator", "Producer", "CreationDate", "ModDate", "Subject", "Keywords"] {
        let pattern = format!("/{key} (");
        if let Some(start) = content.find(&pattern) {
            let value_start = start + pattern.len();
            if let Some(end_rel) = content[value_start..].find(')') {
                let value = content[value_start..value_start + end_rel].trim().to_string();
                if !value.is_empty() {
                    items.push(SecurityMetadataEntry {
                        key: key.to_string(),
                        value,
                    });
                }
            }
        }
    }
    items
}

fn collect_attachment_hints(content: &str) -> Vec<AttachmentSummary> {
    let mut items = Vec::new();
    if !content.contains("/EmbeddedFiles") {
        return items;
    }
    for chunk in content.match_indices("/F (").take(12) {
        let start = chunk.0 + 4;
        if let Some(end_rel) = content[start..].find(')') {
            let name = content[start..start + end_rel].trim().to_string();
            if !name.is_empty() {
                items.push(AttachmentSummary {
                    name,
                    size_bytes: None,
                });
            }
        }
    }
    if items.is_empty() {
        items.push(AttachmentSummary {
            name: "EmbeddedFiles entry detected (name parse unavailable)".to_string(),
            size_bytes: None,
        });
    }
    items
}

fn ensure_source_exists(path: &str) -> Result<(), SecurityServiceError> {
    if !Path::new(path).exists() {
        return Err(SecurityServiceError::Validation(format!(
            "Source file does not exist: {path}"
        )));
    }
    Ok(())
}

fn ensure_output_path(path: &str) -> Result<(), SecurityServiceError> {
    if path.trim().is_empty() {
        return Err(SecurityServiceError::Validation("Output path is required".to_string()));
    }
    Ok(())
}

fn qpdf_available() -> bool {
    Command::new("qpdf")
        .arg("--version")
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}

fn run_qpdf(args: &[&str]) -> Result<(), SecurityServiceError> {
    if !qpdf_available() {
        return Err(SecurityServiceError::Validation(
            "qpdf is not available in this runtime. Install qpdf to enable secure lock/unlock operations.".to_string(),
        ));
    }
    let output = Command::new("qpdf").args(args).output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(SecurityServiceError::Validation(if stderr.is_empty() {
            "qpdf operation failed".to_string()
        } else {
            format!("qpdf operation failed: {stderr}")
        }));
    }
    Ok(())
}
