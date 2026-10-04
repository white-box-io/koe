//! Follows the live Claude Code session file and reports what Claude says and touches.

use serde::Serialize;
use serde_json::{json, Value};
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime};

const POLL: Duration = Duration::from_millis(200);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub path: String,
    pub project: String,
    pub folder: String,
    pub title: String,
    pub modified_secs_ago: u64,
}

pub fn projects_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_default().join(".claude").join("projects")
}

fn session_files() -> Vec<(PathBuf, SystemTime)> {
    let mut files = Vec::new();
    let Ok(projects) = fs::read_dir(projects_dir()) else { return files };
    for project in projects.flatten() {
        let Ok(entries) = fs::read_dir(project.path()) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
                continue;
            }
            if let Ok(modified) = entry.metadata().and_then(|m| m.modified()) {
                files.push((path, modified));
            }
        }
    }
    files.sort_by(|a, b| b.1.cmp(&a.1));
    files
}

fn describe_session(path: &Path, modified: SystemTime) -> SessionInfo {
    let text = fs::read_to_string(path).unwrap_or_default();
    let mut folder = String::new();
    let mut title = String::new();
    for line in text.lines() {
        let Ok(entry) = serde_json::from_str::<Value>(line) else { continue };
        if folder.is_empty() {
            if let Some(cwd) = entry["cwd"].as_str() {
                folder = cwd.to_string();
            }
        }
        if let Some(ai_title) = entry["aiTitle"].as_str() {
            title = ai_title.to_string();
        }
    }
    let project = Path::new(&folder)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| "Claude Code".into());
    SessionInfo {
        path: path.to_string_lossy().to_string(),
        project,
        folder,
        title,
        modified_secs_ago: SystemTime::now().duration_since(modified).map(|d| d.as_secs()).unwrap_or(0),
    }
}

pub fn list_sessions(limit: usize) -> Vec<SessionInfo> {
    session_files()
        .into_iter()
        .take(limit)
        .map(|(path, modified)| describe_session(&path, modified))
        .collect()
}

fn line_count(text: &str) -> usize {
    if text.is_empty() { 0 } else { text.lines().count().max(1) }
}

/// Turns one transcript line into the events the UI cares about.
fn events_from_line(line: &str) -> Vec<Value> {
    let Ok(entry) = serde_json::from_str::<Value>(line) else { return vec![] };
    if entry["isSidechain"].as_bool() == Some(true) {
        return vec![];
    }
    let message = &entry["message"];
    let mut events = Vec::new();
    match entry["type"].as_str() {
        Some("user") => {
            let content = &message["content"];
            let typed_text = content.as_str().map(String::from).or_else(|| {
                content.as_array().and_then(|blocks| {
                    let texts: Vec<&str> = blocks
                        .iter()
                        .filter(|b| b["type"] == "text")
                        .filter_map(|b| b["text"].as_str())
                        .collect();
                    let has_tool_result = blocks.iter().any(|b| b["type"] == "tool_result");
                    if texts.is_empty() || has_tool_result { None } else { Some(texts.join("\n")) }
                })
            });
            if let Some(text) = typed_text {
                if !text.starts_with('<') {
                    events.push(json!({ "kind": "prompt", "text": text }));
                }
            }
            let tool_failed = content
                .as_array()
                .is_some_and(|blocks| blocks.iter().any(|b| b["type"] == "tool_result" && b["is_error"] == true));
            if tool_failed {
                events.push(json!({ "kind": "oops" }));
            }
        }
        Some("assistant") => {
            for block in message["content"].as_array().into_iter().flatten() {
                match block["type"].as_str() {
                    Some("text") => {
                        if let Some(text) = block["text"].as_str() {
                            let (spoken, backup_files) = split_backup_list(text);
                            if !backup_files.is_empty() {
                                events.push(json!({ "kind": "backup", "files": backup_files }));
                            }
                            if !spoken.trim().is_empty() {
                                events.push(json!({ "kind": "reply", "text": spoken }));
                            }
                        }
                    }
                    Some("tool_use") => {
                        if let Some(file) = file_event(block) {
                            events.push(file);
                        }
                    }
                    _ => {}
                }
            }
            if message["stop_reason"] == "end_turn" {
                events.push(json!({ "kind": "done" }));
            }
        }
        _ => {}
    }
    events
}

const BACKUP_FENCE: &str = "```koe-backup";

/// Pulls a ```koe-backup block (one file path per line) out of a reply.
/// Returns the reply without it, for speaking, and the listed files.
fn split_backup_list(text: &str) -> (String, Vec<String>) {
    let Some(start) = text.find(BACKUP_FENCE) else { return (text.to_string(), vec![]) };
    let after_fence = &text[start + BACKUP_FENCE.len()..];
    let end = after_fence.find("```").unwrap_or(after_fence.len());
    let files = after_fence[..end]
        .lines()
        .map(|line| line.trim().trim_start_matches("- ").trim_matches('`').to_string())
        .filter(|line| !line.is_empty())
        .collect();
    let rest = after_fence.get(end + 3..).unwrap_or("");
    (format!("{}{}", &text[..start], rest), files)
}

