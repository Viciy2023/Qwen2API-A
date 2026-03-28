import os
import sys
import time
import threading
from pathlib import Path

from huggingface_hub import sync_bucket
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


BUCKET_REPO = os.environ.get("HF_BUCKET_REPO", "").strip()
BUCKET_TOKEN = (
    os.environ.get("HF_BUCKET_TOKEN", "").strip()
    or os.environ.get("HF_TOKEN", "").strip()
)
LOCAL_ROOT = Path(os.environ.get("HF_BUCKET_LOCAL_DIR", "/data/qwen2api")).resolve()
REMOTE_ROOT = os.environ.get("HF_BUCKET_REMOTE_DIR", "runtime").strip("/")
SYNC_INTERVAL = int(os.environ.get("HF_BUCKET_SYNC_INTERVAL", "300"))
STARTUP_GRACE_SECONDS = int(os.environ.get("HF_BUCKET_STARTUP_GRACE_SECONDS", "30"))
SYNC_DEBOUNCE_SECONDS = int(os.environ.get("HF_BUCKET_SYNC_DEBOUNCE_SECONDS", "5"))


def log(message: str) -> None:
    print(f"[hf-bucket] {message}", flush=True)


def bucket_path() -> str:
    if REMOTE_ROOT:
        return f"hf://buckets/{BUCKET_REPO}/{REMOTE_ROOT}"
    return f"hf://buckets/{BUCKET_REPO}"


def ensure_local_root() -> None:
    LOCAL_ROOT.mkdir(parents=True, exist_ok=True)


def can_use_bucket() -> bool:
    if not BUCKET_REPO:
        log("skip: HF_BUCKET_REPO 未设置")
        return False
    if not BUCKET_TOKEN:
        log("skip: HF_TOKEN 或 HF_BUCKET_TOKEN 未设置")
        return False
    return True


def restore() -> None:
    if not can_use_bucket():
        return

    ensure_local_root()
    try:
        sync_bucket(bucket_path(), str(LOCAL_ROOT), token=BUCKET_TOKEN)
        log(f"restore 完成: {bucket_path()} -> {LOCAL_ROOT}")
    except Exception as exc:
        log(f"restore 失败: {exc}")


def push() -> None:
    if not can_use_bucket():
        return

    ensure_local_root()
    try:
        sync_bucket(str(LOCAL_ROOT), bucket_path(), token=BUCKET_TOKEN, delete=False)
        log(f"sync 完成: {LOCAL_ROOT} -> {bucket_path()}")
    except Exception as exc:
        log(f"sync 失败: {exc}")


def daemon() -> None:
    if not can_use_bucket():
        return

    class ChangeHandler(FileSystemEventHandler):
        def __init__(self) -> None:
            self._timer = None
            self._lock = threading.Lock()
            self._startup_time = time.time()

        def _schedule(self) -> None:
            if time.time() - self._startup_time < STARTUP_GRACE_SECONDS:
                return

            with self._lock:
                if self._timer is not None:
                    self._timer.cancel()
                self._timer = threading.Timer(SYNC_DEBOUNCE_SECONDS, push)
                self._timer.daemon = True
                self._timer.start()

        def on_created(self, event):
            if not event.is_directory:
                self._schedule()

        def on_modified(self, event):
            if not event.is_directory:
                self._schedule()

        def on_deleted(self, event):
            if not event.is_directory:
                self._schedule()

        def on_moved(self, event):
            if not event.is_directory:
                self._schedule()

    observer = Observer()
    observer.schedule(ChangeHandler(), str(LOCAL_ROOT), recursive=True)
    observer.start()

    log(
        f"后台同步已启动，监听目录 {LOCAL_ROOT}，即时同步防抖 {SYNC_DEBOUNCE_SECONDS} 秒，定时兜底 {SYNC_INTERVAL} 秒"
    )

    def periodic_sync() -> None:
        while True:
            time.sleep(SYNC_INTERVAL)
            push()

    periodic_thread = threading.Thread(target=periodic_sync, daemon=True)
    periodic_thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def main() -> int:
    command = sys.argv[1] if len(sys.argv) > 1 else "daemon"

    if command == "restore":
        restore()
        return 0
    if command == "push":
        push()
        return 0
    if command == "daemon":
        daemon()
        return 0

    log(f"未知命令: {command}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
