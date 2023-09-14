import { SDK } from '@/sdk'
import apiConfig from '@/common/apiConfig'

class Base {
  constructor() { }
  get apiConfig () {
    return apiConfig
  }
  request (url, method = 'POST', data = {}, headers = {}, extra = {}) {
    return SDK.request({
      url: url,
      method: method,
      data: data,
      headers: headers,
      timeout: extra.timeout,
      extra: {
        legalize: {
          code: {
            keys: 'statusCode',
            values: '200'
          }
        },
        ...extra
      }
    })
  }
}
export default Base