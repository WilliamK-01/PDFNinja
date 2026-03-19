# PDFNinja Foundation Architecture

## Frontend (Tauri + React + TypeScript)

- `src/components/layout`: reusable app shell primitives (sidebar, toolbar, workspace, inspector, jobs panel).
- `src/features/*`: feature modules grouped by product area (`home`, `quick-tools`, `editor`, `automation`, `settings`).
- `src/state`: app-level state container and domain actions for route, documents, tools, jobs, settings.
- `src/shared`: cross-layer TypeScript contracts mirrored by Rust DTOs.

## Backend (Rust/Tauri commands)

- `src-tauri/src/commands`: thin invoke handlers for app snapshot, settings, and jobs.
- `src-tauri/src/services`: business logic that validates and mutates state.
- `src-tauri/src/state`: in-memory state holders (`AppState`, `JobQueue`).
- `src-tauri/src/storage`: persistence adapters (`SettingsStore`) for local-only configuration.
- `src-tauri/src/shared_types.rs`: serialized types aligned to frontend shared interfaces.

## OCR pipeline (v1, offline-first)

- OCR logic is separated from generic PDF operations in `src-tauri/src/services/ocr_service.rs`.
- Entry points:
  - Quick Tools OCR uses `run_quick_tool_job` and routes OCR jobs into `OcrService`.
  - Editor OCR action uses dedicated `run_ocr_job`.
- Pipeline stages tracked in job updates:
  1. raster/page input (source validation + page count probe)
  2. preprocessing (deskew/despeckle hooks)
  3. OCR (native `ocrmypdf` + `tesseract`)
  4. text layer generation
  5. output PDF generation (atomic partial file rename)
- Job details expose OCR summary data for UI:
  - `pagesProcessed`
  - `languageUsed`
  - `confidence` (currently nullable)
- Future hooks already modeled in request/details contracts:
  - deskew
  - despeckle
  - multi-language lists
  - uncertain text review

## Conversion suite architecture (v1)

- `quick_tools_service` still owns job lifecycle/progress updates and routes conversion jobs through `pdf_tools::run_tool`.
- `pdf_tools` now delegates conversion-specific quick tools into `services/conversion_service.rs`.
- `conversion_service` is the backend boundary for:
  - **implemented now**: `image-to-pdf` (JPEG sources) and `pdf-to-text` (literal text extraction v1).
  - **scaffolded with TODO boundaries**: `pdf-to-images`, `document-to-pdf`, `pdf-to-word`, `pdf-to-excel`.
- This keeps the future heavy integrations isolated (PDF renderer, LibreOffice/Office bridge, layout reconstruction) without changing frontend contracts.

## Scalability decisions

- Feature-first frontend folders to avoid page-level sprawl as modules grow.
- Command/service/state split in Rust to keep invoke surface stable while internals evolve.
- Shared type contracts for predictable API boundaries between TypeScript and Rust.
- Queue abstraction in backend (`JobQueue`, `JobService`) to support future workers and pipeline stages.
- Settings storage isolated behind store/service layers for easy migration to sqlite or structured stores.
