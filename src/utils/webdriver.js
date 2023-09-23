import { invoke } from '@tauri-apps/api/tauri'
import WebSocket from "@tauri-apps/plugin-websocket"

let msgid = 0
function genMsgId () {
  return msgid++
}
export default class WebDriver {
  constructor(config) {
    this.config = config
    this.tasks = new Map()
  }
  static async launch (force = false) {
    return invoke('plugin:webdriver|launch', { force }).then(info => {
      // let status = await invoke('plugin:webdriver|get_process_status', {
      //   pid: info.pid
      // })
      return info
    }).catch(() => {
      return Error('launch error')
    })
  }
  static async getProcessStatus (pid) {
    let status = await invoke('plugin:webdriver|get_process_status', {
      pid: pid
    })
    return status
  }
  static async connect (port) {
    return await invoke('plugin:webdriver|get_debug_config', {
      port
    }).then(async (config) => {
      let ws = await WebSocket.connect(config.web_socket_debugger_url, {
        headers: []
      })
      return { config, ws }
    }).then(({ config, ws }) => {
      let context = new WebDriver({
        status: 1,
        port: port,
        web_socket_debugger_url: config.web_socket_debugger_url
      })
      context.ws = ws
      context.status = 1
      return context
    }).then((context) => {
      context.addListener((e) => {
        let isText = e['type'] === 'Text'
        if (isText) {
          let json = JSON.parse(e.data)
          if (context.tasks.has(json.id)) {
            const { resolve } = context.tasks.get(json.id)
            context.tasks.delete(json.id)
            resolve(json)
          }
        }
      })
      return context
    })
  }
  addListener (cb) {
    this.ws.addListener(cb)
  }
  updateWsStatus (status) {
    this.status = status
  }
  on (name, event) {
    this.ws.addListener((e) => {
      if (name === 'close') {
        if (e === 'WebSocket protocol error: Connection reset without closing handshake') {
          this.status = 0
          event()
        }
      }
    })
  }
  send (params = {}) {
    let json = {
      id: genMsgId(),
      ...params
    }
    let task = new Promise((resolve, reject) => {
      this.tasks.set(json.id, { resolve, reject, json })
    })
    this.ws.send({
      type: 'Text',
      data: JSON.stringify(json)
    })
    return task
  }
  async disconnect () {
    this.ws.disconnect()
  }
}