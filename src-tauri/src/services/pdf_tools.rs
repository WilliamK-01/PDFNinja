use std::path::Path;

use serde::Deserialize;

use crate::services::conversion_service::ConversionService;
use crate::shared_types::{
    PageOperationRequest, PageOperationType, QuickToolJobRequest, QuickToolType,
};

#[derive(Debug, thiserror::Error)]
pub enum PdfToolError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("tool not implemented yet: {0}")]
    NotImplemented(String),
}

#[derive(Debug)]
pub struct PdfToolResult {
    pub message: String,
}

pub fn run_tool(request: &QuickToolJobRequest) -> Result<PdfToolResult, PdfToolError> {
    match request.tool {
        QuickToolType::MergePdfs => merge_pdfs(&request.source_paths, &request.output_path),
        QuickToolType::SplitPdf => split_pdf(&request.source_paths, &request.output_path),
        QuickToolType::ExtractPages => extract_pages(
            &request.source_paths,
            &request.output_path,
            &request.options,
        ),
        QuickToolType::RemovePages => remove_pages(
            &request.source_paths,
            &request.output_path,
            &request.options,
        ),
        QuickToolType::RotatePages => rotate_pages(
            &request.source_paths,
            &request.output_path,
            &request.options,
        ),
        QuickToolType::CompressPdf => compress_pdf(&request.source_paths, &request.output_path),
        QuickToolType::ImageToPdf
        | QuickToolType::PdfToImages
        | QuickToolType::PdfToText
        | QuickToolType::DocumentToPdf
        | QuickToolType::PdfToWord
        | QuickToolType::PdfToExcel => ConversionService::run_conversion(
            &request.tool,
            &request.source_paths,
            &request.output_path,
            &request.options,
        ),
        QuickToolType::OcrPdf => Err(PdfToolError::NotImplemented(
            "OCR uses the dedicated ocr_service pipeline".to_string(),
        )),
    }
}

pub fn run_page_operation(request: &PageOperationRequest) -> Result<PdfToolResult, PdfToolError> {
    let source_paths = vec![request.source_path.clone()];

    match request.operation {
        PageOperationType::DeletePages => {
            let options = serde_json::json!({ "pages": request.selected_pages });
            remove_pages(&source_paths, &request.output_path, &options)
        }
        PageOperationType::ExtractPages => {
            let options = serde_json::json!({ "pages": request.selected_pages });
            extract_pages(&source_paths, &request.output_path, &options)
        }
        PageOperationType::RotatePages => {
            let degrees = request.degrees.ok_or_else(|| {
                PdfToolError::Validation("Rotate pages requires `degrees`".to_string())
            })?;
            let options =
                serde_json::json!({ "pages": request.selected_pages, "degrees": degrees });
            rotate_pages(&source_paths, &request.output_path, &options)
        }
        PageOperationType::ReorderPages => {
            require_single_source(&source_paths, "Reorder pages")?;
            ensure_output_path(&request.output_path)?;
            let target_order = request.target_order.as_ref().ok_or_else(|| {
                PdfToolError::Validation("Reorder pages requires `targetOrder`".to_string())
            })?;
            if target_order.is_empty() {
                return Err(PdfToolError::Validation(
                    "Reorder pages requires a non-empty target order".to_string(),
                ));
            }
            Err(PdfToolError::NotImplemented(
                "TODO(pdf-core): integrate page reorder backend".to_string(),
            ))
        }
        PageOperationType::DuplicatePages => {
            require_single_source(&source_paths, "Duplicate pages")?;
            ensure_output_path(&request.output_path)?;
            if request.selected_pages.is_empty() {
                return Err(PdfToolError::Validation(
                    "Provide at least one page to duplicate".to_string(),
                ));
            }
            Err(PdfToolError::NotImplemented(
                "TODO(pdf-core): integrate page duplication backend".to_string(),
            ))
        }
    }
}

fn merge_pdfs(source_paths: &[String], output_path: &str) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() < 2 {
        return Err(PdfToolError::Validation(
            "Merge requires at least two PDFs".to_string(),
        ));
    }

    ensure_all_files_exist(source_paths)?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate a native PDF merge backend (lopdf/qpdf adapter)".to_string(),
    ))
}

fn split_pdf(source_paths: &[String], output_path: &str) -> Result<PdfToolResult, PdfToolError> {
    require_single_source(source_paths, "Split")?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate page-level split writer using a PDF backend".to_string(),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageListOptions {
    pages: Vec<u32>,
}

fn extract_pages(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    require_single_source(source_paths, "Extract pages")?;
    ensure_output_path(output_path)?;

    let page_options: PageListOptions = serde_json::from_value(options.clone())
        .map_err(|_| PdfToolError::Validation("Extract pages requires `pages` list".to_string()))?;

    if page_options.pages.is_empty() {
        return Err(PdfToolError::Validation(
            "Provide at least one page number".to_string(),
        ));
    }

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate selective page extraction backend".to_string(),
    ))
}

fn remove_pages(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    require_single_source(source_paths, "Remove pages")?;
    ensure_output_path(output_path)?;

    let page_options: PageListOptions = serde_json::from_value(options.clone())
        .map_err(|_| PdfToolError::Validation("Remove pages requires `pages` list".to_string()))?;

    if page_options.pages.is_empty() {
        return Err(PdfToolError::Validation(
            "Provide at least one page number".to_string(),
        ));
    }

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate page removal backend".to_string(),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RotateOptions {
    pages: Vec<u32>,
    degrees: i64,
}

fn rotate_pages(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    require_single_source(source_paths, "Rotate pages")?;
    ensure_output_path(output_path)?;

    let rotate_options: RotateOptions = serde_json::from_value(options.clone()).map_err(|_| {
        PdfToolError::Validation("Rotate pages requires `pages` and `degrees`".to_string())
    })?;

    if rotate_options.pages.is_empty() {
        return Err(PdfToolError::Validation(
            "Provide at least one page number".to_string(),
        ));
    }

    if ![90, 180, 270].contains(&rotate_options.degrees) {
        return Err(PdfToolError::Validation(
            "Rotation only supports 90, 180, or 270 degrees".to_string(),
        ));
    }

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate page rotation backend".to_string(),
    ))
}

fn compress_pdf(source_paths: &[String], output_path: &str) -> Result<PdfToolResult, PdfToolError> {
    require_single_source(source_paths, "Compress")?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(pdf-core): integrate content-stream compression backend".to_string(),
    ))
}

fn require_single_source<'a>(
    paths: &'a [String],
    action: &str,
) -> Result<&'a String, PdfToolError> {
    if paths.len() != 1 {
        return Err(PdfToolError::Validation(format!(
            "{action} expects exactly one source file"
        )));
    }

    ensure_all_files_exist(paths)?;
    Ok(&paths[0])
}

fn ensure_all_files_exist(paths: &[String]) -> Result<(), PdfToolError> {
    for path in paths {
        if !Path::new(path).exists() {
            return Err(PdfToolError::Validation(format!(
                "Source file does not exist: {path}"
            )));
        }
    }

    Ok(())
}

fn ensure_output_path(path: &str) -> Result<(), PdfToolError> {
    if path.trim().is_empty() {
        return Err(PdfToolError::Validation(
            "Output path is required".to_string(),
        ));
    }

    Ok(())
}
