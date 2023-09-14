import { SDK } from '@/sdk'
import { useOrderStoreWithout } from '@/store/index'
import { screen as db, voicepacket as voiceDB } from '@/dexie/index.js'

export default function main () {
  let { signal, init, switchSignal } = useOrderStoreWithout()
  let timer = null
  // TODO取出db内满足条件的所有
  function fetchRemoteOrders () {
    let now = +new Date()
    let list = [{
      orderCode: SDK.utils.newGuid(),
      // orderCode: '5058204D-0110-4E23-AE2A-9DC4720F6A4E',
      pickUpGoodsNo: `${SDK.dayjs().format('mmss')}`,
      orderClient: 1,
      orderType: 1,
      acceptTime: null,
      pickUpTime: null,
      playTimes: 0,
      createTime: now,
      updateTime: null
    }, {
      // orderCode: SDK.utils.newGuid(),
      orderCode: '697AC4B4-3CB2-452A-93D6-3BFE9865F545',
      pickUpGoodsNo: `B${SDK.dayjs().format('mmss')}`,
      orderClient: 1,
      orderType: 1,
      acceptTime: null,
      pickUpTime: null,
      playTimes: 0,
      createTime: now,
      updateTime: null
    }]
    let ss = SDK.dayjs().format('ss')
    if (+ss >= 15 && +ss <= 45 && false) {
      list = [{
        // orderCode: SDK.utils.newGuid(),
        orderCode: '697AC4B4-3CB2-452A-93D6-3BFE9865F545',
        pickUpGoodsNo: `X${SDK.dayjs().format('mmss')}`,
        orderClient: 1,
        orderType: 1,
        acceptTime: null,
        pickUpTime: null,
        playTimes: 0,
        createTime: now,
        updateTime: null
      }]
    }
    let allCount = list.length
    // orderCode,pickUpGoodsNo,orderClient,orderType,acceptTime,pickUpTime,playTimes,createTime,updateTime
    if (allCount > 0) {
      db.bulkAdd(list).then(() => {
        // 判断有更新的数据
        // console.log(`需要更新了, (${allCount})`)
        if (!signal) {
          switchSignal(true)
        }
        // let list = await db.getUnplayOrder()
        // init(list)
      }).catch((err) => {
        let errorCount = err.failures.length
        let successCount = allCount - errorCount
        if (successCount > 0) {
          console.log(`拉取到更新, (${successCount}/${allCount})`)
          if (!signal) {
            switchSignal(true)
          }
        } else {
          // console.log('无需更新')
        }
      })
    }
  }

  function doEnterOnce () {

    return db.getUnplayOrder().then(res => {
      return init(res)
    })
  }

  // 启动订单定时器
  function startOrderTimer (period = 4500) {
    let now = SDK.dayjs().format('YYYY-MM-DD HH:mm:ss')
    console.log(`启动时间：${now}`)
    timer = setTimeout(() => {
      fetchRemoteOrders()
      let t = SDK._.random(3 * 1000, 20 * 1000)
      console.log(`下次随机启动延迟:${t}`)
      startOrderTimer(t)
    }, period)
  }

  function stopOrderTimer () {
    clearInterval(timer)
  }

  return { signal, doEnterOnce, startOrderTimer, stopOrderTimer }
}

console.log(self)
debugger
self.addEventListener('message', function (e) {
  self.postMessage('You said: ' + e.data)
}, false)