import { SDK } from '@/sdk'
import { useAppStoreWithOut } from '@/store/index'

export default function setupUpgrade () {
  let appStore = useAppStoreWithOut()
  let { version, remoteVersion, isLatestVersion, deviceSN, storeInfo } = appStore
  // 因取餐屏存在长时间不关的场景，本机记录最后一次载入的版本，同时方便后续向下兼容问题
  console.log(`本地版本: ${version}, 远端版本: ${remoteVersion}, 最新版本: ${isLatestVersion}`)
  // 升级设备号处理逻辑
  if (deviceSN === '' || SDK._.isNil(deviceSN)) {
    appStore.setDeviceSN(localStorage.getItem('deviceSN') ?? '')
    localStorage.removeItem('deviceSN')
  }
  // 升级门店信息处理逻辑
  if (SDK._.isNil(storeInfo)) {
    const result = SDK.utils.tryParseJSON(localStorage.getItem('storeInfos'))
    if (result.valid) {
      appStore.setStoreInfo(result.target)
      localStorage.removeItem('storeInfos')
    }
  }
  appStore.setVersion(remoteVersion)
}