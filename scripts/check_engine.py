"""Starts the voice engine silently and checks it boots and answers commands."""

import json
import subprocess
import sys
import threading
import time
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
PYTHON = PROJECT / ".venv" / "Scripts" / "python.exe"
QUIET_SETTINGS = json.dumps({"type_into_claude": False, "hotkey": "f10"})


def main() -> None:
    engine = subprocess.Popen(
        [str(PYTHON), "-m", "koe.engine", QUIET_SETTINGS],
        cwd=PROJECT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        encoding="utf-8",
    )
    events: list[dict] = []
    started = time.monotonic()

    def read_events():
        for line in engine.stdout:
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                print("NOT JSON:", line.strip()[:120])
                continue
            events.append(event)
            if event["event"] != "level":
                print(f"{time.monotonic() - started:6.1f}s", event)

    threading.Thread(target=read_events, daemon=True).start()

    def send(command: dict) -> None:
        engine.stdin.write(json.dumps(command) + "\n")
        engine.stdin.flush()

    while not any(e["event"] in ("ready", "error") for e in events) and time.monotonic() - started < 240:
        time.sleep(0.2)
    send({"cmd": "list_devices"})
    send({"cmd": "list_voices"})
    send({"cmd": "config", "speed": 1.2})
    time.sleep(2)
    send({"cmd": "quit"})
    engine.wait(timeout=10)
    names = [e["event"] for e in events]
    ok = "ready" in names and "devices" in names and "voices" in names
    print("RESULT:", "PASS" if ok else "FAIL", sorted(set(names)))
    sys.exit(0 if ok else 1)


main()
