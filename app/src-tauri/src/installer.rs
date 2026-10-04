//! First-run setup of the Python voice engine with uv, for the downloadable release.

use serde_json::json;
use std::io::{BufRead, BufReader};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn exe_folder() -> Option<PathBuf> {
    std::env::current_exe().ok()?.parent().map(Path::to_path_buf)
}

/// The folder with pyproject.toml: next to koe.exe in a release, the repo root in development.
pub fn engine_root() -> PathBuf {
    if let Ok(path) = std::env::var("KOE_PROJECT") {
        return PathBuf::from(path);
    }
    if let Some(bundled) = exe_folder().map(|folder| folder.join("engine")) {
        if bundled.join("pyproject.toml").exists() {
            return bundled;
        }
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("..")
}

pub fn python_path(root: &Path) -> PathBuf {
    root.join(".venv").join("Scripts").join("python.exe")
}

fn uv_path() -> PathBuf {
    exe_folder()
        .map(|folder| folder.join("uv.exe"))
        .filter(|path| path.exists())
        .unwrap_or_else(|| PathBuf::from("uv"))
}

/// Runs `uv sync` and reports progress. Downloads Python and PyTorch the first time (~3 GB).
pub fn install(app: &AppHandle, root: &Path) -> Result<(), String> {
    report(app, "Installing voice engine", 0.01);
    let mut child = Command::new(uv_path())
        .args(["sync", "--frozen", "--no-dev"])
        .current_dir(root)
        .env("UV_PYTHON_PREFERENCE", "only-managed")
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|error| format!("Couldn't run uv: {error}"))?;

    let mut announced = 0u32;
    let mut finished = 0u32;
    if let Some(stderr) = child.stderr.take() {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            let line = line.trim();
            if line.starts_with("Downloading") {
                announced += 1;
            }
            if line.starts_with("Downloaded") {
                finished += 1;
            }
            let progress = if announced == 0 { 0.02 } else { 0.02 + 0.9 * finished as f64 / announced as f64 };
            report(app, &format!("Installing voice engine · {line}"), progress);
        }
    }

    let status = child.wait().map_err(|error| error.to_string())?;
    if status.success() {
        report(app, "Voice engine installed", 1.0);
        Ok(())
    } else {
        Err("Installing the voice engine failed. Check your internet connection and try again.".into())
    }
}

fn report(app: &AppHandle, stage: &str, progress: f64) {
    let _ = app.emit("engine", json!({ "event": "install", "stage": stage, "progress": progress }));
    let _ = app.emit("engine", json!({ "event": "loading", "stage": "installing voice engine", "progress": progress * 0.05 }));
}
