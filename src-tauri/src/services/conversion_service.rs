use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::services::pdf_tools::{PdfToolError, PdfToolResult};
use crate::shared_types::QuickToolType;

pub struct ConversionService;

impl ConversionService {
    pub fn run_conversion(
        tool: &QuickToolType,
        source_paths: &[String],
        output_path: &str,
        options: &serde_json::Value,
    ) -> Result<PdfToolResult, PdfToolError> {
        match tool {
            QuickToolType::ImageToPdf => image_to_pdf(source_paths, output_path, options),
            QuickToolType::PdfToText => pdf_to_text(source_paths, output_path, options),
            QuickToolType::PdfToImages => scaffold_pdf_to_images(source_paths, output_path, options),
            QuickToolType::DocumentToPdf => scaffold_document_to_pdf(source_paths, output_path),
            QuickToolType::PdfToWord => scaffold_pdf_to_word(source_paths, output_path),
            QuickToolType::PdfToExcel => scaffold_pdf_to_excel(source_paths, output_path),
            _ => Err(PdfToolError::Validation("Unsupported conversion tool".to_string())),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImageToPdfOptions {
    #[serde(default = "default_image_page_sizing")]
    page_sizing: String,
}

fn default_image_page_sizing() -> String {
    "fit".to_string()
}

fn image_to_pdf(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.is_empty() {
        return Err(PdfToolError::Validation(
            "Image to PDF requires at least one image file".to_string(),
        ));
    }

    ensure_output_path(output_path)?;
    ensure_all_files_exist(source_paths)?;
    ensure_parent_directory(Path::new(output_path))?;

    let options: ImageToPdfOptions = serde_json::from_value(options.clone()).unwrap_or(ImageToPdfOptions {
        page_sizing: default_image_page_sizing(),
    });

    let mut images = Vec::new();
    for source in source_paths {
        let bytes = fs::read(source)?;
        let info = parse_jpeg_info(&bytes).ok_or_else(|| {
            PdfToolError::Validation(format!(
                "Only JPEG files are currently supported for image->PDF conversion: {source}"
            ))
        })?;
        images.push((source.clone(), bytes, info));
    }

    let mut writer = PdfWriter::new();
    let catalog_id = writer.push_object(b"<< /Type /Catalog /Pages 2 0 R >>".to_vec());
    debug_assert_eq!(catalog_id, 1);
    let pages_id = writer.reserve_object();

    let mut page_refs = Vec::new();

    for (index, (_, image_bytes, info)) in images.iter().enumerate() {
        let image_name = format!("Im{}", index + 1);
        let image_id = writer.push_stream_object(
            format!(
                "/Type /XObject /Subtype /Image /Width {} /Height {} /ColorSpace /{} /BitsPerComponent 8 /Filter /DCTDecode",
                info.width, info.height, info.color_space
            ),
            image_bytes,
        );

        let page_w = 595.0_f32;
        let page_h = 842.0_f32;
        let width = info.width as f32;
        let height = info.height as f32;
        let scale = if options.page_sizing == "fill" {
            (page_w / width).max(page_h / height)
        } else {
            (page_w / width).min(page_h / height)
        };
        let draw_w = width * scale;
        let draw_h = height * scale;
        let tx = (page_w - draw_w) / 2.0;
        let ty = (page_h - draw_h) / 2.0;

        let content = format!(
            "q\n{:.4} 0 0 {:.4} {:.4} {:.4} cm\n/{} Do\nQ\n",
            draw_w, draw_h, tx, ty, image_name
        );
        let content_id = writer.push_stream_object(String::new(), content.as_bytes());

        let page_id = writer.push_object(
            format!(
                "<< /Type /Page /Parent {} 0 R /MediaBox [0 0 {} {}] /Resources << /XObject << /{} {} 0 R >> >> /Contents {} 0 R >>",
                pages_id, page_w, page_h, image_name, image_id, content_id
            )
            .into_bytes(),
        );
        page_refs.push(page_id);
    }

    writer.set_reserved_object(
        pages_id,
        format!(
            "<< /Type /Pages /Kids [{}] /Count {} >>",
            page_refs
                .iter()
                .map(|id| format!("{} 0 R", id))
                .collect::<Vec<_>>()
                .join(" "),
            page_refs.len()
        )
        .into_bytes(),
    );

    let bytes = writer.finish(catalog_id)?;
    fs::write(output_path, bytes)?;

    Ok(PdfToolResult {
        message: format!(
            "Converted {} JPEG image(s) to PDF (PNG/WebP support planned)",
            source_paths.len()
        ),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PdfToTextOptions {
    #[serde(default = "default_text_format")]
    format: String,
    #[serde(default = "default_include_page_markers")]
    include_page_markers: bool,
}

fn default_text_format() -> String {
    "txt".to_string()
}

fn default_include_page_markers() -> bool {
    true
}

fn pdf_to_text(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() != 1 {
        return Err(PdfToolError::Validation(
            "PDF to text expects exactly one source file".to_string(),
        ));
    }

    ensure_output_path(output_path)?;
    ensure_all_files_exist(source_paths)?;
    ensure_parent_directory(Path::new(output_path))?;

    let opts: PdfToTextOptions = serde_json::from_value(options.clone()).unwrap_or(PdfToTextOptions {
        format: default_text_format(),
        include_page_markers: true,
    });

    let source = &source_paths[0];
    let bytes = fs::read(source)?;
    let text = String::from_utf8_lossy(&bytes);

    let mut extracted = Vec::new();
    let mut start = 0;
    while let Some(relative) = text[start..].find("(") {
        let open = start + relative;
        if let Some((value, end_pos)) = parse_pdf_literal_string(&text, open + 1) {
            let tail = &text[end_pos..text.len().min(end_pos + 16)];
            if tail.contains("Tj") || tail.contains("TJ") {
                let cleaned = value.trim();
                if !cleaned.is_empty() {
                    extracted.push(cleaned.to_string());
                }
            }
            start = end_pos;
        } else {
            break;
        }
    }

    if extracted.is_empty() {
        return Err(PdfToolError::Validation(
            "No selectable text found. Try OCR for scanned/image PDFs.".to_string(),
        ));
    }

    let output = PathBuf::from(output_path);
    if opts.format == "json" {
        let pages = vec![BTreeMap::from([
            ("page", "1".to_string()),
            ("text", extracted.join("\n")),
        ])];
        let payload = serde_json::json!({
            "source": source,
            "pages": pages,
            "note": "v1 extractor reads literal text operators; complex encoded fonts are TODO"
        });
        let bytes = serde_json::to_vec_pretty(&payload)
            .map_err(|error| PdfToolError::Validation(format!("JSON serialization failed: {error}")))?;
        fs::write(output, bytes)?;
    } else {
        let mut file = fs::File::create(output)?;
        if opts.include_page_markers {
            file.write_all(b"--- Page 1 ---\n")?;
        }
        file.write_all(extracted.join("\n").as_bytes())?;
    }

    Ok(PdfToolResult {
        message: "Extracted text from selectable-text PDF (v1 literal-text parser)".to_string(),
    })
}

fn parse_pdf_literal_string(input: &str, start: usize) -> Option<(String, usize)> {
    let bytes = input.as_bytes();
    let mut idx = start;
    let mut out = String::new();
    let mut depth = 1_u8;

    while idx < bytes.len() {
        let ch = bytes[idx] as char;
        if ch == '\\' {
            if idx + 1 >= bytes.len() {
                return None;
            }
            let escaped = bytes[idx + 1] as char;
            out.push(match escaped {
                'n' => '\n',
                'r' => '\r',
                't' => '\t',
                '(' => '(',
                ')' => ')',
                '\\' => '\\',
                _ => escaped,
            });
            idx += 2;
            continue;
        }
        if ch == '(' {
            depth = depth.saturating_add(1);
            out.push(ch);
            idx += 1;
            continue;
        }
        if ch == ')' {
            depth = depth.saturating_sub(1);
            idx += 1;
            if depth == 0 {
                return Some((out, idx));
            }
            out.push(')');
            continue;
        }
        out.push(ch);
        idx += 1;
    }

    None
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PdfToImagesOptions {
    format: String,
    dpi: u16,
}

fn scaffold_pdf_to_images(
    source_paths: &[String],
    output_path: &str,
    options: &serde_json::Value,
) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() != 1 {
        return Err(PdfToolError::Validation(
            "PDF to images expects exactly one source PDF".to_string(),
        ));
    }
    ensure_all_files_exist(source_paths)?;
    ensure_output_path(output_path)?;

    let opts: PdfToImagesOptions = serde_json::from_value(options.clone())
        .map_err(|_| PdfToolError::Validation("PDF to images requires `format` and `dpi` options".to_string()))?;
    if opts.dpi == 0 {
        return Err(PdfToolError::Validation("DPI must be greater than 0".to_string()));
    }

    Err(PdfToolError::NotImplemented(format!(
        "TODO(conversion/pdf-to-images): integrate renderer adapter boundary (pdfium/poppler). requested format={} dpi={}",
        opts.format, opts.dpi
    )))
}

fn scaffold_document_to_pdf(
    source_paths: &[String],
    output_path: &str,
) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() != 1 {
        return Err(PdfToolError::Validation(
            "Document to PDF expects exactly one source document".to_string(),
        ));
    }
    ensure_all_files_exist(source_paths)?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(conversion/document-to-pdf): add provider bridge (LibreOffice UNO / cloud adapter)".to_string(),
    ))
}

fn scaffold_pdf_to_word(source_paths: &[String], output_path: &str) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() != 1 {
        return Err(PdfToolError::Validation(
            "PDF to Word expects exactly one source PDF".to_string(),
        ));
    }
    ensure_all_files_exist(source_paths)?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(conversion/pdf-to-word): add layout reconstruction provider boundary".to_string(),
    ))
}

