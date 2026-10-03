import os
import sys
import threading
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PySide6.QtWidgets import QApplication

from koe.cuda_paths import add_torch_cuda_dlls
from koe.model_cache import use_cached_models_offline
from koe.prompt_typer import type_into_focused_window
from koe.settings import load_settings
from koe.spoken_text import to_spoken_text
from koe.transcript_watcher import TranscriptWatcher
from koe.ui.companion_window import CompanionWindow

KEEP_ANIMATING_FLAGS = " ".join([
    "--disable-features=CalculateNativeWinOcclusion",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
])


class Koe:
    def __init__(self):
        self.settings = load_settings()
        self.microphone = None
        self.speaker = None
        self.is_ready = False
        self.is_waiting_for_reply = False
        self.loading_progress = 0.0

    def start(self) -> None:
        os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = KEEP_ANIMATING_FLAGS
        application = QApplication(sys.argv)
        window = CompanionWindow(
            self.read_status, self.toggle_listening, self.stop_speaking, self.quit
        )
        window.show()
        threading.Thread(target=self._boot, daemon=True).start()
        application.exec()

    def _boot(self) -> None:
        self.loading_progress = 0.05
        use_cached_models_offline()
        add_torch_cuda_dlls()
        self.loading_progress = 0.2
        from koe.microphone import Microphone
        from koe.speaker import Speaker
        from koe.transcriber import Transcriber

        self.loading_progress = 0.4
        with ThreadPoolExecutor() as loader:
            loading_transcriber = loader.submit(
                Transcriber, self.settings.whisper_model, self.settings.language
            )
            loading_speaker = loader.submit(
                Speaker, self.settings.voice_name, self.settings.voice_speed, lambda _: None
            )
            self.speaker = loading_speaker.result()
            self.loading_progress = 0.75
            self.transcriber = loading_transcriber.result()
        self.loading_progress = 0.95
        self.microphone = Microphone(
            self.settings.push_to_talk_key, self._on_recording_changed, self._on_utterance
        )
        self.watcher = TranscriptWatcher(self.settings.projects_dir, self._on_reply_text)

        self.speaker.start()
        self.watcher.start()
        self.microphone.start()
        self.is_ready = True
        self.speaker.say("Hey, I'm here.")

    def read_status(self) -> tuple[str, float]:
        if not self.is_ready:
            return "loading", self.loading_progress
        if not self.microphone.is_enabled:
            return "paused", 0.0
        if self.microphone.is_recording:
            return "recording", self.microphone.level
        speaking_level = self.speaker.current_level()
        if speaking_level > 0:
            return "speaking", speaking_level
        if self.is_waiting_for_reply:
            return "thinking", 0.0
        return "ready", 0.0

    def _on_recording_changed(self, is_recording: bool) -> None:
        if is_recording:
            self.speaker.stop()

    def _on_utterance(self, audio: np.ndarray) -> None:
        user_text = self.transcriber.transcribe(audio)
        if user_text:
            self.is_waiting_for_reply = True
            type_into_focused_window(user_text)

    def _on_reply_text(self, reply_text: str) -> None:
        self.is_waiting_for_reply = False
        self.speaker.say(to_spoken_text(reply_text))

    def toggle_listening(self) -> None:
        if self.microphone:
            self.microphone.is_enabled = not self.microphone.is_enabled

    def stop_speaking(self) -> None:
        if self.speaker:
            self.speaker.stop()

    def quit(self) -> None:
        os._exit(0)


def main() -> None:
    Koe().start()


if __name__ == "__main__":
    main()
