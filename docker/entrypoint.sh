#!/bin/sh
set -eu

APP_DATA_ROOT="${HF_BUCKET_LOCAL_DIR:-/data/qwen2api}"
export HF_BUCKET_LOCAL_DIR="$APP_DATA_ROOT"

mkdir -p "$APP_DATA_ROOT/data" "$APP_DATA_ROOT/caches" "$APP_DATA_ROOT/logs"

export DATA_DIR="${DATA_DIR:-$APP_DATA_ROOT/data}"
export CACHE_DIR="${CACHE_DIR:-$APP_DATA_ROOT/caches}"
export LOG_DIR="${LOG_DIR:-$APP_DATA_ROOT/logs}"
export SERVICE_PORT="${SERVICE_PORT:-7860}"
export LISTEN_ADDRESS="${LISTEN_ADDRESS:-0.0.0.0}"
export HF_BUCKET_SYNC_INTERVAL="${HF_BUCKET_SYNC_INTERVAL:-300}"

python3 /app/scripts/hf-bucket-sync.py restore || true
python3 /app/scripts/hf-bucket-sync.py daemon &

exec npm start
