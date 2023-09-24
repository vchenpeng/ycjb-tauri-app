// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate machine_uid;
mod webdriver;
use sysinfo::{ProcessExt, System, SystemExt};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_machine_uid() -> String {
    let id: String = machine_uid::get().unwrap();
    format!("{}", id)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(webdriver::init())
        .invoke_handler(tauri::generate_handler![greet, get_machine_uid])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
