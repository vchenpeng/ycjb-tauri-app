<script setup>
import { ref, reactive, computed, getCurrentInstance, watch, onActivated, onBeforeUnmount, onMounted, onUnmounted, nextTick } from 'vue'
import { VXETable } from 'vxe-table'
import { SDK } from '@/sdk'
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
const tableData = ref([
  { id: 10001, name: 'Test1', role: 'Develop', sex: 'Man', age: 28, address: 'test abc' },
  { id: 10002, name: 'Test2', role: 'Test', sex: 'Women', age: 22, address: 'Guangzhou' },
  { id: 10003, name: 'Test3', role: 'PM', sex: 'Man', age: 32, address: 'Shanghai' },
  { id: 10004, name: 'Test4', role: 'Designer', sex: 'Women', age: 23, address: 'test abc' },
  { id: 10005, name: 'Test5', role: 'Develop', sex: 'Women', age: 30, address: 'Shanghai' },
  { id: 10006, name: 'Test6', role: 'Designer', sex: 'Women', age: 21, address: 'test abc' },
  { id: 10007, name: 'Test7', role: 'Test', sex: 'Man', age: 29, address: 'test abc' },
  { id: 10008, name: 'Test8', role: 'Develop', sex: 'Man', age: 35, address: 'test abc' },
  { id: 10009, name: 'Test9', role: 'Test', sex: 'Man', age: 26, address: 'test abc' },
  { id: 10010, name: 'Test10', role: 'Develop', sex: 'Man', age: 38, address: 'test abc' },
  { id: 10011, name: 'Test11', role: 'Test', sex: 'Women', age: 29, address: 'test abc' },
  { id: 10012, name: 'Test12', role: 'Develop', sex: 'Man', age: 27, address: 'test abc' },
  { id: 10013, name: 'Test13', role: 'Test', sex: 'Women', age: 24, address: 'test abc' },
  { id: 10014, name: 'Test14', role: 'Develop', sex: 'Man', age: 34, address: 'test abc' },
  { id: 10015, name: 'Test15', role: 'Test', sex: 'Man', age: 21, address: 'test abc' },
  { id: 10016, name: 'Test16', role: 'Develop', sex: 'Women', age: 20, address: 'test abc' },
  { id: 10017, name: 'Test17', role: 'Test', sex: 'Man', age: 31, address: 'test abc' },
  { id: 10018, name: 'Test18', role: 'Develop', sex: 'Women', age: 32, address: 'test abc' },
  { id: 10019, name: 'Test19', role: 'Test', sex: 'Man', age: 37, address: 'test abc' },
  { id: 10020, name: 'Test20', role: 'Develop', sex: 'Man', age: 41, address: 'test abc' }
])

const menuConfig = reactive({
  className: 'my-menus',
  header: {
    options: [
      [
        { code: 'exportAll', name: '导出所有.csv' }
      ]
    ]
  },
  body: {
    options: [
      [
        { code: 'copy', name: '复制', prefixIcon: 'vxe-icon-copy', className: 'my-copy-item' }
      ],
      [
        { code: 'remove', name: '删除', prefixIcon: 'vxe-icon-delete-fill color-red' },
        {
          name: '筛选',
          children: [
            { code: 'clearFilter', name: '清除筛选' },
            { code: 'filterSelect', name: '按所选单元格的值筛选' }
          ]
        },
        {
          code: 'sort',
          name: '排序',
          prefixIcon: 'vxe-icon-sort color-blue',
          children: [
            { code: 'clearSort', name: '清除排序' },
            { code: 'sortAsc', name: '升序', prefixIcon: 'vxe-icon-sort-alpha-asc color-orange' },
            { code: 'sortDesc', name: '倒序', prefixIcon: 'vxe-icon-sort-alpha-desc color-orange' }
          ]
        },
        { code: 'print', name: '打印', disabled: true }
      ]
    ]
  },
  footer: {
    options: [
      [
        { code: 'clearAll', name: '清空数据' }
      ]
    ]
  }
})

const contextMenuClickEvent = ({ menu, row, column }) => {
  switch (menu.code) {
    case 'copy':
      // 示例
      if (row && column) {
        if (XEClipboard.copy(row[column.field])) {
          VXETable.modal.message({ content: '已复制到剪贴板！', status: 'success' })
        }
      }
      break
    default:
      VXETable.modal.alert(`点击了 ${menu.name} 选项`)
  }
}
const meanNum = (list, field) => {
  let count = 0
  list.forEach(item => {
    count += Number(item[field])
  })
  return count / list.length
}
const footerMethod = ({ columns, data }) => {
  return [
    columns.map((column, columnIndex) => {
      if (columnIndex === 0) {
        return '平均'
      }
      if (['age', 'rate'].includes(column.field)) {
        return meanNum(data, column.field)
      }
      return null
    })
  ]
}

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
  webdriver.getDebugConfig(port).then(async (res) => {
    let wsUrl = res.webSocketDebuggerUrl
    console.log('wsUrl', wsUrl)
    runWs(wsUrl)
    // let config = await webdriver.getDebugConfig(port)
    // console.log('config', config)
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

  <div>
    <vxe-table border height="400" :data="tableData" size="mini" :footer-method="footerMethod" :menu-config="menuConfig" @menu-click="contextMenuClickEvent">
      <vxe-column type="seq" width="60"></vxe-column>
      <vxe-column field="name" title="Name"></vxe-column>
      <vxe-column field="sex" title="Sex"></vxe-column>
      <vxe-column field="age" title="Age"></vxe-column>
      <vxe-column field="address" title="Address" show-overflow></vxe-column>
    </vxe-table>
  </div>
</template>

<style>
</style>