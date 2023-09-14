use tauri::{
  plugin::{Builder, TauriPlugin},
  AppHandle, Manager, Runtime, State,
};
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

use Target::{CreateTarget, SetDiscoverTargets};

use std::sync::{OnceLock};

#[derive(Default)]
struct MyState {}

type WrappedState = Mutex<Option<Driver>>;

static DRIVER: OnceLock<Driver> = OnceLock::new();
fn get_driver() -> &'static Driver {
	DRIVER.get().unwrap()
}

#[derive(Clone)]
struct Driver {
	process_id: Option<u32>,
	launch_target_id: Option<String>,
	browser: Browser,
	// tabs: HashMap<String, Arc<Tab>>
}

// #[derive(Serilize, Deserialize, Debug)]
struct WebDriver {
	process_id: Option<u32>,
	target_id: String
}

impl Driver {
	pub fn new() -> Result<Self> {
		Self::create_browser()
	}

	fn create_browser() -> Result<Self> {
		let default_launch_options = LaunchOptions::default_builder()
            .path(Some(default_executable().unwrap()))
            .build()
						.unwrap();
		const CHROME_ARGS: [&str; 0] = [
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
			// "--no-first-run",
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

		// let browser = Browser::new(launch_options).unwrap();
		let browser = Browser::new(launch_options)?;
		let first_tab = browser.wait_for_initial_tab()?;
		let launch_target_id = first_tab.get_target_id().to_string();
		println!("启动 {:?}", launch_target_id);
		let driver = Driver {
			process_id: browser.get_process_id(),
			launch_target_id: Some(launch_target_id),
			browser: browser,
			// tabs: browser_tabs
		};
		Ok(driver)
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

// #[tauri::command]
// fn launch(state: State<WrappedState>) -> Option<u32> {
// 	println!("launch");
// 	let driver = Driver::new().unwrap();
// 	let process_id = driver.browser.get_process_id();
// 	*state.lock().unwrap() = Some(driver);
// 	return process_id;
// }
#[tauri::command(async)]
// #[tokio::main]
fn launch(state: State<WrappedState>) -> String {
	println!("launch");
	let driver = Driver::new().unwrap();
	// array().lock().unwrap().push(1);

	DRIVER.get_or_init(|| driver);
	let launch_target_id = DRIVER.get().unwrap().launch_target_id.clone().unwrap();
	// Ok(launch_target_id)
	println!("launch_target_id {:?}", launch_target_id);
	// *state.lock().unwrap() = Some(driver);
	return launch_target_id;
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
	let tab = get_driver().browser.new_tab_with_options(tab_in_context).unwrap();
	// let tab = get_driver().browser.new_tab().unwrap();
	let target_id = tab.get_target_id().to_string();
	println!("tab {:?}", target_id);
	return target_id;
}

#[tauri::command(async)]
fn get_process_id(state: State<WrappedState>) -> Option<u32> {
	if let Some(ref mut state) = *state.lock().unwrap()
		{
			state.browser.get_process_id()
		}
	else
		{
			None
		}
}

#[tauri::command(async)]
fn get_tabs_count(state: State<WrappedState>) -> usize {
	if let Some(ref mut state) = *state.lock().unwrap()
		{
			state.browser.get_tabs().lock().unwrap().len()
		}
	else
		{
			let index: i32 = 0;
			index as usize
		}
}

fn get_lock_tabs() -> Vec<Arc<Tab>> {
	// lock().unwrap().map(Arc::clone)
	let browser_tabs = get_driver().browser.get_tabs().lock().unwrap();
	let mut tabs = vec![];
	for tab in browser_tabs.iter() {
		if let Some(context_id) = tab.get_browser_context_id().unwrap() {
			tabs.push(Arc::clone(tab));
		}
	}
	tabs
}

fn get_lock_tabs_map() -> HashMap<String, Arc<Tab>> {
	let browser_tabs = get_driver().browser.get_tabs().lock().unwrap();
	let mut tab_map = HashMap::new();
	browser_tabs.iter().for_each(|tab| {
		let target_id = tab.get_target_id().to_string();
		// tab_map.insert(target_id, *tab);
		tab_map.insert(target_id, Arc::clone(tab));
	});
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
	// let dirver = get_driver();
	// let browser_tabs = get_lock_tabs();
	// let tab = browser_tabs.first();
	let browser_tabs2 = get_lock_tabs_map();
	// let browser_tabs2 = get_driver().tabs.clone();
	let tab = browser_tabs2.get(tid);
	if !tab.is_none()
	{
		Ok(CustomResponse {
			success: true,
			data: tab.unwrap().get_title().unwrap(),
			message: "".to_string()
		})
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
fn reload(state: State<WrappedState>, tid: &str) {
	// let browser_tabs = get_driver().browser.get_tabs().lock().unwrap();
	// let mut tabs = vec![];
	// for tab in browser_tabs.iter() {
	// 	if let target_id = tab.get_target_id().to_string() {
	// 		if target_id == tid {
	// 				tabs.push(Arc::clone(tab));
	// 		}
	// 	}
	// }
	// let tab = tabs.first();
	let browser_tabs2 = get_lock_tabs_map();
	let tab = browser_tabs2.get(tid);
	if !tab.is_none()
	{
		tab.unwrap().reload(false, None);
	}
}

// let num_tabs = browser.get_tabs().lock().unwrap().len();
// #[tauri::command]
// fn get_tabs(state: State<WrappedState>) -> Result<Arc<String>> {
// 	let mut tabs = vec![];
// 	if let Some(ref mut state) = *state.lock().unwrap() {
// 		let browser_tabs = state.browser.get_tabs().lock().unwrap();
// 		for tab in browser_tabs.iter() {
// 				if let Some(context_id) = tab.get_browser_context_id()? {
// 						if context_id == self.id {
// 								tabs.push(Arc::clone(tab.id));
// 						}
// 				}
// 		}
// 		Ok(tabs)
// 	}
// }

#[tokio::main]
async fn new_tab_action() -> Result<Browser, Box<dyn Error>> {
	let default_launch_options = LaunchOptions::default_builder()
            .path(Some(default_executable()?))
            .build()
						.unwrap();
	const CHROME_ARGS: [&str; 0] = [
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
    // "--no-first-run",
    // // "--enable-automation",
    // "--password-store=basic",
    // "--use-mock-keychain"
	];
	let launch_options = LaunchOptions {
			headless: false,
			sandbox: true,
			// enable_gpu: true,
			// user_data_dir: Some(path),
			// port: Some(9333),
			ignore_certificate_errors: false,
			disable_default_args: true,
			args: CHROME_ARGS.iter().map(|x| std::ffi::OsStr::new(x)).collect(),
			..default_launch_options
	};
	// dbg!(&launch_options);
	println!("启动 {:?}", Instant::now());
	let browser = Browser::new(launch_options)?;
	// let id = browser.get_process_id();
	let tab = browser.wait_for_initial_tab()?;
	// let tab = browser.new_tab()?;

	// let tabs = browser.get_tabs();
	// let tab = browser.get_tabs().lock().unwrap().get(0).unwrap();

	let newTab = browser.new_tab()?;
	tab.close(false)?;
	newTab.navigate_to("https://www.baidu.com")?;
	// tab.navigate_to("about:blank")?;
	// let closed = tab.close(true);
	// tab.wait_until_navigated()?;
	let result = newTab.get_title()?;
  dbg!(&result);
	// println!("Current {:?}");
	let me = "World";
	// println!("Current {:?}", Instant::now());
	// let now = Instant::now();
	// set_time_out(
	// 		|| {
	// 				let text = tab.get_title();
	// 				println!("title {:?}", text);
	// 		},
	// 		Duration::from_secs(10),
	// ).await;
	// set_time_out(
	// 		|| {
	// 				println!("Current {:?}", Instant::now());
	// 				println!("Hello {} ! --elapsed {:?}", me, now.elapsed());
	// 		},
	// 		Duration::from_secs(20000),
	// ).await;
	Ok(browser)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("webdriver")
    .invoke_handler(tauri::generate_handler![do_something, launch, new_tab, get_process_id, get_tabs_count,reload, get_tab_content])
    .setup(|app_handle| {
      // setup plugin specific state here
			app_handle.manage(Mutex::new(None::<Driver>));
      Ok(())
    })
    .build()
}
