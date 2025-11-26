<template>
  <section class="content-header px-4 xl:px-4 sm:px-2" style="height: 93vh;">
    <!-- Hero Section -->
    <div ref="heroRef" class="hero-section relative h-100 bg-cover bg-center bg-no-repeat mb-4 rounded-xl overflow-hidden opacity-0 translate-y-4 transition-all duration-700"
         :class="{ 'opacity-100 translate-y-0': heroVisible }"
         style="background-image: url('https://intranet.probusiness.pe/assets/img/backgrounds/inicioview.png');">
      <div class="absolute inset-0 bg-gradient-to-r from-black/40 to-black/10"></div>
      <div class="container relative flex items-center mx-4 h-full">
        <div class="text-white lg:text-5xl sm:text-4xl text-4xl xl:py-5 main-text font-normal z-10">
          <span class="inline-block animate-fade-in-up" style="animation-delay:100ms">¡Hola,</span><br>
          <span class="inline-block animate-fade-in-up" style="animation-delay:250ms">bienvenido!</span>
        </div>
      </div>
      <div class="absolute bottom-4 right-4 flex gap-2 opacity-70">
        <button class="h-2 w-2 rounded-full bg-white/60 hover:bg-white transition"></button>
        <button class="h-2 w-2 rounded-full bg-white/30 hover:bg-white transition"></button>
        <button class="h-2 w-2 rounded-full bg-white/30 hover:bg-white transition"></button>
      </div>
    </div>

    <!-- Stats Section -->
      <div class="container w-full max-w-full flex align-middle justify-center mb-4 pt-4">
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 h-full min-h-50 max-w-7xl auto-rows-fr">
          <div v-for="stat in stats" :key="stat.id" :data-stat-id="stat.id"
             class="group col-span-1 h-full px-1 transition-all duration-700"
             :class="stat.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
           <div class="card stat-card bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden flex flex-col justify-center h-full min-h-[8rem] sm:min-h-[10rem]">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/10 pointer-events-none" />
            <div class="card-body flex justify-between items-center px-4 h-full">
              <div class="icon-container px-2 relative">
                <UIcon :name="stat.icon" class="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
                <span class="sr-only">{{ stat.label }}</span>
              </div>
              <div class="text-container text-center">
                <div class="counter text-4xl md:text-6xl xl:text-7xl font-bold text-gray-800 dark:text-white tabular-nums">
                  {{ formatNumber(stat.current || 0) }}<span v-if="stat.suffix">{{ stat.suffix }}</span>
                </div>
                <p class="text-muted dark:text-gray-400 text-center text-sm tracking-wide font-medium">{{ stat.label }}</p>
              </div>
            </div>
            <div class="absolute bottom-0 left-0 h-1 bg-orange-500/60 group-hover:w-full w-0 transition-all duration-700" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'auth' })

interface StatDef { id: string; value: number; label: string; suffix?: string; icon: string; color: string; delay?: number; current?: number; visible?: boolean }

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Sustituimos clases Font Awesome por nombres de UIcon (heroicons) sin tocar nuxt.config.
// Mapeo elegido usando iconos existentes:
// - dollars -> presentation-chart-line
// - clients -> building-office (si luego añades users/user-group puedes cambiarlos)
// - cbm -> archive-box
// - containers -> inbox
const stats = ref<StatDef[]>([
  { id: 'dollars', value: 15000000, label: 'Dólares en importaciones', suffix: '', icon: 'solar:dollar-linear', color: '#f97316', delay: 0, current: 0, visible: false },
  { id: 'clients', value: 5000, label: 'Clientes satisfechos', suffix: '', icon: 'flowbite:users-group-solid', color: '#f97316', delay: 120, current: 0, visible: false },
  { id: 'cbm', value: 1100, label: 'CBM vendidos', suffix: '', icon: 'fluent:box-32-filled', color: '#f97316', delay: 240, current: 0, visible: false },
  { id: 'containers', value: 10000, label: 'Contenedores importados', suffix: '', icon: 'mingcute:ship-line', color: '#f97316', delay: 360, current: 0, visible: false }
])

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

// Hero animation visibility
const heroRef = ref<HTMLElement | null>(null)
const heroVisible = ref(false)
onMounted(() => {
  if (!heroRef.value) return
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) heroVisible.value = true })
  }, { threshold: 0.2 })
  obs.observe(heroRef.value)
  // Stats observer
  const statEls = document.querySelectorAll('[data-stat-id]')
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const id = entry.target.getAttribute('data-stat-id')
      const st = stats.value.find(s => s.id === id)
      if (st && !st.visible) {
        st.visible = true
        const animate = () => {
          if (prefersReducedMotion) { st.current = st.value; return }
          const duration = 1400
          const start = performance.now()
          const from = 0
            const to = st.value
          const step = (t: number) => {
            const progress = Math.min(1, (t - start) / duration)
            const eased = 1 - Math.pow(1 - progress, 3)
            st.current = Math.round(from + (to - from) * eased)
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
        setTimeout(animate, st.delay || 0)
      }
    })
  }, { threshold: 0.4 })
  statEls.forEach(el => statObs.observe(el))
})

</script>

<style scoped>
/* Estilos específicos para mantener la funcionalidad original */
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: 'Epilogue', sans-serif;
}
.content-header {
  font-family: 'Epilogue', sans-serif;
}

.hero-section {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.main-text {
  font-weight: 400;
  z-index: 3;
}

  .stat-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.animate-fade-in-up { 
  animation: fadeInUp 0.9s cubic-bezier(0.22,0.61,0.36,1) both;
}

@keyframes fadeInUp {
  0% { opacity:0; transform: translate3d(0, 25px, 0) scale(.97); filter: blur(2px); }
  60% { opacity:.6; }
  100% { opacity:1; transform: translate3d(0,0,0) scale(1); filter: blur(0); }
}

.counter { font-variant-numeric: tabular-nums; }

.dark .stat-card:hover { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); }

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-container {
  flex: 1;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-text {
    font-size: 2rem;
  }
  
  .stat-card .card-body {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .icon-container {
    order: -1;
  }
}

@media (max-width: 640px) {
  .main-text {
    font-size: 1.75rem;
  }
}

/* Mobile-specific tweaks to make hero and stats more compact */
  @media (max-width: 640px) {
  .content-header {
    height: auto !important;
    padding-bottom: 1.5rem;
  }
  .hero-section {
    height: 40vh !important;
    background-position: center top;
  }
  .stat-card {
    min-height: 120px;
  }
  .stat-card .card-body {
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  .counter {
    font-size: 1.5rem !important;
  }
  .icon-container :where(svg, .ui-icon) {
    width: 3rem !important;
    height: 3rem !important;
  }
}
</style> 