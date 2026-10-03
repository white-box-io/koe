mod engine;
mod pointer;
mod settings;
mod transcript;

use engine::Engine;
use serde_json::Value;
use settings::Settings;
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, RunEvent, State};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use transcript::{Follower, SessionInfo};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

struct AppState {
    settings: Mutex<Settings>,
    engine: Arc<Engine>,
    follower: Follower,
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(app: AppHandle, state: State<AppState>, settings: Settings) {
    let previous = state.settings.lock().unwrap().clone();
    settings::save(&settings);
    if previous.device != settings.device {
        state.engine.restart(app.clone(), settings.engine_config());
    } else {
        state.engine.send(merge_command("config", settings.engine_config()));
    }
    if previous.follow_session != settings.follow_session {
        *state.follower.choice.lock().unwrap() = settings.follow_session.clone();
    }
    if previous.start_with_windows != settings.start_with_windows || (settings.setup_done && !previous.setup_done) {
        apply_autostart(&app, settings.start_with_windows);
    }
    *state.settings.lock().unwrap() = settings;
}

#[tauri::command]
fn engine_command(state: State<AppState>, command: Value) {
    state.engine.send(command);
}

#[tauri::command]
fn restart_engine(app: AppHandle, state: State<AppState>) {
    let config = state.settings.lock().unwrap().engine_config();
    state.engine.restart(app, config);
}

#[tauri::command]
fn list_sessions() -> Vec<SessionInfo> {
    transcript::list_sessions(8)
}

#[tauri::command]
fn open_file(path: String, snippet: Option<String>) {
    let target = match snippet.as_deref().and_then(|s| transcript::find_line(&path, s)) {
        Some(line) => format!("{path}:{line}"),
        None => path,
    };
    run_hidden(&["/C", "code", "-r", "-g", &target]);
}

#[tauri::command]
fn open_sound_settings() {
    run_hidden(&["/C", "start", "ms-settings:sound"]);
}

#[tauri::command]
fn open_url(url: String) {
    run_hidden(&["/C", "start", "", &url]);
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn run_hidden(args: &[&str]) {
    let _ = Command::new("cmd").args(args).creation_flags(CREATE_NO_WINDOW).spawn();
}

fn merge_command(name: &str, fields: Value) -> Value {
    let mut command = fields;
    command["cmd"] = Value::String(name.into());
    command
}

fn apply_autostart(app: &AppHandle, enabled: bool) {
    let launcher = app.autolaunch();
    let _ = if enabled { launcher.enable() } else { launcher.disable() };
}

pub fn run() {
    let settings = settings::load();
    let engine = Arc::new(Engine::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup({
            let engine = engine.clone();
            move |app| {
                let handle = app.handle().clone();
                engine.start(handle.clone(), settings.engine_config());

                let speaking_engine = engine.clone();
                let event_handle = handle.clone();
                let follower = Follower::start(settings.follow_session.clone(), move |event| {
                    if event["kind"] == "reply" {
                        speaking_engine.send(serde_json::json!({ "cmd": "speak", "text": event["text"] }));
                    }
                    let _ = event_handle.emit("claude", event);
                });

                pointer::watch_outside_clicks(handle.clone());
                app.manage(AppState { settings: Mutex::new(settings.clone()), engine, follower });
                Ok(())
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            engine_command,
            restart_engine,
            list_sessions,
            open_file,
            open_sound_settings,
            open_url,
            quit_app
        ])
        .build(tauri::generate_context!())
        .expect("error while building Koe")
        .run(move |_, event| {
            if let RunEvent::Exit = event {
                engine.stop();
            }
        });
}
