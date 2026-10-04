import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np

from koe.cuda_paths import add_torch_cuda_dlls
from koe.engine import downloads
from koe.engine.protocol import emit
from koe.engine.voices import PREVIEW_SENTENCE, VOICES
from koe.spoken_text import to_spoken_text

MIN_SPEECH_SECONDS = 0.4
LEVEL_EVERY_SECONDS = 1 / 30
WHISPER_GHOST_PHRASES = {"you", "thank you", "thanks for watching", "bye"}

DEFAULT_SETTINGS = {
    "hotkey": "right ctrl",
    "voice": "af_heart",
    "speed": 1.1,
    "mic_index": None,
    "whisper_model": "small.en",
    "language": "en",
    "device": "auto",
    "type_into_claude": True,
    "voice_provider": "kokoro",
    "eleven_api_key": "",
    "eleven_voice_id": "",
}


def pick_device(preference: str) -> tuple[str, str | None]:
    add_torch_cuda_dlls()
    import torch

    if preference != "cpu" and torch.cuda.is_available():
        return "cuda", torch.cuda.get_device_name(0)
    return "cpu", None


def is_ghost_phrase(text: str, held_seconds: float) -> bool:
    cleaned = text.lower().strip(" .!?")
    return cleaned in WHISPER_GHOST_PHRASES and held_seconds < 1.2


