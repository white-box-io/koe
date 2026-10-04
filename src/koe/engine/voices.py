VOICES = [
    {"id": "af_heart", "name": "Heart", "style": "Warm", "accent": "US", "gender": "female"},
    {"id": "af_bella", "name": "Bella", "style": "Playful", "accent": "US", "gender": "female"},
    {"id": "af_nicole", "name": "Nicole", "style": "Soft", "accent": "US", "gender": "female"},
    {"id": "af_sky", "name": "Sky", "style": "Airy", "accent": "US", "gender": "female"},
    {"id": "af_nova", "name": "Nova", "style": "Clear", "accent": "US", "gender": "female"},
    {"id": "af_sarah", "name": "Sarah", "style": "Gentle", "accent": "US", "gender": "female"},
    {"id": "bf_emma", "name": "Emma", "style": "Calm", "accent": "UK", "gender": "female"},
    {"id": "bf_isabella", "name": "Isabella", "style": "Elegant", "accent": "UK", "gender": "female"},
    {"id": "am_michael", "name": "Michael", "style": "Deep", "accent": "US", "gender": "male"},
    {"id": "am_adam", "name": "Adam", "style": "Friendly", "accent": "US", "gender": "male"},
    {"id": "bm_george", "name": "George", "style": "Steady", "accent": "UK", "gender": "male"},
    {"id": "bm_lewis", "name": "Lewis", "style": "Bright", "accent": "UK", "gender": "male"},
]

PREVIEW_SENTENCE = (
    "Okay, I've finished the changes. Two files were updated, and everything builds fine. "
    "Want me to run the tests, or should we take a quick break first?"
)


def language_code_for(voice_id: str) -> str:
    """Kokoro voice ids start with a for American English and b for British."""
    return voice_id[0]
