import { invoke } from '@tauri-apps/api/tauri'
import WebSocket from './websocket.js'
import { SDK } from '@/sdk'

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
  static connect (port) {
    return invoke('plugin:webdriver|get_debug_config', { port }).then(async (config) => {
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
      context.send({
        method: "Target.setDiscoverTargets",
        params: {
          discover: true
        }
      })
      context.addListener((e) => {
        let isText = e['type'] === 'Text'
        if (isText) {
          let { target: json, valid } = SDK.utils.tryParseJSON(e.data)
          console.log('json2', json)
          if (valid && context.tasks.has(json.id)) {
            const { resolve } = context.tasks.get(json.id)
            context.tasks.delete(json.id)
            resolve(json)
          }
        }
        // 清理1s前的任务队列
        context.tasks.forEach(({ timestamp }, key) => {
          if (+new Date() - timestamp > 5000) {
            context.tasks.delete(key)
          }
        })

      })
      return context
    })
  }
  reconnnect () {

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
      } else if (['Target.targetCreated', 'Target.targetInfoChanged', 'Target.targetDestroyed'].includes(name)) {
        let json = JSON.parse(e.data)
        if (['Target.targetCreated', 'Target.targetInfoChanged', 'Target.targetDestroyed'].includes(json.method)) {
          event(json)
        }
      }
      // Target.targetInfoChanged
    })
  }
  send (params = {}) {
    let json = {
      id: genMsgId(),
      ...params
    }
    let task = new Promise((resolve, reject) => {
      let timestamp = +new Date()
      this.tasks.set(json.id, { resolve, reject, json, timestamp })
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
  async newTab (url) {
    const tid = await invoke('plugin:webdriver|new_tab', {
      url: url
    })
    return tid
  }
  reload (tid) {
    return invoke('plugin:webdriver|reload', {
      tid: tid,
    })
  }
}