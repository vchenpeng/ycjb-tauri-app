import { computed, watch } from 'vue'
import { useAppStore } from '@/store/index'

export function useTheme () {
  const appStore = useAppStore()

  const isDark = computed(() => {
    return appStore.theme === 'dark'
  })
  const theme = computed(() => {
    return appStore.theme
  })
  watch(
    () => isDark.value,
    (dark) => {
      if (dark)
        document.documentElement.classList.add('dark')
      else
        document.documentElement.classList.remove('dark')
    },
    { immediate: true },
  )

  return { theme, setTheme: appStore.setTheme }
}