import numpy as np
from faster_whisper import WhisperModel


class Transcriber:
    def __init__(self, model_name: str, language: str):
        self.language = language
        self.model = WhisperModel(model_name, device="cuda", compute_type="int8")

    def transcribe(self, audio: np.ndarray) -> str:
        segments, _ = self.model.transcribe(audio, language=self.language, beam_size=1)
        return " ".join(segment.text.strip() for segment in segments).strip()
