import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { store } from '@/store/index'


export const useCounterStore = defineStore('FM.COUNTER', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment () {
    count.value++
  }

  return { count, doubleCount, increment }
}, {
  persist: true
})

export function useCounterStoreWithout () {
  return useCounterStore(store)
}