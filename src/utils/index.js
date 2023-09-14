import { ref, computed } from 'vue'
import * as bridge from './bridge'
import player from './player'
import { useVoicePacketStoreWithout } from '@/store/index'

const voicePacketStore = useVoicePacketStoreWithout()
const pkg = computed(() => voicePacketStore.pkg)

export { bridge, player }
export function speek (text) {
  let msg = new SpeechSynthesisUtterance()
  msg.text = text // 待合成文字
  msg.rate = 1  // 播放倍速
  msg.volume = 1 // 音量
  speechSynthesis.speak(msg)
}

export function playAudio (units = [], options) {
  let list = units.map(x => {
    return {
      file: pkg.value[x],
      howl: null
    }
  })
  let instance = player.init(list, options)
  instance.start()
  return instance
}