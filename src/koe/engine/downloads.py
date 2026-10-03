from typing import Callable

from huggingface_hub import snapshot_download, try_to_load_from_cache

MODELS = {
    "kokoro": {
        "repo": "hexgrad/Kokoro-82M",
        "check_file": "kokoro-v1_0.pth",
        "files": ["config.json", "kokoro-v1_0.pth", "voices/*"],
    },
}


def whisper_model_info(model_name: str) -> dict:
    return {
        "repo": f"Systran/faster-whisper-{model_name}",
        "check_file": "model.bin",
        "files": None,
    }


def is_downloaded(info: dict) -> bool:
    cached = try_to_load_from_cache(info["repo"], info["check_file"])
    return isinstance(cached, str)


def download(info: dict, on_progress: Callable[[float], None]) -> None:
    class ProgressBar:
        def __init__(self, *args, total=None, **kwargs):
            self.total = total or 1
            self.done = 0

        def update(self, amount=1):
            self.done += amount
            on_progress(min(self.done / self.total, 1.0))

        def __enter__(self):
            return self

        def __exit__(self, *args):
            on_progress(1.0)

        def close(self):
            on_progress(1.0)

        def set_description(self, *args, **kwargs):
            pass

    snapshot_download(info["repo"], allow_patterns=info["files"], tqdm_class=ProgressBar)
