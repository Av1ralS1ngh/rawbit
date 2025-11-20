# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6] - 2025-11-13

### Added

- Initial public release: raw Bitcoin transaction builder (educational).
- Frontend (Vite + React + shadcn/ui) and Python backend.
- Examples, basic tests, and docs.

## [0.2.8] - 2025-11-18

### Added

- Mobile read-only experience with device detection, zoom limits, banner actions (load lessons + theme toggle), and hidden canvas controls.
- Safer share imports: opening a shared flow now spins up a new tab when the browser already has saved work, keeping canvases isolated.
- YouTube link in the community menu plus refreshed intro copy for the README/landing text.

### Fixed

- Random 32-byte node no longer gets stuck in error when the backend hiccups (new backend tests cover regen/normal paths).
