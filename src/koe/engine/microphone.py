import threading
import time
from typing import Callable

import numpy as np
import sounddevice as sd

from koe.hotkey import is_key_held

SAMPLE_RATE = 16000
KEY_POLL_SECONDS = 0.02
LEVEL_BOOST = 8.0
CANCEL_KEY = "right shift"


def list_input_devices() -> list[dict]:
    devices = []
    default_index = sd.default.device[0]
    host_apis = sd.query_hostapis()
    for index, device in enumerate(sd.query_devices()):
        is_mme = host_apis[device["hostapi"]]["name"] == "MME"
        is_mapper = "Sound Mapper" in device["name"]
        if device["max_input_channels"] > 0 and is_mme and not is_mapper:
            devices.append({"index": index, "name": device["name"], "default": index == default_index})
    return devices


class Microphone:
    """Push to talk: records only while the hotkey is held down."""

    def __init__(
        self,
        on_press: Callable[[], None],
        on_release: Callable[[np.ndarray, float], None],
        on_level: Callable[[float], None],
        on_cancel: Callable[[], None],
    ):
        self.on_cancel = on_cancel
        self.on_press = on_press
        self.on_release = on_release
        self.on_level = on_level
        self.hotkey = "right ctrl"
        self.device_index: int | None = None
        self.recorded_chunks: list[np.ndarray] = []
        self.is_recording = False
        self.is_paused = False
        self.is_testing = False
        self.pressed_at = 0.0
        self.stream = None

    def start(self) -> None:
        self._open_stream()
        threading.Thread(target=self._hotkey_loop, daemon=True).start()

    def use_device(self, device_index: int | None) -> None:
        if device_index == self.device_index and self.stream:
            return
        self.device_index = device_index
        self._open_stream()

    def _open_stream(self) -> None:
        if self.stream:
            self.stream.close()
        self.stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
            device=self.device_index,
            callback=self._capture_chunk,
        )
        self.stream.start()

    def _capture_chunk(self, indata, frames, time_info, status) -> None:
        chunk = indata[:, 0].copy()
        if self.is_recording:
            self.recorded_chunks.append(chunk)
        if self.is_recording or self.is_testing:
            self.on_level(min(float(np.sqrt(np.mean(chunk**2))) * LEVEL_BOOST, 1.0))

    def _hotkey_loop(self) -> None:
        waiting_for_release = False
        while True:
            is_held = not self.is_paused and is_key_held(self.hotkey)
            if waiting_for_release:
                waiting_for_release = is_held
            elif is_held and not self.is_recording:
                self._begin_recording()
            elif is_held and is_key_held(CANCEL_KEY) and self.hotkey != CANCEL_KEY:
                self._cancel_recording()
                waiting_for_release = True
            elif not is_held and self.is_recording:
                self._finish_recording()
            time.sleep(KEY_POLL_SECONDS)

    def _cancel_recording(self) -> None:
        self.is_recording = False
        self.recorded_chunks = []
        self.on_cancel()

    def _begin_recording(self) -> None:
        self.recorded_chunks = []
        self.pressed_at = time.monotonic()
        self.is_recording = True
        self.on_press()

    def _finish_recording(self) -> None:
        self.is_recording = False
        held_seconds = time.monotonic() - self.pressed_at
        audio = np.concatenate(self.recorded_chunks) if self.recorded_chunks else np.zeros(0, dtype=np.float32)
        threading.Thread(target=self.on_release, args=(audio, held_seconds), daemon=True).start()
