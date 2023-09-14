<template>
  <div class="box" v-if="isShow" :style="{transform: 'scale(' + scale + ')'}">
    <!-- <div class="box" v-if="isShow"> -->
    <div class="title-box">
      <div class="title" v-if="!storeInfos">
        请使用<span>财源到老板通</span>扫码绑定
      </div>
      <div class="title2" v-if="storeInfos">
        <div class="title2-l">绑定门店:</div>
        <div class="title2-r">{{storeInfos.storeName}}</div>
      </div>
    </div>
    <template v-if="!storeInfos">
      <div class="loading" v-show="loading">
        <img class="loading-img rotate-center" src="https://caiyuandao-cdn.sandload.cn/pickupScreen-loading.png" />
        <div class="tips-box" v-if="showRefresh">
          <div class="loading-text">当前网络不佳</div>
          <div class="loading-text">请更换网络或等待结果</div>
        </div>
        <!-- <div v-show="showRefresh">
            <img class="loading-img2" src="https://caiyuandao-cdn.sandload.cn/loading2.png" />
            <div class="loading-text" focusable>点击<span>确定/OK</span>按钮重新加载</div>
          </div> -->
      </div>
      <div id="qr" v-show="!loading"></div>
    </template>
    <div class="success" v-if="storeInfos">
      <img class="success-icon" src="https://caiyuandao-cdn.sandload.cn/pickup-sucsess.png" />
      <div class="success-text">绑定成功</div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { SDK } from '@/sdk'
import service from '@/service'

// eslint-disable-next-line no-unused-vars
let version = ref(SDK.version)
let loading = ref(false)
let showRefresh = ref(false)

</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

.box {
  width: 608px;
  height: 798px;
  background: #ffffff;
  box-shadow: 0px 2px 48px 0px rgba(255, 170, 0, 0.5);
  border-radius: 8px;
  border: 1px solid #979797;
  box-sizing: border-box;
  padding: 0 40px;
}

.title-box {
  width: 100%;
  height: 188px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 64px;
}

.title {
  width: 468px;
  height: 54px;
  font-size: 36px;
  font-family: SourceHanSansCN-Medium, SourceHanSansCN;
  font-weight: 500;
  color: #333333;
  line-height: 54px;
  padding-top: 72px;
}

.title span {
  color: rgba(255, 170, 0, 1);
}

.loading {
  width: 480px;
  height: 480px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #979797;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tips-box {
  width: 100%;
  position: absolute;
  bottom: 3.7rem /* 370px -> 3.7rem */;
}

.loading-img {
  display: block;
  width: 72px;
  height: 72px;
  will-change: auto;
  display: block;
}

.loading-img2 {
  width: 72px;
  height: 72px;
  display: block;
}

.loading-text {
  width: 100%;
  height: 36px;
  font-size: 24px;
  font-family: SourceHanSansCN-Regular, SourceHanSansCN;
  font-weight: 400;
  color: #999999;
  line-height: 36px;
  text-align: center;
}

.loading-text span {
  color: rgba(255, 170, 0, 1);
}

.rotate-center {
  animation: rotate-center 0.8s linear infinite;
}

@keyframes rotate-center {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}

#qr {
  width: 480px;
  height: 480px;
  margin: 0 auto;
}

.title2 {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  padding-top: 40px;
}

.title2-l {
  width: 155px;
  height: 54px;
  font-size: 36px;
  font-family: SourceHanSansCN-Medium, SourceHanSansCN;
  font-weight: 500;
  color: #999999;
  line-height: 54px;
  margin-right: 13px;
}

.title2-r {
  width: 360px;
  height: 108px;
  font-size: 36px;
  font-family: SourceHanSansCN-Regular, SourceHanSansCN;
  font-weight: 400;
  color: #333333;
  line-height: 54px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 74px;
}

.success-icon {
  width: 240px;
  height: 240px;
}

.success-text {
  width: 192px;
  height: 71px;
  font-size: 48px;
  font-family: SourceHanSansCN-Medium, SourceHanSansCN;
  font-weight: 500;
  color: #333333;
  line-height: 71px;
  margin-top: 16px;
}

/*.focus {
  transform: scale(1.1);
  border: 2px solid red;
  box-shadow: 0 0 20px red;
}*/
</style>
