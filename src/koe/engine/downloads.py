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
    "whistle": {
        "repo": "Cactus-Compute/whistle",
        "check_file": "whistle.cact",
        "files": ["whistle.cact"],
    },
}


def whisper_model_info(model_name: str) -> dict:
    if model_name in MODELS:
        return MODELS[model_name]
    return {
        "repo": f"Systran/faster-whisper-{model_name}",
        "check_file": "model.bin",
        "files": None,
    }


def is_downloaded(info: dict) -> bool:
    cached = try_to_load_from_cache(info["repo"], info["check_file"])
    return isinstance(cached, str)


def local_path(info: dict) -> str:
    return try_to_load_from_cache(info["repo"], info["check_file"])


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
