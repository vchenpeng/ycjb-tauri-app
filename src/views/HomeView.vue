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

querySN()

// 监控是否存在新订单，如果有说明是播放中断之后，尝试唤醒（此方法不会触发播放器同一时刻多个号同时叫号的原则）
watch([orderSignal, total], ([w1, w2]) => {
  if (w1 && w2 === 0) {
    console.log('watch doEnterOnce')
    Promise.resolve().then(doEnterOnce).then(() => doPlay())
  }
})

onMounted(() => {
  doStart()
  startOrderTimer(6000)
})

onBeforeUnmount(() => {

})
onUnmounted(() => {
  stopOrderTimer()
})

</script>

<template>
  <div class="temlate1" v-show="temlateType == 1">
    <div class="temlate1-left">
      <img class="preparing-1" src="https://caiyuandao-cdn.sandload.cn/preparing-1.png" />
      <!-- <div class="temlate1-left-zh">准 备 中</div>
        <div class="temlate1-left-en">PREPARING</div> -->
      <div class="wait" v-if="orderInfos && orderInfos.cookingData.length > 0">
        <div class="wait-left">
          <div class="wait-item" v-for="(item,index) in orderInfos.cookingData" :key="index" v-if="index < 6">
            {{orderClientArr.includes(item.orderClient) ? ''
              :orderClientObj[item.orderClient]}}{{item.pickUpGoodsNo}}</div>
        </div>
        <div class="wait-right">
          <div class="wait-item" v-for="(item,index) in orderInfos.cookingData" :key="index" v-if="index >= 6">
            {{orderClientArr.includes(item.orderClient) ? ''
              :orderClientObj[item.orderClient]}}{{item.pickUpGoodsNo}}</div>
        </div>
      </div>
    </div>
    <div class="temlate1-right">
      <img class="wait-1" src="https://caiyuandao-cdn.sandload.cn/waiting-1.png" />
      <!-- <div class="temlate1-right-zh">请 取 餐</div>
        <div class="temlate1-right-en">TAKE</div> -->
      <div class="take" v-if="orderInfos && orderInfos.waitingPickupData.length > 0">
        <div class="take-l">
          <div class="take-item" v-for="(item,index) in orderInfos.waitingPickupData" :key="index" v-if="index < 6">
            {{orderClientArr.includes(item.orderClient) ? '':
              orderClientObj[item.orderClient]}}{{item.pickUpGoodsNo}}</div>
        </div>
        <div class="take-m">
          <div class="take-item" v-for="(item,index) in orderInfos.waitingPickupData" :key="index" v-if="index >= 6 && index < 12">
            {{orderClientArr.includes(item.orderClient) ? '':
              orderClientObj[item.orderClient]}}{{item.pickUpGoodsNo}}</div>
        </div>
        <div class="take-r">
          <div class="take-item" v-for="(item,index) in orderInfos.waitingPickupData" :key="index" v-if="index >= 12">
            {{orderClientArr.includes(item.orderClient) ? '':
              orderClientObj[item.orderClient]}}{{item.pickUpGoodsNo}}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="temlate2" v-show="temlateType == 2">
    <div class="temlate2-left">
      <img class="preparing-2" src="https://caiyuandao-cdn.sandload.cn/preparing-2.png" />
      <!-- <div class="temlate2-left-title">准 备 中 <span>PREPARING</span></div> -->
      <div class="temlate2-box" v-if="orderInfos && orderInfos.cookingData.length > 0">
        <div class="temlate2-left-box">
          <div class="temlate2-left-item" v-for="(item,index) in orderInfos.cookingData" :key="index" v-if="index < 6">
            <img class="right-icon" :src="orderClientArr.includes(item.orderClient) ? orderTypeGImg[item.orderType] : orderClientGImg[item.orderClient]" />
            <div class="left-text">{{item.pickUpGoodsNo}}</div>
          </div>
        </div>
        <div class="temlate2-right-box" v-if="orderInfos && orderInfos.cookingData.length > 0">
          <div class="temlate2-left-item" v-for="(item,index) in orderInfos.cookingData" :key="index" v-if="index >= 6">
            <img class="right-icon" :src="orderClientArr.includes(item.orderClient) ? orderTypeGImg[item.orderType] : orderClientGImg[item.orderClient]" />
            <div class="left-text">{{item.pickUpGoodsNo}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="temlate2-right">
      <img class="waiting-2" src="https://caiyuandao-cdn.sandload.cn/waiting-2.png" />
      <!-- <div class="temlate2-left-title">请 取 餐 <span>TAKE</span></div> -->
      <div class="temlate2-box" v-if="orderInfos && orderInfos.waitingPickupData.length > 0">
        <div class="temlate2-left-box">
          <div class="temlate2-left-item" v-for="(item,index) in orderInfos.waitingPickupData" :key="index" v-if="index < 6">
            <img class="right-icon" :src="orderClientArr.includes(item.orderClient) ? orderTypeYImg[item.orderType] : orderClientYImg[item.orderClient]" />
            <div class="left-text right-text">{{item.pickUpGoodsNo}}</div>
          </div>
        </div>
        <div class="temlate2-right-box" v-if="orderInfos && orderInfos.waitingPickupData.length > 0">
          <div class="temlate2-left-item" v-for="(item,index) in orderInfos.waitingPickupData" :key="index" v-if="index >= 6 && index < 12">
            <img class="right-icon" :src="orderClientArr.includes(item.orderClient) ? orderTypeYImg[item.orderType] : orderClientYImg[item.orderClient]" />
            <div class="left-text right-text">{{item.pickUpGoodsNo}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <SwitchTheme></SwitchTheme>
  <Teleport to="#custom2" v-if="false">
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
  </Teleport>
</template>

<style>



.temlate1 {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.temlate1-left {
  width: 7.2rem /* 720px -> 7.2rem */;
  height: 100vh;
  background: #1b1b1b;
  padding-top: 0.68rem /* 68px -> .68rem */;
  box-sizing: border-box;
}

.temlate1-left-zh {
  width: 100%;
  height: 0.88rem /* 88px -> .88rem */;
  font-size: 0.6rem /* 60px -> .6rem */;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #ffffff;
  line-height: 0.88rem /* 88px -> .88rem */;
  text-align: center;
}

.temlate1-left-en {
  width: 100%;
  height: 0.54rem /* 54px -> .54rem */;
  font-size: 0.36rem /* 36px -> .36rem */;
  font-family: SourceHanSansCN-Light, SourceHanSansCN;
  font-weight: 300;
  color: #ffffff;
  line-height: 0.54rem /* 54px -> .54rem */;
  margin-bottom: 0.9rem /* 90px -> .9rem */;
  text-align: center;
}

.preparing-1 {
  width: 2.625rem /* 262.5px -> 2.625rem */;
  height: 1.4125rem /* 141.25px -> 1.4125rem */;
  display: block;
  margin: 0 auto 0.9rem /* 90px -> .9rem */;
}

.wait {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 0.96rem /* 96px -> .96rem */ 0 1rem /* 100px -> 1rem */;
}

.wait-left {
  flex-shrink: 1;
  width: 61.64%;
}

.wait-right {
  flex-shrink: 1;
  width: 38.36%;
}

.wait-item {
  width: 2.01rem /* 201px -> 2.01rem */;
  height: 0.72rem /* 72px -> .72rem */;
  font-size: 0.6rem /* 60px -> .6rem */;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #ffffff;
  line-height: 0.71rem /* 71px -> .71rem */;
  margin-bottom: 0.48rem /* 48px -> .48rem */;
}

.wait-item:last-child {
  margin-bottom: 0;
}

.temlate1-right {
  width: 12rem /* 1200px -> 12rem */;
  height: 100vh;
  background: #000;
  padding-top: 0.68rem /* 68px -> .68rem */;
  box-sizing: border-box;
}

.temlate1-right-zh {
  width: 100%;
  height: 0.88rem /* 88px -> .88rem */;
  font-size: 0.6rem /* 60px -> .6rem */;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #ffaa00;
  line-height: 0.88rem /* 88px -> .88rem */;
  text-align: center;
}

.temlate1-right-en {
  width: 100%;
  height: 0.54rem /* 54px -> .54rem */;
  font-size: 0.36rem /* 36px -> .36rem */;
  font-family: SourceHanSansCN-Light, SourceHanSansCN;
  font-weight: 300;
  color: #ffaa00;
  line-height: 0.54rem /* 54px -> .54rem */;
  margin-bottom: 0.42rem /* 42px -> .42rem */;
  text-align: center;
}

.wait-1 {
  width: 2.63rem /* 263px -> 2.63rem */;
  height: 1.4125rem /* 141.25px -> 1.4125rem */;
  display: block;
  margin: 0 auto 0.42rem /* 42px -> .42rem */;
}

.take {
  width: 100%;
  display: flex;
}

.take-l,
.take-m,
.take-r {
  flex-shrink: 1;
  width: 33.33%;
}

.take-item {
  width: 2.01rem /* 201px -> 2.01rem */;
  height: 0.72rem /* 72px -> .72rem */;
  font-size: 0.6rem /* 60px -> .6rem */;
  text-align: left;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #ffffff;
  line-height: 0.72rem /* 72px -> .72rem */;
  margin: 0.48rem /* 48px -> .48rem */ auto 0;
}

.temlate2 {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.temlate2-left,
.temlate2-right {
  width: 7.42rem /* 742px -> 7.42rem */;
  height: 100vh;
  padding-top: 0.68rem /* 68px -> .68rem */;
  box-sizing: border-box;
}

.temlate2-left-title {
  width: 100%;
  height: 0.88rem /* 88px -> .88rem */;
  font-size: 0.6rem /* 60px -> .6rem */;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #333333;
  line-height: 0.88rem /* 88px -> .88rem */;
  padding-bottom: 0.24rem /* 24px -> .24rem */;
  border-bottom: 0.04rem /* 4px -> .04rem */ solid #333333;
  margin-bottom: 0.04rem /* 4px -> .04rem */;
}

.preparing-2 {
  width: 100%;
  height: 1.16rem /* 116px -> 1.16rem */;
  display: block;
  margin-bottom: 0.04rem /* 4px -> .04rem */;
}

.waiting-2 {
  width: 100%;
  height: 1.16rem /* 116px -> 1.16rem */;
  display: block;
  margin-bottom: 0.04rem /* 4px -> .04rem */;
}

.temlate2-left-title span {
  font-weight: normal;
}

.temlate2-box {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.temlate2-left-box {
  width: 58.63%;
  flex-shrink: 0;
}

.temlate2-right-box {
  width: 41.37%;
  flex-shrink: 0;
}

.temlate2-left-item {
  display: flex;
  align-items: center;
  margin-top: 0.64rem /* 64px -> .64rem */;
}

.left-text {
  width: 2.01rem /* 201px -> 2.01rem */;
  height: 0.72rem /* 72px -> .72rem */;
  font-size: 0.72rem /* 72px -> .72rem */;
  font-family: SourceHanSansCN-Bold, SourceHanSansCN;
  font-weight: bold;
  color: #666666;
  line-height: 0.72rem /* 72px -> .72rem */;
}

.right-icon {
  width: 0.77rem /* 77px -> .77rem */;
  height: 0.77rem /* 77px -> .77rem */;
  border-radius: 0.08rem /* 8px -> .08rem */;
  margin-right: 0.4rem /* 40px -> .4rem */;
  display: block;
}

.right-text {
  color: #333333;
}

.bottom-box {
  width: 19.2rem /* 1920px -> 19.2rem */;
  height: 3.78rem /* 378px -> 3.78rem */;
  background: rgba(170, 170, 170, 0);
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  will-change: transform;
}

.bottom-box-item {
  width: 4.2rem /* 420px -> 4.2rem */;
  height: 2.36rem /* 236px -> 2.36rem */;
  box-shadow: 0 0.29rem /* 29px -> .29rem */ 0.29rem /* 29px -> .29rem */ 0 rgba(0, 0, 0, 0.5),
    inset 0 0 0.32rem /* 32px -> .32rem */ 0 rgba(0, 0, 0, 0.3);
  border-radius: 0.08rem /* 8px -> .08rem */;
  border: 0.02rem /* 2px -> .02rem */ solid #cccccc;
  margin-left: 0.8rem /* 80px -> .8rem */;
  display: block;
}

.focus {
  box-shadow: 0 0 0.39rem /* 39px -> .39rem */ 0 rgba(255, 170, 0, 0.8),
    inset 0 0 0.32rem /* 32px -> .32rem */ 0 rgba(255, 170, 0, 0.8);
  border: 0.02rem /* 2px -> .02rem */ solid #ffaa00;
  transform: scale(1.1);
}

.slide-top {
  animation: slide-top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes slide-top {
  0% {
    transform: translateY(100%);
  }

  100% {
    transform: translateY(0);
  }
}

.slide-out-bottom {
  animation: slide-out-bottom 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes slide-out-bottom {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(100%);
  }
}
</style>