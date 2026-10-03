use serde_json::Value;
use std::io::{BufRead, BufReader, Write};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::Mutex;
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

pub struct Engine {
    stdin: Mutex<Option<ChildStdin>>,
    child: Mutex<Option<Child>>,
}

impl Engine {
    pub fn new() -> Self {
        Self { stdin: Mutex::new(None), child: Mutex::new(None) }
    }

    pub fn start(&self, app: AppHandle, config: Value) {
        let root = project_root();
        let python = root.join(".venv").join("Scripts").join("python.exe");
        let spawned = Command::new(python)
            .args(["-m", "koe.engine", &config.to_string()])
            .current_dir(&root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();

        let mut child = match spawned {
            Ok(child) => child,
            Err(error) => {
                let _ = app.emit("engine", serde_json::json!({
                    "event": "error", "kind": "engine_crashed", "message": error.to_string()
                }));
                return;
            }
        };

        let stdout = child.stdout.take().expect("engine stdout");
        *self.stdin.lock().unwrap() = child.stdin.take();
        *self.child.lock().unwrap() = Some(child);

        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                if let Ok(event) = serde_json::from_str::<Value>(&line) {
                    let _ = app.emit("engine", event);
                }
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
        self.send(serde_json::json!({ "cmd": "quit" }));
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}
