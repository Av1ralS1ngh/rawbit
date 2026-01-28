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

## [0.3.0] - 2026-01-22

### Added

- Taproot lessons (L11 key-path, L12 script-path/MAST) with new Taproot node templates and calc helpers (taptree, control block, preimage builders, scriptPubKeys builder).
- Taproot-aware script verification and tapscript opcode catalog updates (incl. OP_CHECKSIGADD).
- Mobile read-only banner polish with a GitHub shortcut and tighter action layout.

### Fixed

- Calculation UX improvements (removed input-completeness gating, stabilized script step UI, and connected-input display fixes).
- ResizeObserver drag warnings in the canvas/text node.

## [0.3.1] - 2026-01-24

### Fixed

- Lesson 12: fix Taproot tweak node wiring (wrong node).

## [0.3.2] - 2026-01-26

### Fixed

- Lesson 12: update Taproot flow input transactions and amounts.

## [0.3.4] - 2026-01-28

### Changed

- Search panel no longer includes “Highlight & Select”.

### Fixed

- TextInfoNode header corner bleed when zoomed out.
- Lesson flows: refreshed Lesson 12 spending logic and rewired Lesson 11 multi-input signing to use even-Y privkeys.
