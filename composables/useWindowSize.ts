import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para obtener el tamaño de la ventana de forma optimizada
 * Usa ResizeObserver y throttling para evitar forced reflows
 */
export const useWindowSize = () => {
  const width = ref(0)
  const height = ref(0)
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)

  let rafId: number | null = null
  let lastUpdate = 0
  const THROTTLE_MS = 100 // Actualizar máximo cada 100ms

  const updateSize = () => {
    const now = Date.now()
    if (now - lastUpdate < THROTTLE_MS) {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          updateSize()
        })
      }
      return
    }

    lastUpdate = now
    
    if (typeof window === 'undefined') return

    // Batch todas las lecturas juntas
    const w = window.innerWidth
    const h = window.innerHeight
    
    width.value = w
    height.value = h
    isMobile.value = w < 640
    isTablet.value = w >= 640 && w < 1024
    isDesktop.value = w >= 1024
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    
    updateSize()
    
    // Usar ResizeObserver en lugar de window.resize cuando sea posible
    // Para window, usamos resize con throttling
    const handleResize = () => {
      updateSize()
    }

    window.addEventListener('resize', handleResize, { passive: true })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    })
  })

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop
  }
}

