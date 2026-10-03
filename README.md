# Koe

Talk to Claude Code on Windows. Hold a key, speak, and hear Claude talk back, inside the
session you already have open. A small floating buddy shows what Claude is doing and which
files it touches.

## What it does

- **Push to talk.** Hold Right Ctrl (or another key), speak, let go. Your words are typed
  into the focused Claude Code input.
- **Claude speaks back.** Replies are read aloud as they arrive. Tap the key to stop.
- **File activity.** See the file Claude is reading or editing right now, and a summary of
  every changed file when it finishes. Click a file to open it in VS Code.
- **Live subtitles, task-done alerts, session picker, voice picker.**

Everything runs locally: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) for
hearing and [Kokoro](https://github.com/hexgrad/kokoro) for the voice, on your NVIDIA GPU
when available.

## Requirements

- Windows 10 or 11
- An NVIDIA GPU with 4 GB of VRAM is recommended (CPU works, but slower)
- [uv](https://docs.astral.sh/uv/), [Node 20+](https://nodejs.org/), and
  [Rust](https://rustup.rs/) with the Visual Studio C++ build tools
- [Claude Code](https://claude.com/claude-code)

## Setup

```bash
uv sync                       # voice engine (downloads PyTorch with CUDA, ~3 GB)
cd app
npm install
npx tauri build --no-bundle   # builds app/src-tauri/target/release/koe.exe
```

Run `koe.exe`. The first launch walks you through the microphone, talk key and voice, then
downloads the models (~800 MB, once).

To start Koe with Windows, enable it in Settings, or run `scripts/install-autostart.ps1`.

## Develop

```bash
cd app
npx tauri dev                 # hot-reloading app
npx vite build -c vite.preview.config.ts   # static gallery of every screen
```

## How it works

| Part | Where | Job |
|---|---|---|
| Voice engine | `src/koe/engine` (Python) | Mic, talk key, Whisper, Kokoro. JSON lines over stdin/stdout. |
| App core | `app/src-tauri` (Rust) | Runs the engine, follows the Claude Code session file, settings, opening files. |
| UI | `app/src` (React + GSAP) | The floating buddy and its panels. |

Koe reads Claude Code's own session files in `~/.claude/projects`. It never sends anything
anywhere.
