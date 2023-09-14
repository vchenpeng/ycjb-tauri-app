import Base from './base'
export default class Screen extends Base {
  constructor() {
    super()
  }
  // 检测设备SN
  async checkSN (data, extra = {}) {
    return this.request(this.apiConfig.screen.checkSN, 'POST', data, {}, extra)
  }
  // 查询门店详情
  async queryStoreInfo (data, extra = {}) {
    return this.request(this.apiConfig.screen.queryStoreInfo, 'POST', data, {}, extra)
  }
  // 保存极光推送的AppKey
  async saveAppKey (data, extra = {}) {
    return this.request(this.apiConfig.screen.saveAppKey, 'POST', data, {}, extra)
  }
  // 获取订单列表
  async queryOrders (data, extra = {}) {
    return this.request(this.apiConfig.screen.getOrders, 'POST', data, {}, extra)
  }
}