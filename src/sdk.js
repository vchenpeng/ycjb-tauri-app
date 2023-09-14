import sdk from '@sandload/open-store-sdk'
import { qcp } from '@sandload/signlib'

const context = sdk.init({
  config: {
    baseURL: import.meta.env.VITE_APP_API_BASE_URL
  },
  headers: {},
  adapter: {
    // 可将adapter部分抽离到独立的模块
    beforeRequest: () => { },
    afterRequest: () => { }
  }
})
context.regHook('adapter.beforeRequest', function (params) {
  let timestamp = `${+new Date()}`
  let { request: data } = params
  // 当method为post时，自动空数据null参与签名
  // eslint-disable-next-line no-unused-vars
  // let { query } = sdk.utils.parseUrl(`${baseURL}${url}`)
  let content = params.method === 'POST' ? data : null
  params.headers['X-FM-TIMESTAMP'] = timestamp
  params.headers['X-FM-SIGN'] = qcp.genSign({
    ...params,
    data: content
  })
})
context.initStorage(`FM.PICKUPSCREEN`)

export const SDK = context
