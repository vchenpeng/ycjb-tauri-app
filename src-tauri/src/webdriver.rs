use tauri::{
  plugin::{Builder, TauriPlugin},
  AppHandle, Manager, Runtime, State,
};
use lazy_static::lazy_static;
use anyhow::{anyhow, Result};
use std::error::Error;

use std::{collections::HashMap, sync::Mutex};
use headless_chrome::{Browser, Tab};
use headless_chrome::protocol::cdp::Page;
use headless_chrome::protocol::cdp::Target;
use headless_chrome::{protocol::cdp::types::Event, LaunchOptions};
use headless_chrome::browser::default_executable;
use std::sync::Arc;
use std::path::PathBuf;
use tokio::time::{sleep, Duration,Instant};
use serde::{Serialize, Deserialize};
use sysinfo::{Pid,PidExt, ProcessExt, System, SystemExt, ProcessStatus};

use Target::{CreateTarget, SetDiscoverTargets};

use std::sync::{OnceLock};
use std::sync::RwLock;

#[derive(Default)]
struct MyState {}
type WrappedState = Mutex<Option<MyState>>;

lazy_static!{
	static ref driver_lock: RwLock<Driver> = {
		let driver = Driver::new().unwrap();
		RwLock::new(driver)
	};
}

#[derive(Clone)]
struct Driver {
	 process_id: Option<u32>,
	 launch_target_id: Option<String>,
	 browser: Browser
}

// fn get_driver() -> Driver {
// 	// DRIVER.get().unwrap()
// 	// &LOCAL_DRIVER
// 	driver_lock.read().unwrap()
// }

// #[derive(Serilize, Deserialize, Debug)]
struct WebDriver {
	process_id: Option<u32>,
	target_id: String
}

fn create_browser() -> Result<Driver> {
	let default_launch_options = LaunchOptions::default_builder()
					.path(Some(default_executable().unwrap()))
					.build()
					.unwrap();
	const CHROME_ARGS: [&str; 1] = [
		// "-profile-directory=Default",
		// "--disable-background-networking",
		// "--enable-features=NetworkService,NetworkServiceInProcess",
		// "--disable-background-timer-throttling",
		// "--disable-backgrounding-occluded-windows",
		// "--disable-breakpad",
		// "--disable-client-side-phishing-detection",
		// "--disable-component-extensions-with-background-pages",
		// "--disable-default-apps",
		// "--disable-dev-shm-usage",
		// "--disable-extensions",
		// // BlinkGenPropertyTrees disabled due to crbug.com/937609
		// "--disable-features=TranslateUI,BlinkGenPropertyTrees",
		// "--disable-hang-monitor",
		// "--disable-ipc-flooding-protection",
		// "--disable-popup-blocking",
		// "--disable-prompt-on-repost",
		// "--disable-renderer-backgrounding",
		// "--disable-sync",
		// "--force-color-profile=srgb",
		// "--metrics-recording-only",
		"--no-first-run",
		// // "--enable-automation",
		// "--password-store=basic",
		// "--use-mock-keychain"
	];
	// let path = PathBuf::from(r"/Users/chenpeng/Library/Application Support/Google/Chrome");
	let launch_options = LaunchOptions {
			headless: false,
			sandbox: true,
			// enable_gpu: true,
			// user_data_dir: Some(path).clone(),
			// port: Some(9333),
			ignore_certificate_errors: false,
			disable_default_args: true,
			args: CHROME_ARGS.iter().map(|x| std::ffi::OsStr::new(x)).collect(),
			..default_launch_options
	};
	// dbg!(&launch_options);
	let browser = Browser::new(launch_options).unwrap();
	let first_tab = browser.wait_for_initial_tab()?;
	let launch_target_id = first_tab.get_target_id().to_string();
	println!("启动 {:?}", launch_target_id);
	let driver = Driver {
		process_id: browser.get_process_id(),
		launch_target_id: Some(launch_target_id),
		browser: browser
	};
	Ok(driver)
}

impl Driver {
	pub fn new() -> Result<Self> {
		create_browser()
	}
	fn reinit(self: &Self) {
		let driver = create_browser().unwrap();
		// Self = driver;
		// self.process_id = driver.process_id;
		// self.launch_target_id = driver.launch_target_id;
		// self.browser = driver.browser
	}
}

async fn set_time_out(f: impl Fn() -> (), d: Duration) {
	sleep(d).await;
	f();
}

#[tauri::command]
fn do_something<R: Runtime>(_app: AppHandle<R>, state: State<'_, MyState>) {
  // you can access `MyState` here!
}

