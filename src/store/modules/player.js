import { ref } from 'vue'
import { defineStore } from 'pinia'
import { store } from '@/store/index'


export const usePlayerStore = defineStore('FM.COUNTER', () => {
  // 是否存在播放挡板（此挡板为延迟策略，保证页面切换时当前正在播放的号码完整播放完，禁止其他用途改变此值）
  const hasBaffle = ref(false)
  function changeBaffleStatus (value) {
    hasBaffle.value = value
  }
  return { hasBaffle, changeBaffleStatus }
}, {
  persist: false
})

export function usePlayerStoreWithout () {
  return usePlayerStore(store)
}