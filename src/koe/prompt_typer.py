import threading
import time

import keyboard
import pyperclip

CLIPBOARD_READY_TIMEOUT = 1.0
RESTORE_AFTER_SECONDS = 2.0


def type_into_focused_window(text: str) -> None:
    """Pastes the text into the focused Claude Code input and sends it."""
    previous_clipboard = pyperclip.paste()
    pyperclip.copy(text)
    _wait_until_clipboard_holds(text)
    keyboard.send("ctrl+v")
    time.sleep(0.25)
    keyboard.send("enter")
    threading.Timer(RESTORE_AFTER_SECONDS, _restore_clipboard, args=(text, previous_clipboard)).start()


def _wait_until_clipboard_holds(text: str) -> None:
    deadline = time.monotonic() + CLIPBOARD_READY_TIMEOUT
    while pyperclip.paste() != text and time.monotonic() < deadline:
        time.sleep(0.02)


def _restore_clipboard(pasted_text: str, previous_clipboard: str) -> None:
    """Puts the old clipboard back, unless the user copied something new meanwhile."""
    if pyperclip.paste() == pasted_text:
        pyperclip.copy(previous_clipboard)