fn scaffold_pdf_to_excel(source_paths: &[String], output_path: &str) -> Result<PdfToolResult, PdfToolError> {
    if source_paths.len() != 1 {
        return Err(PdfToolError::Validation(
            "PDF to Excel expects exactly one source PDF".to_string(),
        ));
    }
    ensure_all_files_exist(source_paths)?;
    ensure_output_path(output_path)?;

    Err(PdfToolError::NotImplemented(
        "TODO(conversion/pdf-to-excel): add table extraction provider boundary".to_string(),
    ))
}

#[derive(Debug, Clone, Copy)]
struct JpegInfo {
    width: u16,
    height: u16,
    color_space: &'static str,
}

fn parse_jpeg_info(bytes: &[u8]) -> Option<JpegInfo> {
    if bytes.len() < 4 || bytes[0] != 0xFF || bytes[1] != 0xD8 {
        return None;
    }

    let mut i = 2usize;
    while i + 9 < bytes.len() {
        if bytes[i] != 0xFF {
            i += 1;
            continue;
        }
        let marker = bytes[i + 1];
        if marker == 0xD9 || marker == 0xDA {
            break;
        }
        let segment_len = u16::from_be_bytes([bytes[i + 2], bytes[i + 3]]) as usize;
        if segment_len < 2 || i + 2 + segment_len > bytes.len() {
            return None;
        }

        if matches!(
            marker,
            0xC0 | 0xC1 | 0xC2 | 0xC3 | 0xC5 | 0xC6 | 0xC7 | 0xC9 | 0xCA | 0xCB | 0xCD | 0xCE | 0xCF
        ) {
            let height = u16::from_be_bytes([bytes[i + 5], bytes[i + 6]]);
            let width = u16::from_be_bytes([bytes[i + 7], bytes[i + 8]]);
            let components = bytes[i + 9];
            let color_space = if components == 1 { "DeviceGray" } else { "DeviceRGB" };
            return Some(JpegInfo {
                width,
                height,
                color_space,
            });
        }

        i += 2 + segment_len;
    }

    None
}

