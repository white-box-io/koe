import re

CODE_BLOCK = re.compile(r"```.*?```", re.DOTALL)
MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
INLINE_CODE = re.compile(r"`([^`]+)`")
FORMATTING_MARKS = re.compile(r"[*_#>|]")
LIST_BULLET = re.compile(r"^\s*(?:[-+]|\d+\.)\s+", re.MULTILINE)


def to_spoken_text(markdown: str) -> str:
    text = CODE_BLOCK.sub(" I've put the code on screen. ", markdown)
    text = MARKDOWN_LINK.sub(r"\1", text)
    text = INLINE_CODE.sub(r"\1", text)
    text = LIST_BULLET.sub("", text)
    text = FORMATTING_MARKS.sub("", text)
    return " ".join(text.split())
