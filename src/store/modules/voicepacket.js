import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { store } from '@/store/index'

export const useVoicePacketStore = defineStore('FM.VOICEPACKET', () => {
  const pkg = ref(null)
  function setCurrentPacket (value) {
    pkg.value = value
  }
  return { pkg, setCurrentPacket }
})

export function useVoicePacketStoreWithout () {
  return useVoicePacketStore(store)
}