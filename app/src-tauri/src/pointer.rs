//! Tells the UI when the user clicks anywhere outside the Koe window,
//! so open panels can close without Koe ever stealing keyboard focus.

use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use windows_sys::Win32::Foundation::POINT;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, VK_LBUTTON, VK_RBUTTON};
use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;

const POLL: Duration = Duration::from_millis(30);

fn any_button_down() -> bool {
    unsafe { (GetAsyncKeyState(VK_LBUTTON as i32) as u16 & 0x8000) != 0 || (GetAsyncKeyState(VK_RBUTTON as i32) as u16 & 0x8000) != 0 }
}

fn cursor() -> Option<(i32, i32)> {
    let mut point = POINT { x: 0, y: 0 };
    let ok = unsafe { GetCursorPos(&mut point) };
    (ok != 0).then_some((point.x, point.y))
}

pub fn watch_outside_clicks(app: AppHandle) {
    thread::spawn(move || {
        let mut was_down = false;
        loop {
            let is_down = any_button_down();
            if is_down && !was_down {
                if let (Some(window), Some((x, y))) = (app.get_webview_window("main"), cursor()) {
                    if let (Ok(position), Ok(size)) = (window.outer_position(), window.outer_size()) {
                        let inside = x >= position.x
                            && y >= position.y
                            && x < position.x + size.width as i32
                            && y < position.y + size.height as i32;
                        if !inside {
                            let _ = app.emit("pointer-outside", ());
                        }
                    }
                }
            }
            was_down = is_down;
            thread::sleep(POLL);
        }
    });
}
