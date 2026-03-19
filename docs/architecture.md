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

## Scalability decisions

- Feature-first frontend folders to avoid page-level sprawl as modules grow.
- Command/service/state split in Rust to keep invoke surface stable while internals evolve.
- Shared type contracts for predictable API boundaries between TypeScript and Rust.
- Queue abstraction in backend (`JobQueue`, `JobService`) to support future workers and pipeline stages.
- Settings storage isolated behind store/service layers for easy migration to sqlite or structured stores.
