import { SDK } from '@/sdk'
export default async function setupRem () {
  function refreshRem () {
    let designSize = 1920 // 设计图尺寸
    let html = document.documentElement
    let wW = html.clientWidth// 窗口宽度
    let rem = wW / designSize * 100
    document.documentElement.style.fontSize = rem + 'px'
  }
  window.addEventListener('resize', SDK._.throttle(refreshRem, 300), false)
  refreshRem()
}