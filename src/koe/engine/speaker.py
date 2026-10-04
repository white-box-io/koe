import queue
import re
import threading
import time
from typing import Callable

import numpy as np
import sounddevice as sd
from kokoro import KPipeline

from koe.engine import elevenlabs
from koe.engine.voices import language_code_for

KOKORO_SAMPLE_RATE = 24000
LEVEL_WINDOW_SAMPLES = 1200
LEVEL_BOOST = 5.0
SENTENCE_BREAK = r"\n+|(?<=[.!?])\s+"


class Speaker:
    def __init__(
        self,
        device: str,
        on_speaking_changed: Callable[[bool], None],
        on_sentence: Callable[[str, float], None],
    ):
        self.device = device
        self.on_speaking_changed = on_speaking_changed
        self.on_sentence = on_sentence
        self.voice_id = "af_heart"
        self.speed = 1.1
        self.eleven_api_key = ""
        self.eleven_voice_id = ""
        self.on_voice_error: Callable[[str], None] = lambda message: None
        self.pipelines: dict[str, KPipeline] = {}
        self.pending_texts: queue.Queue[str] = queue.Queue()
        self.playing_audio = np.zeros(0, dtype=np.float32)
        self.playing_since = 0.0
        self.stop_count = 0
        self.is_speaking = False
        self._pipeline_for(self.voice_id)

    def _pipeline_for(self, voice_id: str) -> KPipeline:
        language = language_code_for(voice_id)
        if language not in self.pipelines:
            self.pipelines[language] = KPipeline(lang_code=language, device=self.device, repo_id="hexgrad/Kokoro-82M")
        return self.pipelines[language]

    def start(self) -> None:
        threading.Thread(target=self._speak_loop, daemon=True).start()

    def say(self, text: str) -> None:
        if text:
            self.pending_texts.put(text)

    def stop(self) -> bool:
        was_speaking = self.is_speaking or not self.pending_texts.empty()
        self.stop_count += 1
        while not self.pending_texts.empty():
            self.pending_texts.get_nowait()
        sd.stop()
        return was_speaking

    def current_level(self) -> float:
        position = int((time.monotonic() - self.playing_since) * KOKORO_SAMPLE_RATE)
        window = self.playing_audio[position : position + LEVEL_WINDOW_SAMPLES]
        if len(window) == 0:
            return 0.0
        return min(float(np.sqrt(np.mean(window**2))) * LEVEL_BOOST, 1.0)

    def _speak_loop(self) -> None:
        while True:
            text = self.pending_texts.get()
            self._set_speaking(True)
            try:
                self._speak(text)
            except Exception as error:
                print(f"speak failed: {error}")
            if self.pending_texts.empty():
                self._set_speaking(False)

    def _set_speaking(self, is_speaking: bool) -> None:
        if is_speaking != self.is_speaking:
            self.is_speaking = is_speaking
            self.on_speaking_changed(is_speaking)

    def _speak(self, text: str) -> None:
        stop_count_at_start = self.stop_count
        for sentence, audio in self._sentences_with_audio(text):
            if self.stop_count != stop_count_at_start:
                break
            self.playing_audio = np.asarray(audio, dtype=np.float32)
            self.on_sentence(sentence, len(self.playing_audio) / KOKORO_SAMPLE_RATE)
            self.playing_since = time.monotonic()
            sd.play(self.playing_audio, KOKORO_SAMPLE_RATE)
            sd.wait()
        self.playing_audio = np.zeros(0, dtype=np.float32)

    def _sentences_with_audio(self, text: str):
        if self.eleven_api_key and self.eleven_voice_id:
            try:
                yield from self._elevenlabs_sentences(text)
                return
            except Exception as error:
                self.on_voice_error(str(error))
        pipeline = self._pipeline_for(self.voice_id)
        for sentence, _, audio in pipeline(text, voice=self.voice_id, speed=self.speed, split_pattern=SENTENCE_BREAK):
            yield sentence, audio

    def _elevenlabs_sentences(self, text: str):
        sentences = [part.strip() for part in re.split(SENTENCE_BREAK, text) if part.strip()]
        for sentence in sentences:
            yield sentence, elevenlabs.synthesize(sentence, self.eleven_voice_id, self.eleven_api_key, self.speed)
