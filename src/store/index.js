import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store = createPinia()
store.use(piniaPluginPersistedstate)
function setupStore (app) {
  app.use(store)
}

export * from './modules/app'
export * from './modules/counter'
export * from './modules/voicepacket'
export * from './modules/order'
export * from './modules/player'

export { store, setupStore }