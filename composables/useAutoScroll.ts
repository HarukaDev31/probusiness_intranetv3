import { ref, onUnmounted, readonly } from 'vue'

export interface AutoScrollOptions {
  scrollSpeed?: number
  scrollInterval?: number
  smoothScroll?: boolean
}

export const useAutoScroll = (options: AutoScrollOptions = {}) => {
  const {
    scrollSpeed = 10,
    scrollInterval = 16,
    smoothScroll = true
  } = options

  // Estado del auto-scroll
  const isAutoScrolling = ref(false)
  const autoScrollInterval = ref<NodeJS.Timeout | null>(null)
  const currentDirection = ref<'left' | 'right' | null>(null)

  // Función para verificar si se necesita scroll
  const checkScrollNeeded = (container: HTMLElement) => {
    const hasHorizontalScroll = container.scrollWidth > container.clientWidth
    const scrollLeft = container.scrollLeft
    const maxScrollLeft = container.scrollWidth - container.clientWidth
    
    return {
      hasHorizontalScroll,
      canScrollLeft: hasHorizontalScroll && scrollLeft > 0,
      canScrollRight: hasHorizontalScroll && scrollLeft < maxScrollLeft,
      scrollLeft,
      maxScrollLeft
    }
  }

  // Función para scroll hacia la izquierda
  const scrollLeft = (container: HTMLElement, distance: number = 100) => {
    if (smoothScroll) {
      container.scrollBy({ left: -distance, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: -distance, behavior: 'auto' })
    }
  }

  // Función para scroll hacia la derecha
  const scrollRight = (container: HTMLElement, distance: number = 100) => {
    if (smoothScroll) {
      container.scrollBy({ left: distance, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: distance, behavior: 'auto' })
    }
  }

  // Función para auto-scroll hacia la izquierda
  const startAutoScrollLeft = (container: HTMLElement) => {
    if (isAutoScrolling.value) return
    
    isAutoScrolling.value = true
    currentDirection.value = 'left'
    
    autoScrollInterval.value = setInterval(() => {
      if (container) {
        const scrollInfo = checkScrollNeeded(container)
        if (scrollInfo.canScrollLeft) {
          container.scrollBy({ left: -scrollSpeed, behavior: 'auto' })
        } else {
          stopAutoScroll()
        }
      }
    }, scrollInterval)
  }

  // Función para auto-scroll hacia la derecha
  const startAutoScrollRight = (container: HTMLElement) => {
    if (isAutoScrolling.value) return
    
    isAutoScrolling.value = true
    currentDirection.value = 'right'
    
    autoScrollInterval.value = setInterval(() => {
      if (container) {
        const scrollInfo = checkScrollNeeded(container)
        if (scrollInfo.canScrollRight) {
          container.scrollBy({ left: scrollSpeed, behavior: 'auto' })
        } else {
          stopAutoScroll()
        }
      }
    }, scrollInterval)
  }

  // Función para detener el auto-scroll
  const stopAutoScroll = () => {
    if (autoScrollInterval.value) {
      clearInterval(autoScrollInterval.value)
      autoScrollInterval.value = null
    }
    isAutoScrolling.value = false
    currentDirection.value = null
  }

  // Función para hacer scroll a una posición específica
  const scrollToPosition = (container: HTMLElement, position: 'start' | 'end' | 'center') => {
    const scrollInfo = checkScrollNeeded(container)
    
    if (!scrollInfo.hasHorizontalScroll) return
    
    switch (position) {
      case 'start':
        if (smoothScroll) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          container.scrollTo({ left: 0, behavior: 'auto' })
        }
        break
      case 'end':
        if (smoothScroll) {
          container.scrollTo({ left: scrollInfo.maxScrollLeft, behavior: 'smooth' })
        } else {
          container.scrollTo({ left: scrollInfo.maxScrollLeft, behavior: 'auto' })
        }
        break
      case 'center':
        const centerPosition = scrollInfo.maxScrollLeft / 2
        if (smoothScroll) {
          container.scrollTo({ left: centerPosition, behavior: 'smooth' })
        } else {
          container.scrollTo({ left: centerPosition, behavior: 'auto' })
        }
        break
    }
  }

  // Función para scroll incremental
  const scrollIncrementally = (container: HTMLElement, direction: 'left' | 'right', steps: number = 5) => {
    const stepDistance = 50
    let currentStep = 0
    
    const scrollStep = () => {
      if (currentStep < steps) {
        if (direction === 'left') {
          scrollLeft(container, stepDistance)
        } else {
          scrollRight(container, stepDistance)
        }
        currentStep++
        setTimeout(scrollStep, 100)
      }
    }
    
    scrollStep()
  }

  // Limpieza automática
  onUnmounted(() => {
    stopAutoScroll()
  })

  return {
    // Estado
    isAutoScrolling: readonly(isAutoScrolling),
    currentDirection: readonly(currentDirection),
    
    // Funciones de utilidad
    checkScrollNeeded,
    scrollLeft,
    scrollRight,
    
    // Auto-scroll
    startAutoScrollLeft,
    startAutoScrollRight,
    stopAutoScroll,
    
    // Navegación avanzada
    scrollToPosition,
    scrollIncrementally
  }
}
