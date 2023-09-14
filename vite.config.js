import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace'
import { ViteEjsPlugin } from 'vite-plugin-ejs'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return defineConfig({
    base: './',
    server: {
      host: '0.0.0.0',
      port: 1002,
      open: false
    },
    plugins: [
      vue(),
      ViteEjsPlugin({
        env: env.VITE_APP_ENV
      }),
      replace({
        preventAssignment: true,
        '__VERSION__': pkg.version
      }),
      legacy({
        targets: ['defaults', 'not IE 11']
      }),
      env.VITE_GLOB_APP_PWA === 'true' && VitePWA({
        injectRegister: 'auto',
        manifest: {
          name: 'FmPickupScreen',
          short_name: 'FmPickupScreen',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      // Tauri supports es2021
      target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
      reportCompressedSize: false,
      commonjsOptions: {
        ignoreTryCatch: false,
      },
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            libs: ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            sdk: ['@sandload/open-store-sdk'],
            dexie: ['dexie']
          }
        }
      }
    },
  })
}
