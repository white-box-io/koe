import numpy as np

from koe.engine import downloads

WHISTLE = "whistle"
WHISTLE_MAX_SAMPLES = 30 * 16000
WHISTLE_KEYWORDS = ["Claude", "Claude Code"]


class WhisperTranscriber:
    def __init__(self, model_name: str, language: str, device: str):
        from faster_whisper import WhisperModel

        self.language = language
        self.model = WhisperModel(model_name, device=device, compute_type="int8")

    def transcribe(self, audio: np.ndarray) -> str:
        segments, _ = self.model.transcribe(audio, language=self.language, beam_size=1)
        return " ".join(segment.text.strip() for segment in segments).strip()


class WhistleTranscriber:
    def __init__(self, language: str):
        import needle

        self.language = language
        self.model = needle.Whistle(weights=downloads.local_path(downloads.MODELS[WHISTLE]))

    def transcribe(self, audio: np.ndarray) -> str:
        pieces = [audio[start:start + WHISTLE_MAX_SAMPLES] for start in range(0, len(audio), WHISTLE_MAX_SAMPLES)]
        texts = [self._transcribe_piece(piece) for piece in pieces]
        return " ".join(text for text in texts if text)

    def _transcribe_piece(self, piece: np.ndarray) -> str:
        result = self.model.transcribe(piece.astype(np.float32), language=self.language, keywords=WHISTLE_KEYWORDS)
        return result["text"].strip()


def Transcriber(model_name: str, language: str, device: str):
    if model_name == WHISTLE:
        return WhistleTranscriber(language)
    return WhisperTranscriber(model_name, language, device)
