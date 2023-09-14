import Dexie from 'dexie'

class DB extends Dexie {
  constructor() {
    super('FM_DB')
    this.version(1).stores({
      voicepackets: '&id,name,pkg',
      waitings: '&orderCode,pickUpGoodsNo,orderClient,orderType,acceptTime,pickUpTime,playTimes,createTime,updateTime'
    })
    // this.open()
  }
  get context () {
    return this
  }
  close () {
    this.close()
  }
}

export default new DB()