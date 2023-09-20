import { invoke } from '@tauri-apps/api/tauri'

export async function getPageContent (tid) {
  return invoke('plugin:webdriver|get_tab_content', {
    tid: tid,
  })
}
export async function newTab (url) {
  const tid = await invoke('plugin:webdriver|new_tab', {
    url: url
  })
  return tid
}

export async function getTabsCount (tid) {
  return invoke('plugin:webdriver|get_tabs_count', {
    tid: tid,
  })
}

export async function getProcessId () {
  return invoke('plugin:webdriver|get_process_id', {})
}
// get_process_id

export async function reload (tid) {
  invoke('plugin:webdriver|reload', {
    tid: tid,
  })
}

export async function launch () {
  const tid = await invoke('plugin:webdriver|launch')
  return tid
}

export async function getDebugWsUrl () {
  const url = await invoke('plugin:webdriver|get_debug_ws_url')
  return url
}

export async function getDebugConfig (port) {
  const config = await invoke('plugin:webdriver|get_debug_config', {
    port
  })
  return config
}

export async function getProcessStatus (pid) {
  const status = await invoke('plugin:webdriver|get_process_status', {
    pid
  })
  return status
}
export async function init () {
  (window).invoke = invoke
  const deviceId = await invoke('get_machine_uid')
  const tid1 = await invoke('plugin:webdriver|launch')
  const tid2 = await invoke('plugin:webdriver|new_tab', {
    url: 'https://www.hao123.com',
  })
  const tid3 = await invoke('plugin:webdriver|new_tab', {
    url: 'https://www.2345.com',
  })
  setInterval(() => {
    invoke('plugin:webdriver|get_tab_content', {
      tid: tid1,
    }).then((json) => {
      if (json.data === '')
        console.log('1', json)
    }).catch((error) => {
      console.error('1 err', error)
    })
    invoke('plugin:webdriver|get_tab_content', {
      tid: tid2,
    }).then((json) => {
      // if (json.data === '')
      console.log('2', json)
    }).catch((error) => {
      console.error('2 err', error)
    })
    invoke('plugin:webdriver|get_tab_content', {
      tid: tid3,
    }).then((json) => {
      if (json.data === '')
        console.log('3', json)
    }).catch((error) => {
      console.error('3 err', error)
    })
    // invoke<string>('plugin:webdriver|reload', {
    //   tid: firstTid,
    // })
    // invoke<string>('plugin:webdriver|reload', {
    //   tid: secondTid,
    // })
  }, 200)
}