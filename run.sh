#!/usr/bin/env bash
set -euo pipefail

if [ -x ".venv/bin/uvicorn" ]; then
  .venv/bin/uvicorn app.main:app --reload --port "${PORT:-8000}"
else
  uvicorn app.main:app --reload --port "${PORT:-8000}"
fi