class Engine:
    def __init__(self):
        self.settings = dict(DEFAULT_SETTINGS)
        self.device = "cpu"
        self.transcriber = None
        self.speaker = None
        self.microphone = None
        self.is_ready = False
        self.latest_mic_level = 0.0

    # ---------- boot ----------

    def boot(self) -> None:
        emit("loading", stage="starting", progress=0.02)
        self.device, gpu_name = pick_device(self.settings["device"])
        emit("device", device=self.device, gpu=gpu_name)
        if self.device == "cpu" and self.settings["device"] != "cpu":
            emit("error", kind="gpu_fallback", message="Your GPU couldn't be used, so Koe runs on the CPU.")

        if not self._download_models():
            return
        self._mark_models_offline()
        self._load_models()
        self._start_microphone()
        threading.Thread(target=self._level_loop, daemon=True).start()
        self.is_ready = True
        emit("ready", device=self.device, gpu=gpu_name)

    def _download_models(self) -> bool:
        models = [
            ("whisper", downloads.whisper_model_info(self.settings["whisper_model"])),
            ("kokoro", downloads.MODELS["kokoro"]),
        ]
        missing = [(name, info) for name, info in models if not downloads.is_downloaded(info)]
        for position, (name, info) in enumerate(missing):
            def report(fraction, name=name, position=position):
                overall = 0.05 + 0.5 * (position + fraction) / len(missing)
                emit("download", model=name, progress=round(fraction, 3))
                emit("loading", stage=f"downloading {name}", progress=round(overall, 3))

            try:
                downloads.download(info, report)
            except Exception as error:
                emit("error", kind="download_failed", model=name, message=str(error))
                return False
        return True

    def _mark_models_offline(self) -> None:
        os.environ["HF_HUB_OFFLINE"] = "1"

    def _load_models(self) -> None:
        emit("loading", stage="loading voice", progress=0.6)
        from koe.engine.speaker import Speaker
        from koe.engine.transcriber import Transcriber

        with ThreadPoolExecutor() as loader:
            loading_speaker = loader.submit(Speaker, self.device, self._on_speaking_changed, self._on_sentence)
            loading_transcriber = loader.submit(
                Transcriber, self.settings["whisper_model"], self.settings["language"], self.device
            )
            self.speaker = loading_speaker.result()
            emit("loading", stage="loading hearing", progress=0.8)
            self.transcriber = loading_transcriber.result()
        self.speaker.on_voice_error = lambda message: emit("error", kind="voice_failed", message=message)
        self._apply_voice_settings()
        self.speaker.start()
        emit("loading", stage="almost ready", progress=0.95)

    def _start_microphone(self) -> None:
        from koe.engine.focus import start_tracking
        from koe.engine.microphone import Microphone

        start_tracking()
        self.microphone = Microphone(self._on_press, self._on_release, self._on_mic_level, self._on_cancel)
        self.microphone.hotkey = self.settings["hotkey"]
        self.microphone.device_index = self.settings["mic_index"]
        try:
            self.microphone.start()
        except Exception as error:
            emit("error", kind="mic_missing", message=str(error))

    # ---------- audio callbacks ----------

    def _on_press(self) -> None:
        if self.speaker and self.speaker.stop():
            emit("stopped")
        emit("recording", on=True)

    def _on_cancel(self) -> None:
        emit("recording", on=False)
        emit("cancelled")

    def _on_release(self, audio: np.ndarray, held_seconds: float) -> None:
        emit("recording", on=False)
        if held_seconds < MIN_SPEECH_SECONDS or len(audio) == 0:
            return
        emit("transcribing")
        text = self.transcriber.transcribe(audio)
        if not text or is_ghost_phrase(text, held_seconds):
            emit("heard", text="")
            return
        emit("heard", text=text)
        if self.settings["type_into_claude"]:
            from koe.engine.focus import focus_claude_window
            from koe.prompt_typer import type_into_focused_window

            focus_claude_window()
            type_into_focused_window(text)

    def _on_mic_level(self, level: float) -> None:
        self.latest_mic_level = level

    def _on_speaking_changed(self, is_speaking: bool) -> None:
        emit("speaking", on=is_speaking)

    def _on_sentence(self, sentence: str, seconds: float) -> None:
        emit("sentence", text=sentence, seconds=round(seconds, 2))

    def _level_loop(self) -> None:
        while True:
            mic = self.latest_mic_level if self.microphone and (self.microphone.is_recording or self.microphone.is_testing) else 0.0
            voice = self.speaker.current_level() if self.speaker and self.speaker.is_speaking else 0.0
            if mic or voice:
                emit("level", mic=round(mic, 3), voice=round(voice, 3))
            time.sleep(LEVEL_EVERY_SECONDS)

    # ---------- commands ----------

    def handle(self, command: dict) -> None:
        name = command.get("cmd")
        handler = getattr(self, f"_cmd_{name}", None)
        if handler is None:
            emit("log", message=f"unknown command {name}")
            return
        handler(command)

    def _cmd_speak(self, command: dict) -> None:
        if self.speaker:
            self.speaker.say(to_spoken_text(command.get("text", "")))

    def _cmd_stop(self, command: dict) -> None:
        if self.speaker and self.speaker.stop():
            emit("stopped")

    def _cmd_pause(self, command: dict) -> None:
        if self.microphone:
            self.microphone.is_paused = bool(command.get("on"))
        emit("paused", on=bool(command.get("on")))

    def _cmd_mic_test(self, command: dict) -> None:
        if self.microphone:
            self.microphone.is_testing = bool(command.get("on"))

    def _cmd_list_devices(self, command: dict) -> None:
        from koe.engine.microphone import list_input_devices

        emit("devices", inputs=list_input_devices())

    def _cmd_list_voices(self, command: dict) -> None:
        emit("voices", voices=VOICES)

    def _cmd_list_eleven_voices(self, command: dict) -> None:
        from koe.engine import elevenlabs

        try:
            emit("eleven_voices", voices=elevenlabs.list_voices(command.get("api_key", "")))
        except Exception as error:
            emit("eleven_voices", voices=[], error=str(error))

    def _apply_voice_settings(self) -> None:
        use_elevenlabs = self.settings["voice_provider"] == "elevenlabs"
        self.speaker.voice_id = self.settings["voice"]
        self.speaker.speed = self.settings["speed"]
        self.speaker.eleven_api_key = self.settings["eleven_api_key"] if use_elevenlabs else ""
        self.speaker.eleven_voice_id = self.settings["eleven_voice_id"] if use_elevenlabs else ""

    def _cmd_preview_voice(self, command: dict) -> None:
        if not self.speaker:
            return
        self.speaker.stop()
        if command.get("provider") == "elevenlabs":
            self.speaker.eleven_api_key = self.settings["eleven_api_key"]
            self.speaker.eleven_voice_id = command.get("voice", "")
        else:
            self.speaker.eleven_api_key = ""
            self.speaker.voice_id = command.get("voice", self.speaker.voice_id)
        self.speaker.say(PREVIEW_SENTENCE)
        threading.Thread(target=self._restore_voice_after_preview, daemon=True).start()

    def _restore_voice_after_preview(self) -> None:
        time.sleep(0.3)
        while self.speaker.is_speaking:
            time.sleep(0.1)
        self._apply_voice_settings()

    def _cmd_config(self, command: dict) -> None:
        changes = {key: value for key, value in command.items() if key in DEFAULT_SETTINGS}
        needs_new_transcriber = self.is_ready and (
            changes.get("whisper_model", self.settings["whisper_model"]) != self.settings["whisper_model"]
            or changes.get("language", self.settings["language"]) != self.settings["language"]
        )
        previous_model = self.settings["whisper_model"]
        self.settings.update(changes)
        if self.speaker:
            self._apply_voice_settings()
        if self.microphone:
            self.microphone.hotkey = self.settings["hotkey"]
            try:
                self.microphone.use_device(self.settings["mic_index"])
            except Exception as error:
                emit("error", kind="mic_missing", message=str(error))
        if needs_new_transcriber:
            threading.Thread(target=self._reload_transcriber, args=(previous_model,), daemon=True).start()

    def _reload_transcriber(self, previous_model: str) -> None:
        emit("loading", stage="loading hearing", progress=0.05)
        try:
            self._download_whisper()
            self._load_transcriber()
        except Exception as error:
            self.settings["whisper_model"] = previous_model
            emit("error", kind="model_failed", model=previous_model, message=str(error))
        emit("ready", device=self.device)

    def _download_whisper(self) -> None:
        info = downloads.whisper_model_info(self.settings["whisper_model"])
        if downloads.is_downloaded(info):
            return

        def report(fraction):
            emit("download", model="whisper", progress=round(fraction, 3))
            emit("loading", stage="downloading hearing", progress=round(0.05 + 0.8 * fraction, 3))

        os.environ.pop("HF_HUB_OFFLINE", None)
        try:
            downloads.download(info, report)
        finally:
            self._mark_models_offline()

    def _load_transcriber(self) -> None:
        from koe.engine.transcriber import Transcriber

        emit("loading", stage="loading hearing", progress=0.9)
        self.transcriber = Transcriber(self.settings["whisper_model"], self.settings["language"], self.device)

    def _cmd_retry_mic(self, command: dict) -> None:
        try:
            if self.microphone:
                self.microphone.stream = None
                self.microphone.use_device(self.settings["mic_index"])
            emit("mic_ok")
        except Exception as error:
            emit("error", kind="mic_missing", message=str(error))

    def _cmd_quit(self, command: dict) -> None:
        os._exit(0)
