import { defineStore } from 'pinia'
import { store } from '@/store'

export const useAppStore = defineStore('FM.SETTINGS', {
  state: () => {
    return {
      version: '__VERSION__',
      theme: 'light',
      deviceSN: '',
      storeInfo: null
    }
  },
  getters: {
    remoteVersion () {
      return '__VERSION__'
    },
    isLatestVersion (state) {
      return state.version === this.remoteVersion
    }
  },
  actions: {
    setTheme (theme) {
      this.theme = theme
    },
    setVersion (version) {
      this.version = version
    },
    setDeviceSN (sn) {
      this.deviceSN = sn
    },
    setStoreInfo (value) {
      this.storeInfo = value
    }
  },
  persist: true
})

export function useAppStoreWithOut () {
  return useAppStore(store)
}
