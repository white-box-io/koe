import queue
import threading
import time
from typing import Callable

import numpy as np
import sounddevice as sd
from kokoro import KPipeline

KOKORO_SAMPLE_RATE = 24000
LEVEL_WINDOW_SAMPLES = 1200
LEVEL_BOOST = 5.0


class Speaker:
    def __init__(
        self,
        voice_name: str,
        voice_speed: float,
        on_speaking_changed: Callable[[bool], None],
    ):
        self.voice_name = voice_name
        self.voice_speed = voice_speed
        self.on_speaking_changed = on_speaking_changed
        self.pipeline = KPipeline(lang_code="a", device="cuda")
        self.pending_texts: queue.Queue[str] = queue.Queue()
        self.playing_audio = np.zeros(0, dtype=np.float32)
        self.playing_since = 0.0
        self.stop_count = 0

    def start(self) -> None:
        threading.Thread(target=self._speak_loop, daemon=True).start()

    def say(self, text: str) -> None:
        if text:
            self.pending_texts.put(text)

    def stop(self) -> None:
        self.stop_count += 1
        while not self.pending_texts.empty():
            self.pending_texts.get_nowait()
        sd.stop()

    def current_level(self) -> float:
        position = int((time.monotonic() - self.playing_since) * KOKORO_SAMPLE_RATE)
        window = self.playing_audio[position : position + LEVEL_WINDOW_SAMPLES]
        if len(window) == 0:
            return 0.0
        return float(np.sqrt(np.mean(window**2))) * LEVEL_BOOST

    def _speak_loop(self) -> None:
        while True:
            text = self.pending_texts.get()
            self.on_speaking_changed(True)
            self._speak(text)
            if self.pending_texts.empty():
                self.on_speaking_changed(False)

    def _speak(self, text: str) -> None:
        stop_count_at_start = self.stop_count
        voice_parts = self.pipeline(text, voice=self.voice_name, speed=self.voice_speed)
        for _, _, audio in voice_parts:
            if self.stop_count != stop_count_at_start:
                break
            self.playing_audio = np.asarray(audio, dtype=np.float32)
            self.playing_since = time.monotonic()
            sd.play(self.playing_audio, KOKORO_SAMPLE_RATE)
            sd.wait()
        self.playing_audio = np.zeros(0, dtype=np.float32)
