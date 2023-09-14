import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupStore } from './store/index'
import focusable from 'vue-tv-focusable'
import { setupRem, setupDebuger, setupVoicePacket } from '@/plugins/index'
import { setupUpgrade } from './plugins'

async function bootstrap () {
  const app = createApp(App)

  setupStore(app)
  setupRem()
  setupDebuger()
  setupUpgrade()
  setupVoicePacket()

  app.use(router)
  app.use(focusable)
  app.mount('#app')
}

bootstrap()
