import { computed, ref } from 'vue'
import { CHINA_PENDING_SECTIONS, CHINA_PENDING_URGENT } from '~/constants/chinaCaja'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaPending } from '~/types/china-caja'

/** Bandeja de pendientes del Inicio del Encargado China. */
export function useChinaPending() {
  const rows = ref<ChinaPending[]>([])
  const loading = ref(true)
  const error = ref('')
  const filter = ref('')

  const urgent = computed(() => rows.value.filter((row) => row.urgent).length)
  const shown = computed(() => rows.value.filter((row) => !filter.value || (filter.value === CHINA_PENDING_URGENT ? row.urgent : row.section === filter.value)))
  const summary = computed(() => {
    if (loading.value) return 'Cargando…'
    if (!rows.value.length) return 'No tienes pendientes'
    return `Tienes ${rows.value.length} pendientes${urgent.value ? `, ${urgent.value} urgentes` : ''}`
  })
  const sections = computed(() => CHINA_PENDING_SECTIONS.map((name) => {
    const items = rows.value.filter((row) => row.section === name)
    const kinds = new Map<string, number>()
    items.forEach((row) => kinds.set(row.kind, (kinds.get(row.kind) || 0) + row.count))
    return {
      name,
      total: items.reduce((sum, row) => sum + row.count, 0),
      urgent: items.some((row) => row.urgent),
      breakdown: [...kinds].map(([kind, count]) => `${kind}: ${count}`).join(' · ')
    }
  }))

  async function load() {
    loading.value = true
    error.value = ''
    try {
      rows.value = (await ChinaCajaService.pending()).data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudieron cargar los pendientes.'
    } finally {
      loading.value = false
    }
  }

  return { rows, loading, error, filter, urgent, shown, summary, sections, load }
}
