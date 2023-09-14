import db from './database'

export default {
  init (pkg) {
    return db.voicepackets.put({ id: 0, name: '默认', pkg: pkg })
  },
  get (key) {
    return db.voicepackets.get(key)
  },
  getDefaultVoicePacket () {
    return db.voicepackets.get(0)
  },
  put (item) {
    return db.voicepackets.put(item)
  }
}
