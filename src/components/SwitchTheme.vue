<template>
  <transition class="theme-box" enter-active-class="slide-top" leave-active-class="slide-out-bottom" @before-enter="onBeforeEnter" @after-leave="onAfterLeave">
    <div v-if="visible">
      <img :ref="item.key" :class="['theme-item']" v-for="(item) in themeList" v-focusable :key="item.key" :src="item.diagram" :alt="item.name" @click.stop="handleSelected(item, $event)" />
    </div>
  </transition>

</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits, onMounted, onBeforeUnmount, getCurrentInstance, nextTick } from 'vue'
import { useTheme } from '@/hooks/useTheme.js'

const { theme, setTheme } = useTheme()
const { proxy, ctx } = getCurrentInstance()

let visible = ref(false)
// const props = defineProps({
//   visible: {
//     type: Boolean,
//     default: false,
//   }
// })
// const emit = defineEmits(['update:visible'])

// 主题集合
const themeList = ref([
  { key: 'dark', name: '深色', diagram: 'https://caiyuandao-cdn.sandload.cn/template2.png' },
  { key: 'light', name: '浅色', diagram: 'https://caiyuandao-cdn.sandload.cn/template1.png' },
])

// const _visible = computed({
//   get () {
//     return props.visible
//   },
//   set (value) {
//     emit('update:visible', value)
//   }
// })

function handleSelected (item) {
  setTheme(item.key)
  // console.log('内', visible.value, item)
  if (visible.value) {
    // 让原生keydown事件先行
    setTimeout(() => {
      visible.value = false
    }, 0)
  }
}

function onBeforeEnter () {
  console.log('进入动画')
  setTimeout(() => {
    proxy.$tv.limitingEl = ctx.$el
    proxy.$tv.next(ctx.$refs[theme.value])
  }, 0)
}

function onAfterLeave () {
  proxy.$tv.resetLimitingEl()
  console.log('离开动画')
}
// tv焦点
// proxy.$tv.setOnFocusChangeListener((element, focus) => {
//   console.log('触发焦点', focus)
// })

onMounted(() => {
  // 因为tv的click事件在keyup冒泡阶段，所以
  document.addEventListener('keyup', listenerKey)
})

onBeforeUnmount(() => {
  proxy.$tv.reset()
  document.removeEventListener('keyup', listenerKey)
})

function listenerKey (e) {
  let keyCode = e?.keyCode || e
  console.log('window', keyCode)
  switch (keyCode) {
    case 2:
    case 13:
      {
        if (!visible.value) {
          visible.value = true
        }
        break
      }
  }
}

// window.listenerKey = listenerKey
// window.addEventListener('keyup', listenerKey)
</script>

<style lang="scss" scoped>
.theme-box {
  width: 1920px /* 1920px -> 19.2rem */;
  height: 378px /* 378px -> 3.78rem */;
  background: rgba(170, 170, 170, 0);
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  will-change: transform;
}

.theme-item {
  width: 420px /* 420px -> 4.2rem */;
  height: 236px /* 236px -> 2.36rem */;
  box-shadow: 0 29px /* 29px -> .29rem */ 0.29rem /* 29px -> .29rem */ 0 rgba(0, 0, 0, 0.5),
    inset 0 0 32px /* 32px -> .32rem */ 0 rgba(0, 0, 0, 0.3);
  border-radius: 8px /* 8px -> .08rem */;
  border: 0.5px /* 2px -> .02rem */ solid #cccccc;
  margin-left: 80px /* 80px -> .8rem */;
  display: block;
}

.focus {
  box-shadow: 0 0 39px /* 39px -> .39rem */ 0 rgba(255, 170, 0, 0.8),
    inset 0 0 32px /* 32px -> .32rem */ 0 rgba(255, 170, 0, 0.8);
  border: 2px /* 2px -> .02rem */ solid #ffaa00;
  transform: scale(1.1);
}

.slide-top {
  animation: slide-top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.slide-out-bottom {
  animation: slide-out-bottom 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes slide-top {
  0% {
    transform: translateY(100%);
  }

  100% {
    transform: translateY(0);
  }
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