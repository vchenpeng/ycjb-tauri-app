import { invoke } from '@tauri-apps/api/tauri'
import WebSocket from "@tauri-apps/plugin-websocket"

let msgid = 0
function genMsgId () {
  return msgid++
}
export default class WebDriver {
  constructor(config) {
    this.config = config
  }
  static async launch (force =  false) {
    return invoke('plugin:webdriver|launch', { force }).then(info => {
      // let status = await invoke('plugin:webdriver|get_process_status', {
      //   pid: info.pid
      // })
      return info
    }).catch(() => {
      return Error('launch error')
    })
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
      if (name === 'close' && e === 'WebSocket protocol error: Connection reset without closing handshake') {
        this.status = 0
        event()
      } else {
        let isText = e['type'] === 'Text'
        isText ? event(JSON.parse(e.data)) : event(e)
      }
    })
  }
  async send (params = {}) {
    this.ws.send({
      type: 'Text',
      data: JSON.stringify({
        id: genMsgId(),
        ...params
      })
    })
  }
  async disconnect () {
    this.ws.disconnect()
  }
}