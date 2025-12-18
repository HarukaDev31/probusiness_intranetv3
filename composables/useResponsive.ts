import { ref, onMounted, onUnmounted } from 'vue'

export function useIsDesktop(breakpoint = 768) {
  const isDesktop = ref(true)

  const updateIsDesktop = () => {
    try {
      isDesktop.value = window.innerWidth >= breakpoint
    } catch (e) {
      isDesktop.value = true
    }
  }

  onMounted(() => {
    updateIsDesktop()
    window.addEventListener('resize', updateIsDesktop)
  })

  onUnmounted(() => {
    try { window.removeEventListener('resize', updateIsDesktop) } catch (e) {}
  })

  return { isDesktop, updateIsDesktop }
}
