import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent
TEST_DIR = Path(__file__).resolve().parent

# Ensure coverage data stays under backend/tests/.coverage when pytest-cov runs
os.environ.setdefault("COVERAGE_FILE", str(TEST_DIR / ".coverage"))

for path in (str(PROJECT_ROOT), str(BASE_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)