struct PdfWriter {
    objects: Vec<Vec<u8>>,
}

impl PdfWriter {
    fn new() -> Self {
        Self { objects: Vec::new() }
    }

    fn reserve_object(&mut self) -> usize {
        self.objects.push(Vec::new());
        self.objects.len()
    }

    fn set_reserved_object(&mut self, id: usize, payload: Vec<u8>) {
        self.objects[id - 1] = payload;
    }

    fn push_object(&mut self, payload: Vec<u8>) -> usize {
        self.objects.push(payload);
        self.objects.len()
    }

    fn push_stream_object(&mut self, dict_body: String, stream: &[u8]) -> usize {
        let mut payload = format!("<< {} /Length {} >>\nstream\n", dict_body, stream.len()).into_bytes();
        payload.extend_from_slice(stream);
        payload.extend_from_slice(b"\nendstream");
        self.push_object(payload)
    }

    fn finish(self, root_id: usize) -> Result<Vec<u8>, PdfToolError> {
        let mut out = b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n".to_vec();
        let mut offsets = Vec::with_capacity(self.objects.len() + 1);
        offsets.push(0usize);

        for (idx, payload) in self.objects.iter().enumerate() {
            offsets.push(out.len());
            out.extend_from_slice(format!("{} 0 obj\n", idx + 1).as_bytes());
            out.extend_from_slice(payload);
            out.extend_from_slice(b"\nendobj\n");
        }

        let xref_start = out.len();
        out.extend_from_slice(format!("xref\n0 {}\n", self.objects.len() + 1).as_bytes());
        out.extend_from_slice(b"0000000000 65535 f \n");
        for offset in offsets.iter().skip(1) {
            out.extend_from_slice(format!("{offset:010} 00000 n \n").as_bytes());
        }
        out.extend_from_slice(
            format!(
                "trailer\n<< /Size {} /Root {} 0 R >>\nstartxref\n{}\n%%EOF\n",
                self.objects.len() + 1,
                root_id,
                xref_start
            )
            .as_bytes(),
        );

        if self.objects.is_empty() {
            return Err(PdfToolError::Validation(
                "Unable to build PDF with zero objects".to_string(),
            ));
        }

        Ok(out)
    }
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

fn ensure_parent_directory(path: &Path) -> Result<(), PdfToolError> {
    if let Some(parent) = path.parent()
        && !parent.as_os_str().is_empty()
        && !parent.exists()
    {
        return Err(PdfToolError::Validation(format!(
            "Output directory does not exist: {}",
            parent.display()
        )));
    }
    Ok(())
}

fn ensure_output_path(path: &str) -> Result<(), PdfToolError> {
    if path.trim().is_empty() {
        return Err(PdfToolError::Validation("Output path is required".to_string()));
    }
    Ok(())
}
