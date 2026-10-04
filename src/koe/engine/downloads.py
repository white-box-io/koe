import io
from typing import Callable

from huggingface_hub import snapshot_download, try_to_load_from_cache
from tqdm import tqdm

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
    class ProgressBar(tqdm):
        def __init__(self, *args, **kwargs):
            kwargs["file"] = io.StringIO()
            super().__init__(*args, **kwargs)

        def update(self, amount=1):
            super().update(amount)
            if self.total:
                on_progress(min(self.n / self.total, 1.0))

    snapshot_download(info["repo"], allow_patterns=info["files"], tqdm_class=ProgressBar)
    on_progress(1.0)
