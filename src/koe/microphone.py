import threading
import time
from typing import Callable

import numpy as np
import sounddevice as sd

from koe.hotkey import is_key_held as is_hotkey_held

SAMPLE_RATE = 16000
MIN_SPEECH_SECONDS = 0.4
KEY_POLL_SECONDS = 0.02
LEVEL_BOOST = 8.0


class Microphone:
    """Push to talk: records only while the hotkey is held down."""

    def __init__(
        self,
        hotkey: str,
        on_recording_changed: Callable[[bool], None],
        on_utterance: Callable[[np.ndarray], None],
    ):
        self.hotkey = hotkey
        self.on_recording_changed = on_recording_changed
        self.on_utterance = on_utterance
        self.recorded_chunks: list[np.ndarray] = []
        self.is_recording = False
        self.is_enabled = True
        self.level = 0.0

    def start(self) -> None:
        self.stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
            callback=self._capture_chunk,
        )
        self.stream.start()
        threading.Thread(target=self._hotkey_loop, daemon=True).start()

    def _capture_chunk(self, indata, frames, time_info, status) -> None:
        if self.is_recording:
            chunk = indata[:, 0].copy()
            self.recorded_chunks.append(chunk)
            self.level = float(np.sqrt(np.mean(chunk**2))) * LEVEL_BOOST

    def _hotkey_loop(self) -> None:
        while True:
            is_key_held = self.is_enabled and is_hotkey_held(self.hotkey)
            if is_key_held and not self.is_recording:
                self._begin_recording()
            elif not is_key_held and self.is_recording:
                self._finish_recording()
            time.sleep(KEY_POLL_SECONDS)

    def _begin_recording(self) -> None:
        self.recorded_chunks = []
        self.is_recording = True
        self.on_recording_changed(True)

    def _finish_recording(self) -> None:
        self.is_recording = False
        self.on_recording_changed(False)
        if not self.recorded_chunks:
            return
        audio = np.concatenate(self.recorded_chunks)
        if len(audio) / SAMPLE_RATE >= MIN_SPEECH_SECONDS:
            threading.Thread(target=self.on_utterance, args=(audio,), daemon=True).start()
