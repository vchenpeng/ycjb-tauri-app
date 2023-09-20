<script setup>
import { ref, toRef, computed, getCurrentInstance, reactive, watch, onActivated, onBeforeUnmount, onMounted, onUnmounted, nextTick } from 'vue'
import { SDK } from '@/sdk'
import TheWelcome from '../components/TheWelcome.vue'
import service from '@/service'
import { useOrderStore } from '@/store/index'
import { usePlayer } from '@/hooks/usePlayer.js'
import { useOrder } from '@/hooks/useOrder.js'
import { useTheme } from '@/hooks/useTheme.js'
import { useVoicePacket } from '@/hooks/useVoicepacket.js'
import SwitchTheme from '@/components/SwitchTheme.vue'
import { webdriver } from '@/utils/index.js'
import WS from "@tauri-apps/plugin-websocket"

let ws
let idSeed = 0
async function runWs (url) {
  console.log('ws url ~~', url)
  ws = await WS.connect(url, {
    url: url,
    headers: []
  })
  console.log(ws)
  ws.addListener(function (res) {
    let isText = res['type'] === 'Text'
    if (isText) {
      console.log('log', JSON.parse(res.data))
    } else {
      console.error(res)
    }
  })
}

function doIt () {
  
  ws.send({
    type: 'Text',
    data: JSON.stringify({
      "id": idSeed++,
      "method": "Target.getTargets",
      "params": {
        "filter": [
          { type: "browser", exclude: true },
          { type: "tab", exclude: false }
        ]
      }
    })
  })
  ws.send({
    type: 'Text',
    data: JSON.stringify({
      "id": idSeed++,
      "method": "SystemInfo.getProcessInfo"
    })
  })
  // ws.send({
  //   type: 'Text',
  //   data: {
  //     "method": "Target.targetCreated",
  //     "params": {
  //       "targetInfo": {
  //         "targetId": "38555cfe-5ef3-44a5-a4e9-024ee6ebde5f",
  //         "type": "browser",
  //         "title": "",
  //         "url": "https://www.cnblogs.com", "attached": true
  //       }
  //     }
  //   }
  // })
  // ws.send({
  //   type: 'Text',
  //   data: {
  //     "method": "Target.targetCreated", "params": {
  //       "targetInfo": {
  //         "targetId": "52CA0FEA80FB0B98BCDB759E535B21E4",
  //         "type": "page", "title": "",
  //         "url": "about:blank",
  //         "attached": false,
  //         "browserContextId": "339D5F1CCABEFE8545E15F3C2FA5F505"
  //       }
  //     }
  //   }
  // })
}

const orderStore = useOrderStore()
const { theme } = useTheme()
const { doEnterOnce, startOrderTimer, stopOrderTimer } = useOrder()
const { locked, total, pools, current, hasBaffle, doPlay } = usePlayer()
const { queryRemoteVoicePacket, checkCurrentVoicePacket } = useVoicePacket()

const temlateType = computed(() => {
  return theme.value === 'light' ? '2' : '1'
})
const orderSignal = computed(() => orderStore.signal)
const mqText = computed(() => {
  return pools.value.map(x => {
    return x.pickUpGoodsNo === current.value?.pickUpGoodsNo ? `<span class="item green">${x.pickUpGoodsNo}</span>` : `<span class="item">${x.pickUpGoodsNo}</span>`
  }).join(' ')
})

let version = ref(SDK.version)
let sn = ref(null)

function querySN () {
  service.screen.checkSN({
    sn: '1234'
  }).then(({ code, data }) => {
    if (code === '100') {
      sn.value = data
    }
  })
}

function doStart () {
  return checkCurrentVoicePacket(0).then((pkg) => {
    if (pkg) {
      return pkg
    } else {
      return queryRemoteVoicePacket()
    }
  }).then(() => {
    return doEnterOnce()
  }).then(() => {
    doPlay()
  })
}

let html = ref(null)

let timer
async function doOpenBrowser () {
  clearInterval(timer)
  let [pid, tid, port] = await webdriver.launch()


  let tid2 = await webdriver.newTab('https://www.baidu.com')
  console.log('启动', pid, [tid, tid2], port)
  webdriver.getDebugWsUrl().then(async (ws) => {
    console.log('wsUrl', ws)
    runWs(ws)
    let config = await webdriver.getDebugConfig(port)
    console.log('config', config)
  })


  // timer = setInterval(() => {
  //   webdriver.getPageContent(tid).then((json) => {
  //     // html.value = json
  //     if (json.data === '' || !json.success) {
  //       console.log('2', json)
  //     }
  //   }).catch((error) => {
  //     console.error('1 err', error)
  //     html.value = error
  //   })
  //   webdriver.getPageContent(tid2).then((json) => {
  //     console.log('2', json)
  //   }).catch((error) => {
  //     console.error('1 err', error)
  //     html.value = error
  //   })
  //   // webdriver.reload(tid)
  //   // webdriver.reload(tid2)
  // }, 1000)
}

querySN()

// 监控是否存在新订单，如果有说明是播放中断之后，尝试唤醒（此方法不会触发播放器同一时刻多个号同时叫号的原则）
watch([orderSignal, total], ([w1, w2]) => {
  if (w1 && w2 === 0) {
    console.log('watch doEnterOnce')
    Promise.resolve().then(doEnterOnce).then(() => doPlay())
  }
})

onMounted(() => {
  // doStart()
  // startOrderTimer(6000)
})

onBeforeUnmount(() => {

})
onUnmounted(() => {
  stopOrderTimer()
})

</script>

<template>
  <SwitchTheme></SwitchTheme>

  <button @click="doOpenBrowser">开始打开窗口</button>
  <button @click="doIt">发WS</button>
  <div>{{ html }}</div>
  <div><input class="border-slate-600" type="text" v-focusable="true" /></div>
  <div><input class="border-slate-600" type="text" v-focusable="true" /></div>
  <div>
    <button @click="doPlay">开始</button>
  </div>
  <p class="name">{{version}},{{sn}}</p>
  <p>存在更多：{{orderSignal}}</p>
  <p>播放状态：{{locked}}</p>
  <p>存在挡板：{{ hasBaffle }}</p>
  <p>当前队列：{{total}}</p>
  <p>当前播报：{{current?.pickUpGoodsNo}}</p>
  <p>队列详情：</p>
  <p v-html="mqText" class="item"></p>

</template>

<style>
</style>