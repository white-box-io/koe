"""JSON lines over stdin/stdout between the Tauri app and this engine.

Model libraries print to stdout, so the real stdout is kept for the protocol
and everything else is redirected to stderr.
"""

import json
import sys
import threading
from typing import Callable

_protocol_out = sys.stdout
_write_lock = threading.Lock()


def take_over_stdout() -> None:
    sys.stdout = sys.stderr


def emit(event: str, **fields) -> None:
    line = json.dumps({"event": event, **fields})
    with _write_lock:
        _protocol_out.write(line + "\n")
        _protocol_out.flush()


def listen_for_commands(on_command: Callable[[dict], None]) -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            on_command(json.loads(line))
        except Exception as error:
            emit("log", message=f"command failed: {error}")
