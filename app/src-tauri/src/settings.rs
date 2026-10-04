use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub setup_done: bool,
    pub hotkey: String,
    pub mic_index: Option<i64>,
    pub whisper_model: String,
    pub language: String,
    pub device: String,
    pub voice: String,
    pub speed: f64,
    pub follow_session: String,
    pub voice_provider: String,
    pub eleven_api_key: String,
    pub eleven_voice_id: String,
    pub speak_replies: bool,
    pub subtitles: bool,
    pub task_alerts: bool,
    pub sound_effects: bool,
    pub start_with_windows: bool,
    pub character: String,
    pub position: Option<(i32, i32)>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            setup_done: false,
            hotkey: "right ctrl".into(),
            mic_index: None,
            whisper_model: "small.en".into(),
            language: "en".into(),
            device: "auto".into(),
            voice: "af_heart".into(),
            speed: 1.1,
            follow_session: "auto".into(),
            voice_provider: "kokoro".into(),
            eleven_api_key: String::new(),
            eleven_voice_id: String::new(),
            speak_replies: true,
            subtitles: true,
            task_alerts: true,
            sound_effects: false,
            start_with_windows: true,
            character: "anime-buddy".into(),
            position: None,
        }
    }
}

impl Settings {
    /// The subset the Python voice engine understands, in its own key names.
    pub fn engine_config(&self) -> serde_json::Value {
        serde_json::json!({
            "hotkey": self.hotkey,
            "mic_index": self.mic_index,
            "whisper_model": self.whisper_model,
            "language": self.language,
            "device": self.device,
            "voice": self.voice,
            "speed": self.speed,
            "voice_provider": self.voice_provider,
            "eleven_api_key": self.eleven_api_key,
            "eleven_voice_id": self.eleven_voice_id,
        })
    }
}

fn settings_file() -> PathBuf {
    let folder = dirs::config_dir().unwrap_or_else(|| PathBuf::from(".")).join("koe");
    let _ = fs::create_dir_all(&folder);
    folder.join("settings.json")
}

pub fn load() -> Settings {
    fs::read_to_string(settings_file())
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

pub fn save(settings: &Settings) {
    if let Ok(text) = serde_json::to_string_pretty(settings) {
        let _ = fs::write(settings_file(), text);
    }
}
