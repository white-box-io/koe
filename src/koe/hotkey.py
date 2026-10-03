import ctypes

VIRTUAL_KEY_CODES = {
    "right ctrl": 0xA3,
    "left ctrl": 0xA2,
    "right alt": 0xA5,
    "right shift": 0xA1,
    "f9": 0x78,
}


def is_key_held(key_name: str) -> bool:
    """Reads the exact key, so right ctrl never fires on left ctrl."""
    virtual_key = VIRTUAL_KEY_CODES[key_name]
    return bool(ctypes.windll.user32.GetAsyncKeyState(virtual_key) & 0x8000)
