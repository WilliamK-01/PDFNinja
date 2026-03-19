# PDFNinja

Offline-first cross-platform PDF suite foundation using Tauri, React, TypeScript, Tailwind, and Rust.

## Product Modes
- Express mode (Quick Tools)
- Editor mode (deep document workflows)
- Automation mode (batch and reusable pipelines)

## Development
```bash
npm install
npm run dev
```

## OCR prerequisites (offline)

The first OCR workflow uses native CLI dependencies that run locally (no cloud services):

- `ocrmypdf`
- `tesseract`
- Tesseract language data (e.g. `eng`, `spa`)
- Optional but recommended: `ghostscript`, `qpdf`, `pngquant` (pulled by `ocrmypdf` on most package managers)

If `ocrmypdf` is not installed, OCR jobs fail with a dependency error in-app.

## Architecture
See `docs/architecture.md`.
