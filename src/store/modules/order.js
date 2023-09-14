import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { store } from '@/store/index'
import { SDK } from '@/sdk'


export const useOrderStore = defineStore('FM.ORDER', () => {
  // 定义一个新订单信号标识，告知是否存在新订单
  const signal = ref(false)
  const orders = ref([])
  const totalCount = computed(() => orders.value.length)

  function init (items) {
    orders.value = items
    signal.value = false
    return orders.value
  }
  // 切换新订单信号
  function switchSignal (value) {
    return signal.value = value
  }
  // 移除指定订单
  function remove (item) {
    SDK._.remove(orders.value, function (o) {
      return o.orderCode === item.orderCode
    })
  }

  return { signal, orders, totalCount, init, remove, switchSignal }
}, {
  persist: false
})

export function useOrderStoreWithout () {
  return useOrderStore(store)
}