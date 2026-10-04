# Contributing to Koe

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an issue with:

- What you did, what you expected, and what happened.
- Windows version, GPU, and the Whisper model you use.
- The last lines of `%APPDATA%\koe\engine.log` and `%APPDATA%\koe\ui.log`.

## Setting up

Follow [Develop](README.md#develop) in the README. In short:

```powershell
uv sync
cd app
npm install
npx tauri dev
```

## Before you open a pull request

Run the checks:

```powershell
cd app
npx tsc --noEmit
npx vite build -c vite.preview.config.ts
cd src-tauri
cargo test
cd ../..
uv run python scripts/check_engine.py
```

If you changed the UI, open `app/dist-preview/preview.html` and check the screens you
touched, in both the widget and the panels.

## Code style

- Keep code simple to read and change: small plain functions, descriptive names.
- As few comments as possible. Names should explain the code.
- One small CSS file per component. No giant files.
- Icons come from [Lucide](https://lucide.dev/). No emoji or unicode glyph icons.
- The Python engine talks to the app only through JSON lines (`protocol.py`). Everything
  it prints that is not protocol goes to stderr.

## Scope

Koe is a voice companion for Claude Code on Windows. It stays inside the user's own
Claude Code session; it never runs a second agent. Features that fit that idea are
welcome. Please open an issue first for anything big, so we can agree on the approach.
