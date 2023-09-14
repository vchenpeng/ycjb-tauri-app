import { ref, computed, toRef, nextTick, onUnmounted, onMounted, toRefs } from 'vue'
import { SDK } from '@/sdk'
import { useVoicePacketStoreWithout, useOrderStoreWithout, usePlayerStoreWithout } from '@/store/index'
import { screen as screenDB } from '@/dexie/index.js'
import player from '@/utils/player'

export function usePlayer () {
  const voicePacketStore = useVoicePacketStoreWithout()
  const orderStore = useOrderStoreWithout()
  const playerStore = usePlayerStoreWithout()
  const pkg = computed(() => voicePacketStore.pkg)
  const isSupportWebAudio = player.isSupportWebAudio
  const locked = toRef(player, 'locked')
  const pools = computed(() => orderStore.orders)
  const total = computed(() => orderStore.totalCount)
  const signal = computed(() => orderStore.signal)
  const current = ref(null)
  const { hasBaffle } = toRefs(playerStore)

  function playAudio (units = [], options) {
    let list = units.map(x => {
      return {
        file: pkg.value.pkg[x],
        howl: null
      }
    })
    let instance = player.init(list, options)
    instance.start()
    return instance
  }
  async function doPlay (times = 0) {
    // 人为的播报挡板(进入页面则永远true，离开页面为false)
    if (hasBaffle.value) {
      console.log('触发挡板')
      return
    }
    const last = SDK._.last(pools.value)
    if (last) {
      current.value = last
      // console.log(`[${last.pickUpGoodsNo}] start`)
      const chars = ['qing', ...last.pickUpGoodsNo.split(''), 'qucan']
      playAudio(chars, {
        interval: isSupportWebAudio ? 150 : 0,
        endInterval: 1500,
        timeout: 15000,
        onstart () {
          // console.log('start', last, player.locked, SDK.dayjs().format('YYYY-MM-DD HH:mm:ss'))
        },
        onsuccess: function () {
          current.value = null
          // console.log('end', last, player.locked, SDK.dayjs().format('YYYY-MM-DD HH:mm:ss'))
          updateOrder(last, times + 1).then(() => {
            return wait(1500)
          }).finally(() => {
            doPlay()
          })
        },
        ontimeout: function () {
          current.value = null
          // 超时后存储进DB，同时重新叫号，一直出错超时1+2次，跳过此号码
          if (times + 1 > 2) {
            updateOrder(last, times + 1).finally(() => {
              console.log(`[${last.pickUpGoodsNo}] timeout removed`)
              doPlay()
            })
          } else {
            console.log(`[${last.pickUpGoodsNo}] timeout retrys ${times + 1}`)
            doPlay(times + 1)
          }
        }
      })
    }
  }

  function push (item) {
    pools.value.push(item)
    doPlay()
  }
  function unshift (item) {
    pools.value.unshift(item)
    doPlay()
  }

  function updateOrder (item, times = 1) {
    let obj = {
      ...item,
      playTimes: item.playTimes + times,
      updateTime: +new Date()
    }
    return screenDB.put(obj).then(() => {
      orderStore.remove(obj)
    }).then(() => {
      // 有新订单进入队列(注意:必须在叫号间隔时去更新队列，否则会出现重复叫号)
      if (signal.value) {
        return screenDB.getUnplayOrder()
      } else {
        return Promise.resolve(orderStore.orders)
      }
    }).then((list) => {
      if (signal.value) {
        orderStore.init(list)
        console.log('更新待取餐队列完毕')
      }
    })
  }

  function wait (time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, time)
    })
  }

  onUnmounted(() => {
    playerStore.changeBaffleStatus(true)
  })

  playerStore.changeBaffleStatus(false)

  return { player, locked, total, pools, current, hasBaffle, push, unshift, doPlay }
}