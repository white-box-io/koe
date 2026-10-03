import os
from pathlib import Path

HUGGING_FACE_CACHE = Path.home() / ".cache" / "huggingface" / "hub"
REQUIRED_MODELS = ["models--hexgrad--Kokoro-82M", "models--Systran--faster-whisper-small.en"]


def use_cached_models_offline() -> None:
    """Skips the online update check once every model is already downloaded."""
    if all((HUGGING_FACE_CACHE / model).exists() for model in REQUIRED_MODELS):
        os.environ["HF_HUB_OFFLINE"] = "1"
