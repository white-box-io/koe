"""Remembers the last window that isn't Koe, so speech is always typed into Claude Code.

Clicking a Koe panel gives Koe keyboard focus. Without this, the next voice
message would be pasted into Koe instead of the Claude Code input.
"""

import ctypes
import threading
import time

KOE_WINDOW_TITLE = "Koe"
VK_MENU = 0x12
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32
_last_target = 0


def _window_title(hwnd: int) -> str:
    buffer = ctypes.create_unicode_buffer(256)
    user32.GetWindowTextW(hwnd, buffer, 256)
    return buffer.value


def _track_foreground() -> None:
    global _last_target
    while True:
        hwnd = user32.GetForegroundWindow()
        if hwnd and _window_title(hwnd) != KOE_WINDOW_TITLE:
            _last_target = hwnd
        time.sleep(0.15)


def start_tracking() -> None:
    threading.Thread(target=_track_foreground, daemon=True).start()


def focus_claude_window() -> None:
    hwnd = user32.GetForegroundWindow()
    if _window_title(hwnd) != KOE_WINDOW_TITLE or not _last_target:
        return
    user32.keybd_event(VK_MENU, 0, 0, 0)
    user32.SetForegroundWindow(_last_target)
    user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.08)
