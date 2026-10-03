import tomllib
from dataclasses import dataclass
from pathlib import Path

SETTINGS_FILE = Path(__file__).resolve().parents[2] / "settings.toml"


@dataclass(frozen=True)
class Settings:
    projects_dir: str
    voice_name: str
    voice_speed: float
    whisper_model: str
    language: str
    push_to_talk_key: str


def load_settings() -> Settings:
    raw = tomllib.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    return Settings(
        projects_dir=raw["session"]["projects_dir"],
        voice_name=raw["voice"]["name"],
        voice_speed=raw["voice"]["speed"],
        whisper_model=raw["hearing"]["whisper_model"],
        language=raw["hearing"]["language"],
        push_to_talk_key=raw["hearing"]["push_to_talk_key"],
    )