#[tauri::command(async)]
fn launch(state: State<WrappedState>) -> (u32, String) {
	
	let mut process_id = 0;
	let mut launch_target_id = "".to_string();
	let mut driver = driver_lock.write().unwrap();
	{
		process_id = driver.process_id.unwrap();
		launch_target_id = driver.launch_target_id.clone().unwrap();
	}
	if get_process_status(process_id) == "Unknown" {
		println!("重新启动浏览器");
		// c.reinit();
		let newDriver = Driver::new().unwrap();
		// let mut w = driver_lock.write().unwrap();
		{
			println!("获取写lock");
			*driver = newDriver;
			launch_target_id = driver.launch_target_id.clone().unwrap();
			process_id = driver.process_id.unwrap();
		}
	}
	else {
		println!("启动浏览器");
	}

	println!("launch process_id {:?}", process_id);
	println!("launch launch_target_id {:?}", launch_target_id);
	return (process_id, launch_target_id);
}

#[tauri::command(async)]
fn new_tab(state: State<WrappedState>, url: Option<&str>) -> String {
	let tab_in_context = CreateTarget {
		url: url.unwrap_or("about:blank").to_string(),
		width: None,
		height: None,
		browser_context_id: None,
		enable_begin_frame_control: None,
		new_window: None,
		background: None,
	};
	let resultDriver = driver_lock.read().unwrap();
	let tab = resultDriver.browser.new_tab_with_options(tab_in_context).unwrap();
	let target_id = tab.get_target_id().to_string();
	println!("tab target_id {:?}", target_id);
	return target_id;
}

#[tauri::command(async)]
fn get_process_id(state: State<WrappedState>) -> Option<u32> {
	let resultDriver = driver_lock.read().unwrap();
	resultDriver.browser.get_process_id()
}

#[tauri::command(async)]
fn get_debug_ws_url(state: State<WrappedState>) -> String {
	let driver = driver_lock.read().unwrap();
	let process = driver.browser.get_process();
	if process.is_none()
	{
		"".to_string()
	}
  else
	{
		process.unwrap().debug_ws_url.to_string()
	}
}

#[tauri::command(async)]
fn get_tabs_count(state: State<WrappedState>) -> usize {
		let browser_tabs2 = get_lock_tabs_map();
		let count = browser_tabs2.len();
		return count;
}

fn get_lock_tabs() -> Vec<Arc<Tab>> {
	let mut tabs = vec![];
	let driver = driver_lock.read().unwrap();
	{
		let browser_tabs = driver.browser.get_tabs().lock().unwrap();
		for tab in browser_tabs.iter() {
			if let Some(context_id) = tab.get_browser_context_id().unwrap() {
				tabs.push(Arc::clone(tab));
			}
		}
	}
	tabs
}

fn get_lock_tabs_map() -> HashMap<String, Arc<Tab>> {
	let mut tab_map = HashMap::new();
	let driver = driver_lock.read().unwrap();
	{
		let browser_tabs = driver.browser.get_tabs().lock().unwrap();
		browser_tabs.iter().for_each(|tab| {
			let target_id = tab.get_target_id().to_string();
			tab_map.insert(target_id, Arc::clone(tab));
		});
	}
	tab_map
}

#[derive(serde::Serialize)]
struct CustomResponse {
	success: bool,
	data: String,
  message: String
}

#[tauri::command(async)]
fn get_tab_content(wstate: State<WrappedState>, tid: &str) -> Result<CustomResponse, CustomResponse> {
	let browser_tabs2 = get_lock_tabs_map();
	let tab = browser_tabs2.get(tid);
	if !tab.is_none()
	{
		let content = tab.unwrap().get_content();
		if content.is_ok()
		{
			Ok(CustomResponse {
				success: true,
				data: content.unwrap(),
				message: "".to_string()
			})
		}
		else
		{
			Ok(CustomResponse {
				success: false,
				data: "".to_string(),
				message: "当前TAB不再活跃".to_string()
			})
		}
	}
	else
	{
		Err(CustomResponse {
			success: false,
			data: "".to_string(),
			message: "error".to_string()
		})
	}
}

#[tauri::command(async)]
fn get_process_status(pid: u32) -> std::string::String {
	let s = System::new_all();
	if let Some(process) = s.process(Pid::from_u32(pid)) {
		let status = process.status();
		println!("process status {:?}", status);
		return status.to_string().into();
	}
	else {
		return "Unknown".to_string();
	}
}

#[tauri::command(async)]
fn reload(state: State<WrappedState>, tid: &str) {
	let browser_tabs2 = get_lock_tabs_map();
	let tab = browser_tabs2.get(tid);
	if !tab.is_none()
	{
		tab.unwrap().reload(false, None);
	}
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("webdriver")
    .invoke_handler(tauri::generate_handler![do_something, launch, new_tab, get_process_id, get_tabs_count,reload, get_tab_content, get_process_status, get_debug_ws_url])
    .setup(|app_handle| {
      // setup plugin specific state here
			app_handle.manage(Mutex::new(None::<MyState>));
      Ok(())
    })
    .build()
}
