import { SDK } from '@/sdk'
import { useVoicePacketStoreWithout } from '@/store/index'
import { voicepacket as db } from '@/dexie/index.js'

export function useVoicePacket () {
  const { pkg, setCurrentPacket } = useVoicePacketStoreWithout()

  async function checkCurrentVoicePacket () {
    if (pkg) {
      return pkg
    } else {
      return null
    }
    // return db.getDefaultVoicePacket().then((res) => {
    //   if (res) {
    //     voicePacketStore.setCurrentPacket(res)
    //     return res
    //   } else {
    //     return null
    //   }
    // })
  }

  function queryRemoteVoicePacket () {
    const url = '/audio/config.json'
    console.log('请求远程语音包', SDK.dayjs().format('YYYY-MM-DD HH:mm:ss'))
    return fetch(url).then(res => res.json()).then(res => {
      return db.init(res)
    }).then(() => {
      return db.getDefaultVoicePacket()
    }).then(res => {
      console.log('远程语音包初始化完毕', SDK.dayjs().format('YYYY-MM-DD HH:mm:ss'))
      setCurrentPacket(res)
      return res
    })
  }

  async function initVoicepacket () {
    const voicePacket = await db.getDefaultVoicePacket()
    if (voicePacket) {
      setCurrentPacket(voicePacket)
    } else {
      return queryRemoteVoicePacket()
    }
  }
  return { checkCurrentVoicePacket, queryRemoteVoicePacket, initVoicepacket }
}