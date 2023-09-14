import { SDK } from '@/sdk'

const delayClearKeys = SDK._.throttle(function () {
  if (!['prod'].includes(this.__ENV__)) {
    let text = this.keys.join('')
    if (text === '37383940' || text === '14111213') {
      if (this.vConsole) {
        this.vConsole.compInstance.showSwitchButton = !this.vConsole.compInstance.showSwitchButton
      } else {
        this.genVConsole()
      }
    } else if (this.vConsole && (text === '37393739' || text === '14121412')) {
      if (this.vConsole.compInstance.show) {
        this.vConsole.hide()
      } else {
        this.vConsole.show()
      }
    } else if (text === '40404040' || text === '13131313') {
      window.location.reload()
    } else if (text === '38383838' || text === '11111111') {
      console.log('手动触发播放')
    }
    this.keys = []
  }
}, 3000)
class Debuger {
  constructor(options) {
    this.vConsole = null
    this.__ENV__ = options.env || 'prod'
    this.keys = []
    this.appendVConsole(() => {
      if (options.auto) {
        this.genVConsole()
      }
    })
  }
  get delayClearKeys () {
    return delayClearKeys
  }
  recordKey (key) {
    this.keys.push(key)
  }
  appendVConsole (callback) {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    // script.src = 'https://unpkg.com/vconsole/dist/vconsole.min.js';
    script.src = 'https://cdn.bootcdn.net/ajax/libs/vConsole/3.15.0/vconsole.min.js'
    script.onload = callback
    document.getElementsByTagName('head')[0].appendChild(script)
  }
  genVConsole () {
    // eslint-disable-next-line no-undef
    this.vConsole = this.vConsole || new VConsole({
      log: {
        maxLogNumber: 200
      },
      network: {
        maxNetworkNumber: 50
      }
    })
    console.log('地址', window.location.href)
    console.log('支持AudioContext', !!window.AudioContext)
  }
  showVConsole () {
    this.vConsole.show()
  }
  hideVConsole () {
    this.vConsole.hide()
  }
  clearConsole () {
    console.clear()
  }
}

export default function setupDebuger () {
  const debuger = new Debuger({
    env: import.meta.env.VITE_APP_ENV,
    auto: import.meta.env.PROD === true && ['dev', 'qa', 'pre'].includes(import.meta.env.VITE_APP_ENV)
  })
  window.addEventListener('keydown', function (e) {
    debuger.delayClearKeys()
    debuger.recordKey(e.keyCode)
  })
  window.listenerKey = function (key) {
    // 遥控器按键对应关系 1 ok 2 menu 3 back 11 up 12 right 13 down 14 left
    debuger.delayClearKeys()
    debuger.recordKey(key)
  }
}