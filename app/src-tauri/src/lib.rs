mod engine;
mod installer;
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

/// Copies files to <project>/Backup/<date>/<time>/<path inside project>, like Fast Backup.
#[tauri::command]
fn backup_files(project: String, date: String, time: String, files: Vec<String>) -> Result<String, String> {
    let project = std::path::PathBuf::from(project);
    let target_root = project.join("Backup").join(date).join(time);
    for file in &files {
        let source = std::path::PathBuf::from(file);
        let inside = source.strip_prefix(&project).map(|path| path.to_path_buf()).unwrap_or_else(|_| {
            source.components().filter(|part| matches!(part, std::path::Component::Normal(_))).collect()
        });
        let target = target_root.join(inside);
        if let Some(folder) = target.parent() {
            std::fs::create_dir_all(folder).map_err(|error| error.to_string())?;
        }
        std::fs::copy(&source, &target).map_err(|error| format!("{file}: {error}"))?;
    }
    Ok(target_root.to_string_lossy().into_owned())
}

/// Screen errors go to %APPDATA%/koe/ui.log so crashes can be traced.
#[tauri::command]
fn log_ui_error(message: String) {
    use std::io::Write;
    let path = engine::log_path().with_file_name("ui.log");
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{message}");
    }
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

fn speak_replies_on(app: &tauri::AppHandle) -> bool {
    app.try_state::<AppState>()
        .map(|state| state.settings.lock().unwrap().speak_replies)
        .unwrap_or(true)
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
                    if event["kind"] == "reply" && speak_replies_on(&event_handle) {
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
            log_ui_error,
            backup_files,
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
