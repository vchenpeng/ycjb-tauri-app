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


async function doIt () {
  let targets = await browser.value.send({
    "method": "Target.getTargets",
    "params": {
      "filter": [
        { type: "browser", exclude: true },
        { type: 'background_page', exclude: true },
        { type: 'iframe', exclude: true },
        { type: "page", exclude: false }
      ]
    }
  })
  let processInfo = await browser.value.send({
    "method": "SystemInfo.getProcessInfo"
  })
  let sysInfo = await browser.value.send({
    "method": "SystemInfo.getInfo"
  })
  leftTableData.forEach(async target => {
    // browser.value.reload(target.targetId)
    // console.log('load', target.sessionId)
    await browser.value.send({
      "method": "Page.reload",
      "sessionId": target.sessionId,
    })
    let doc = await browser.value.send({
      "method": "DOM.getDocument",
      "sessionId": target.sessionId,
      "params": {
        "url": 'http://npmjs.com'
      }
    })
    console.log('doc', doc)
  })
  // console.log(targets, processInfo, sysInfo)
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


let leftTableData = reactive([])
let rightTableData = ref([
  { id: 10001, host: 'www.baidu.com', keyword: '测试', audio: 'Man', text: 28, refresh: '1s', status: '刷新中', timer: '10' },
  { id: 10001, host: 'www.baidu.com', keyword: '测试2', audio: 'Man', text: 28, refresh: '1s', status: '刷新中', timer: '10' }
])

const menuConfig = reactive({
  className: 'my-menus',
  body: {
    options: [
      [
        { code: 'copy', name: '添加', prefixIcon: 'vxe-icon-add', className: 'my-copy-item' },
        { code: 'edit', name: '修改', prefixIcon: 'vxe-icon-edit', className: 'my-copy-item' }
      ],
      [
        { code: 'remove', name: '删除', prefixIcon: 'vxe-icon-delete-fill color-red' }
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
let browser = ref(null)
let leftTable = ref(null)
let status = computed(() => browser.value?.status)
let queryTargetsTimer
let wsStatus = null

async function launch () {
  try {
    clearInterval(queryTargetsTimer)
    let force = browser.value === null ? false : true
    let [pid, tid, port, status] = await webdriver.launch(force)
    console.log('浏览器实例', browser, pid, tid, port, status)
    browser.value = await webdriver.connect(port)
    wsStatus = 1
    browser.value.on('close', async (...args) => {
      console.log('ws连接关闭', args)
      // leftTableData = []
      wsStatus = 0
    })
    browser.value.on('Target.targetCreated', async ({ method, params }) => {



      if (method === 'Target.targetDestroyed') {
        let targetIndex = leftTableData.findIndex(x => x.targetId === params.targetId)
        if (targetIndex >= 0) {
          leftTableData.splice(targetIndex, 1)
        }
      } else {
        let targetInfo = params?.targetInfo
        let uri = SDK.utils.parseUrl(targetInfo.url)
        if (targetInfo?.type === 'page' && uri.valid) {
          let targetIndex = leftTableData.findIndex(x => x.targetId === targetInfo.targetId)


          console.log(method, targetInfo, targetIndex, uri)
          if (targetIndex >= 0) {
            leftTableData.splice(targetIndex, 1, {
              ...targetInfo,
              host: uri.host,

            })
            // console.log('update', targetInfo, leftTableData.value)
          } else {
            leftTableData.push({
              ...targetInfo,
              host: uri.host,

            })
          }
          browser.value.send({
            "method": "Target.attachToTarget",
            "params": {
              "targetId": targetInfo.targetId,
              "flatten": true,
            }
          }).then(({ result: { sessionId } }) => {
            let curIndex = leftTableData.findIndex(x => x.targetId === targetInfo.targetId)
            if (curIndex >= 0) {
              leftTableData[curIndex].sessionId = sessionId
            }
          })
        }
      }
      leftTable.value.reloadData(leftTableData)
      // console.log('Target.targetCreated', sessionId)
    })

    setInterval(async () => {
      if (wsStatus === 0) {
        console.log('尝试重连')
        browser.value = await webdriver.connect(port).catch((error) => {
          console.log('ws重新连接失败', error)
        })
        wsStatus = 1
        let json = await getTargets()
        console.log('new json', json)
      }
    }, 1000)
    // browser.value.on('Target.attachedToTarget', (params) => {
    //   let sessionId = params.sessionId
    //   // let a = params.targetInfo
    //   browser.value.send({
    //     "method": "Target.attachToTarget",
    //     "params": {
    //       "targetId": json.parmas.targetInfo.targetId,
    //       "flatten": true,
    //     }
    //   })
    // })
    // let newTabTid = await browser.value.newTab('https://www.baidu.com')
    // console.log('newTabTid', newTabTid)
    queryTargetsTimer = setInterval(async () => {
      let json = await getTargets()
      leftTableData = SDK._.chain(json.result.targetInfos || []).map(item => {
        let uri = SDK.utils.parseUrl(item.url)
        return {
          ...item,
          uri: uri
        }
      }).filter(item => {
        return item.uri.valid
      }).map(item => {
        return {
          host: item.uri.host
        }
      }).uniqBy('host').value()
      // console.log(now, leftTableData)
    }, 50000000)
  }
  catch (error) {
    console.error(error)
  }
}
// 打开浏览器
async function handleOpenBrowser () {
  // 检测是否启动过浏览器，同时ws连接正常
  launch()
}

function handleOpenUrl () {
  window.open('https://www.ycjinbiao.com/', null)
}

// 获取正在检测的targets
function getTargets () {
  return browser.value.send({
    "method": "Target.getTargets",
    "params": {
      "filter": [
        { type: "browser", exclude: true },
        { type: "tab", exclude: false }
      ]
    }
  })
}

let aboutVisible = ref(false)
function handleShowAbout () {
  aboutVisible.value = true
}

onMounted(() => {
  // 加载配置项
})

onBeforeUnmount(() => {

})
onUnmounted(() => {

})

</script>

<template>
  <SwitchTheme></SwitchTheme>

  <div>
    <!-- <img src="../assets/banner.png" alt="" srcset=""> -->
  </div>
  <div class="nav-container">
    <div class="nav-btns-container">
      <vxe-button class="nav-wrap" type="text" :disabled="true">
        <img src="../assets/添加.png" alt="" srcset="">
        <span>添加</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text" :disabled="true">
        <img src="../assets/修改.png" alt="" srcset="">
        <span>修改</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text">
        <img src="../assets/删除.png" alt="" srcset="">
        <span>删除</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text" @click="handleOpenBrowser">
        <img src="../assets/启动浏览器.png" alt="" srcset="">
        <span>启动浏览器</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text" @click="doIt">
        <img src="../assets/开始监控.png" alt="" srcset="">
        <span>开始{{ status }}</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text">
        <img src="../assets/暂停.png" alt="" srcset="">
        <span>暂停</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text">
        <img src="../assets/停止.png" alt="" srcset="">
        <span>停止</span>
      </vxe-button>
      <vxe-button class="nav-wrap" type="text" @click="handleShowAbout">
        <img src="../assets/关于.png" alt="" srcset="">
        <span>关于</span>
      </vxe-button>
    </div>
    <div class="nav-timer">
      <span>00秒</span>
    </div>
  </div>
  <!-- {{ leftTableData }} -->
  <div class="table-container">
    <div class="left-table-container">
      <vxe-table ref="leftTable" height="396" :keep-source="false" stripe :data="leftTableData" size="mini" @menu-click="contextMenuClickEvent">
        <vxe-column field="host" title="监控中的域名" v-slot="{ row }">
          {{ row.host }}({{ row.title }})
        </vxe-column>
      </vxe-table>
    </div>
    <div class="right-table-container">
      <vxe-table height="396" :data="rightTableData" :row-config="{isCurrent: true, isHover: true}" size="mini" :footer-method="footerMethod" :menu-config="menuConfig"
        @menu-click="contextMenuClickEvent">
        <vxe-column type="checkbox" title="" width="40"></vxe-column>
        <vxe-column field="host" title="监控页面" show-overflow></vxe-column>
        <vxe-column field="keyword" title="监控关键词"></vxe-column>
        <vxe-column field="audio" title="声音文件"></vxe-column>
        <vxe-column field="text" title="字幕文本" show-overflow></vxe-column>
        <vxe-column field="refresh" title="刷新频率" width="80" show-overflow></vxe-column>
        <vxe-column field="status" title="状态" width="80" show-overflow></vxe-column>
        <vxe-column field="timer" title="倒计时" width="80" show-overflow></vxe-column>
      </vxe-table>
    </div>
  </div>
  <vxe-modal v-model="aboutVisible" :maskClosable="true" :show-close="false" width="550">
    <template #title>
      <span>关于</span>
    </template>
    <template #corner>
      <!-- <vxe-icon name="bell-fill"></vxe-icon> -->
      <!-- <vxe-icon name="minus"></vxe-icon> -->
      <vxe-button type="text" status="primary" content="访问官网" @click="handleOpenUrl"></vxe-button>
    </template>
    <template #default>
      <img src="../assets/关于软件.png" alt="" srcset="">
    </template>
    <template #footer>
      <vxe-button @click="cancelEvent">关闭</vxe-button>
      <vxe-button @click="cancelEvent">官网地址</vxe-button>
      <vxe-button status="primary" @click="confirmEvent">确定</vxe-button>
    </template>
  </vxe-modal>
</template>

<style lang="scss" scoped>
.nav-container {
  display: flex;
  flex-direction: row;
  background-color: rgb(240, 248, 255);
  user-select: none;
  cursor: default;
  .nav-btns-container {
    display: flex;
    flex-direction: row;
    padding: 5px;
    flex: 1;
    .nav-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 10px 6px 10px;
      border: 1px solid transparent;
      margin: 0 2px;
      border-radius: 6px;
      box-sizing: border-box;
      :deep() {
        .vxe-button--content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      }
      img {
        width: 50px;
        // height: 50px;
      }
      span {
        font-size: 10px;
        font-weight: 400;
        margin-top: 6px;
        line-height: 1;
      }
      &:hover {
        border: 1px solid rgba(96, 98, 102, 0.3);
        box-sizing: content-box;
        cursor: default;
        span {
          color: rgb(96, 98, 102);
        }
      }
      &.is--disabled {
        border: 1px solid transparent;
        filter: grayscale(100%);
        span {
          color: inherit;
        }
      }
    }
  }
  .nav-timer {
    width: 200px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: rgba(240, 248, 255, 0.8);
  }
}
.table-container {
  display: flex;
  flex-direction: row;
  user-select: none;
  cursor: default;
  .left-table-container {
    width: 20%;
  }
  .right-table-container {
    flex: 1;
  }
}
</style>