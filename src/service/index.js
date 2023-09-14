const modulesFiles = import.meta.globEager("../service/*.js")
const validFiles = Object.keys(modulesFiles).filter(x => !['./base.js', './index.js'].includes(x))

const modules = validFiles.reduce((modules, modulePath) => {
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, "$1")
  const value = modulesFiles[modulePath]
  modules[moduleName] = new value.default()
  return modules
}, {})

import { SDK } from '@/sdk'

modules.invoke = async function (params) {
  // 可以是constructor内已经定义的接口
  let serviceName = params.service
  let api = params.api
  let method = params.method || 'POST'
  let data = params.data || {}
  let headers = params.headers || {}
  let extra = params.extra || {}
  // 是否执行已经主动定义的service函数(默认true)
  let defined = !!(params.defined ?? true)
  let instance = this[serviceName]
  if (defined && SDK._.isObject(instance) && SDK._.isFunction(instance[api])) {
    let instanceFunc = instance[api]
    return instanceFunc.call(instance, data, extra)
  } else {
    let quickIns = instance.apiConfig[serviceName]
    let quickApiUrl = quickIns?.[api]
    if (SDK._.isObject(quickIns) && SDK._.isString(quickApiUrl) && !SDK._.isEmpty(quickApiUrl)) {
      return SDK.request({
        url: quickApiUrl,
        method: method,
        data: data,
        headers: headers,
        timeout: extra.timeout,
        extra: {
          legalize: {
            code: {
              keys: 'code',
              values: ['100']
            }
          },
          ...extra
        }
      })
    } else {
      const errmsg = `NOT FOUND API`
      return Promise.reject(errmsg)
    }
  }
}
export default modules