fn file_event(block: &Value) -> Option<Value> {
    let input = &block["input"];
    let path = input["file_path"].as_str().or_else(|| input["notebook_path"].as_str())?;
    let (action, added, removed, snippet) = match block["name"].as_str()? {
        "Read" => ("read", 0, 0, String::new()),
        "Write" => ("write", line_count(input["content"].as_str().unwrap_or("")), 0, String::new()),
        "Edit" => {
            let new = input["new_string"].as_str().unwrap_or("");
            let old = input["old_string"].as_str().unwrap_or("");
            ("edit", line_count(new), line_count(old), new.lines().next().unwrap_or("").to_string())
        }
        "MultiEdit" => {
            let edits = input["edits"].as_array().cloned().unwrap_or_default();
            let added = edits.iter().map(|e| line_count(e["new_string"].as_str().unwrap_or(""))).sum();
            let removed = edits.iter().map(|e| line_count(e["old_string"].as_str().unwrap_or(""))).sum();
            ("edit", added, removed, String::new())
        }
        "NotebookEdit" => ("edit", 0, 0, String::new()),
        _ => return None,
    };
    Some(json!({ "kind": "file", "path": path, "action": action, "added": added, "removed": removed, "snippet": snippet }))
}

pub struct Follower {
    pub choice: Arc<Mutex<String>>,
}

impl Follower {
    /// `choice` is "auto" (newest session) or the path of one session file.
    pub fn start(choice: String, on_event: impl Fn(Value) + Send + 'static) -> Self {
        let choice = Arc::new(Mutex::new(choice));
        let watched_choice = choice.clone();
        thread::spawn(move || follow_loop(watched_choice, on_event));
        Self { choice }
    }
}

fn pick_file(choice: &str) -> Option<PathBuf> {
    if choice != "auto" {
        let path = PathBuf::from(choice);
        return path.exists().then_some(path);
    }
    session_files().into_iter().next().map(|(path, _)| path)
}

fn follow_loop(choice: Arc<Mutex<String>>, on_event: impl Fn(Value)) {
    let mut current: Option<PathBuf> = None;
    let mut position = 0u64;
    let mut unfinished = String::new();
    loop {
        let wanted = pick_file(&choice.lock().unwrap().clone());
        if wanted != current {
            current = wanted;
            unfinished.clear();
            position = current.as_ref().and_then(|p| fs::metadata(p).ok()).map(|m| m.len()).unwrap_or(0);
            let session = current.as_ref().map(|path| {
                let modified = fs::metadata(path).and_then(|m| m.modified()).unwrap_or(SystemTime::now());
                describe_session(path, modified)
            });
            on_event(json!({ "kind": "following", "session": session }));
        }
        if let Some(path) = &current {
            if let Ok(mut file) = File::open(path) {
                if file.seek(SeekFrom::Start(position)).is_ok() {
                    let mut new_text = String::new();
                    if file.read_to_string(&mut new_text).is_ok() {
                        position += new_text.len() as u64;
                        unfinished.push_str(&new_text);
                        while let Some(end) = unfinished.find('\n') {
                            let line: String = unfinished.drain(..=end).collect();
                            for event in events_from_line(line.trim_end()) {
                                on_event(event);
                            }
                        }
                    }
                }
            }
        }
        thread::sleep(POLL);
    }
}

/// Finds the line where an edit landed so VS Code can jump straight to it.
pub fn find_line(path: &str, snippet: &str) -> Option<usize> {
    if snippet.trim().is_empty() {
        return None;
    }
    let text = fs::read_to_string(path).ok()?;
    text.lines().position(|line| line.contains(snippet.trim())).map(|index| index + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_list_is_shown_not_spoken() {
        let (spoken, files) = split_backup_list("Please back up these.\n```koe-backup\nF:/a.php\n- F:/b.js\n```\nThen say done.");
        assert_eq!(files, vec!["F:/a.php", "F:/b.js"]);
        assert_eq!(spoken, "Please back up these.\n\nThen say done.");
    }

    #[test]
    fn reads_assistant_text_files_and_turn_end() {
        let line = r#"{"type":"assistant","isSidechain":false,"message":{"stop_reason":"end_turn","content":[
            {"type":"text","text":"Done!"},
            {"type":"tool_use","name":"Edit","input":{"file_path":"C:/a.py","old_string":"x","new_string":"y\nz"}}]}}"#
            .replace('\n', "");
        let events = events_from_line(&line);
        assert_eq!(events[0]["kind"], "reply");
        assert_eq!(events[1]["kind"], "file");
        assert_eq!(events[1]["added"], 2);
        assert_eq!(events[1]["removed"], 1);
        assert_eq!(events[2]["kind"], "done");
    }

    #[test]
    fn typed_prompt_is_reported_but_tool_results_are_not() {
        let prompt = r#"{"type":"user","message":{"content":"make it bigger"}}"#;
        assert_eq!(events_from_line(prompt)[0]["kind"], "prompt");
        let tool_result = r#"{"type":"user","message":{"content":[{"type":"tool_result","content":"ok"}]}}"#;
        assert!(events_from_line(tool_result).is_empty());
    }

    #[test]
    fn subagent_lines_are_ignored() {
        let line = r#"{"type":"assistant","isSidechain":true,"message":{"content":[{"type":"text","text":"hi"}]}}"#;
        assert!(events_from_line(line).is_empty());
    }
}
