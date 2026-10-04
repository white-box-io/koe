"""ElevenLabs voice, used only when the user pastes their own API key."""

import json
import urllib.request

import numpy as np

API = "https://api.elevenlabs.io/v1"
SAMPLE_RATE = 24000
MODEL = "eleven_flash_v2_5"


def _request(path: str, api_key: str, body: dict | None = None) -> bytes:
    request = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode() if body else None,
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read()


def list_voices(api_key: str) -> list[dict]:
    voices = json.loads(_request("/voices", api_key))["voices"]
    return [
        {
            "id": voice["voice_id"],
            "name": voice["name"],
            "gender": (voice.get("labels") or {}).get("gender", ""),
            "accent": (voice.get("labels") or {}).get("accent", ""),
        }
        for voice in voices
    ]


def natural_settings(speed: float) -> dict:
    """ElevenLabs' advice for a natural voice: medium stability, high similarity, no style."""
    return {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0,
        "use_speaker_boost": False,
        "speed": max(0.7, min(speed, 1.2)),
    }


def synthesize(text: str, voice_id: str, api_key: str, speed: float) -> np.ndarray:
    body = {"text": text, "model_id": MODEL, "voice_settings": natural_settings(speed)}
    pcm = _request(f"/text-to-speech/{voice_id}?output_format=pcm_{SAMPLE_RATE}", api_key, body)
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
