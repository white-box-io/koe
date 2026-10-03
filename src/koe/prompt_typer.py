import time

import keyboard
import pyperclip


def type_into_focused_window(text: str) -> None:
    """Pastes the text into the focused Claude Code input and sends it."""
    previous_clipboard = pyperclip.paste()
    pyperclip.copy(text)
    keyboard.send("ctrl+v")
    time.sleep(0.1)
    keyboard.send("enter")
    time.sleep(0.1)
    pyperclip.copy(previous_clipboard)
