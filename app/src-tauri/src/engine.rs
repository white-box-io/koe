use serde_json::{json, Value};
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// The koe project folder that holds the Python voice engine and its .venv.
pub fn project_root() -> PathBuf {
    if let Ok(path) = std::env::var("KOE_PROJECT") {
        return PathBuf::from(path);
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("..")
}

/// The Python voice engine runs as a hidden child process and talks JSON lines.
pub struct Engine {
    stdin: Mutex<Option<ChildStdin>>,
    child: Mutex<Option<Child>>,
    stopping: Arc<AtomicBool>,
}

impl Engine {
    pub fn new() -> Self {
        Self { stdin: Mutex::new(None), child: Mutex::new(None), stopping: Arc::new(AtomicBool::new(false)) }
    }

    pub fn start(&self, app: AppHandle, config: Value) {
        self.stopping.store(false, Ordering::SeqCst);
        let root = project_root();
        let python = root.join(".venv").join("Scripts").join("python.exe");
        let spawned = Command::new(python)
            .args(["-m", "koe.engine", &config.to_string()])
            .current_dir(&root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(open_log().map(Stdio::from).unwrap_or_else(|_| Stdio::null()))
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();

        let mut child = match spawned {
            Ok(child) => child,
            Err(error) => {
                report_crash(&app, &format!("Couldn't start the voice engine: {error}"));
                return;
            }
        };

        let stdout = child.stdout.take().expect("engine stdout");
        *self.stdin.lock().unwrap() = child.stdin.take();
        *self.child.lock().unwrap() = Some(child);

        let stopping = self.stopping.clone();
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                if let Ok(event) = serde_json::from_str::<Value>(&line) {
                    let _ = app.emit("engine", event);
                }
            }
            if !stopping.load(Ordering::SeqCst) {
                let reason = last_log_line().unwrap_or_else(|| "The voice engine stopped unexpectedly.".into());
                report_crash(&app, &reason);
            }
        });
    }

    pub fn send(&self, command: Value) {
        if let Some(stdin) = self.stdin.lock().unwrap().as_mut() {
            let _ = writeln!(stdin, "{}", command);
            let _ = stdin.flush();
        }
    }

    pub fn stop(&self) {
        self.stopping.store(true, Ordering::SeqCst);
        self.send(json!({ "cmd": "quit" }));
        *self.stdin.lock().unwrap() = None;
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    pub fn restart(&self, app: AppHandle, config: Value) {
        self.stop();
        let _ = app.emit("engine", json!({ "event": "loading", "stage": "restarting", "progress": 0.02 }));
        self.start(app, config);
    }
}

/// Engine errors go to %APPDATA%/koe/engine.log, replaced on each start.
pub fn log_path() -> PathBuf {
    dirs::config_dir().unwrap_or_default().join("koe").join("engine.log")
}

fn open_log() -> std::io::Result<File> {
    let path = log_path();
    if let Some(folder) = path.parent() {
        std::fs::create_dir_all(folder)?;
    }
    File::create(path)
}

fn last_log_line() -> Option<String> {
    let text = std::fs::read_to_string(log_path()).ok()?;
    text.lines().rev().map(str::trim).find(|line| !line.is_empty()).map(String::from)
}

fn report_crash(app: &AppHandle, message: &str) {
    let _ = app.emit("engine", json!({ "event": "error", "kind": "engine_crashed", "message": message }));
}
