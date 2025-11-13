# Developer Setup

This guide collects the extra setup steps and tooling notes that make day‑to‑day
development smoother. Follow the [README Local Setup](../README.md#local-setup)
to get the app running, then apply the optimizations below.

## Python Environment Tips

- Prefer a local virtual environment (`python -m venv .myenv`) so editable
  installs and per-project dependencies do not leak into the global Python
  interpreter.
- After installing requirements, run a quick smoke test to make sure the Python
  bindings can see the system `secp256k1` library:

  ```bash
  python - <<'PY'
  import secp256k1
  print("secp256k1 loaded:", secp256k1.__version__)
  PY
  ```

- If the import fails, verify that the system-level library is installed and
  reinstall the Python bindings with `pip install --no-binary=:all: secp256k1`.

## IDE / Type Checking (Pyright)

We check type hints with [Pyright](https://github.com/microsoft/pyright). To
avoid "Import could not be resolved" errors for the editable `python-bitcointx`
dependency, add the virtual environment’s paths to `pyrightconfig.json`:

```json
{
  "typeCheckingMode": "basic",
  "extraPaths": [
    ".myenv/src/python-bitcointx"
  ]
}
```

- Relative paths are resolved from the repository root. If your editable install
  lives elsewhere, swap in the absolute path to that directory.
- You can tighten type checking (`standard` or `strict`) once the codebase is
  clean under `basic`.

Run Pyright manually with:

```bash
node_modules/.bin/pyright
```

or rely on the VS Code extension for on-save diagnostics.

## Optional environment file

Create `.env.local` (or set environment variables manually) to tweak defaults while keeping secrets out of version control:

```bash
VITE_API_BASE_URL=http://localhost:5007
# VITE_SHARE_BASE_URL=http://localhost:8787  # only if you run a share service
```

See the README’s Local Setup section for the full list of supported environment flags you can copy as a baseline.

## JavaScript Tooling

Vite, ESLint, and Vitest are already configured via `npm install`. Useful
commands:

- `npm run lint` – type-aware ESLint pass over the frontend.
- `npm run test` – frontend unit/integration suite.
- `npm run test:e2e` – Playwright end-to-end tests (backend must be running).

Install Playwright browsers once with `npx playwright install`.

## Backend Testing

Backend tests live in `backend/tests`. To run them directly:

```bash
python -m pytest backend/tests
```

The helper script `python3 run_all_tests.py` drives both frontend and
backend suites sequentially and respects the `RUN_ALL_TESTS_*` overrides
documented in the README.

## Logging & Debugging

- The backend reads configuration from `backend/config.py`; override values with
  environment variables when debugging rate limits or calculation budgets.
- Use `FLASK_DEBUG=1 python backend/routes.py` for interactive reloading during
  API development.
