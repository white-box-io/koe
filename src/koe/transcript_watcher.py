import json
import threading
import time
from pathlib import Path
from typing import Callable

POLL_SECONDS = 0.2


def find_newest_transcript(projects_dir: Path) -> Path | None:
    transcripts = list(projects_dir.glob("*/*.jsonl"))
    return max(transcripts, key=lambda path: path.stat().st_mtime, default=None)


def assistant_texts(line: str) -> list[str]:
    try:
        entry = json.loads(line)
    except json.JSONDecodeError:
        return []
    if entry.get("type") != "assistant" or entry.get("isSidechain"):
        return []
    content = entry.get("message", {}).get("content", [])
    return [block["text"] for block in content if block.get("type") == "text"]


class TranscriptWatcher:
    """Speaks what Claude writes, by tailing the live Claude Code session file."""

    def __init__(self, projects_dir: str, on_reply_text: Callable[[str], None]):
        self.projects_dir = Path(projects_dir).expanduser()
        self.on_reply_text = on_reply_text

    def start(self) -> None:
        threading.Thread(target=self._watch_loop, daemon=True).start()

    def _watch_loop(self) -> None:
        current_file = None
        read_position = 0
        unfinished_line = ""

        while True:
            newest_file = find_newest_transcript(self.projects_dir)
            if newest_file and newest_file != current_file:
                current_file = newest_file
                read_position = newest_file.stat().st_size
                unfinished_line = ""

            if current_file:
                with current_file.open("r", encoding="utf-8") as transcript:
                    transcript.seek(read_position)
                    new_text = unfinished_line + transcript.read()
                    read_position = transcript.tell()

                *complete_lines, unfinished_line = new_text.split("\n")
                for line in complete_lines:
                    for reply_text in assistant_texts(line):
                        self.on_reply_text(reply_text)

            time.sleep(POLL_SECONDS)
