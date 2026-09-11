import { ref } from 'vue'
import { HomeStatsService } from '~/services/cargaconsolidada/homeStatsService'
import type { HomeStatsCard, HomeStatsData } from '~/types/cargaconsolidada/home-stats'

export function useHomeStats() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<HomeStatsData | null>(null)

  async function loadStats() {
    loading.value = true
    error.value = null
    try {
      const res = await HomeStatsService.getStats()
      stats.value = res.success ? res.data : null
      if (!res.success) {
        error.value = res.message || 'No se pudieron cargar los indicadores'
      }
    } catch (e: any) {
      error.value = e?.message || 'No se pudieron cargar los indicadores'
      stats.value = null
    } finally {
      loading.value = false
    }
  }

  function cardByKey(key: HomeStatsCard['key']): HomeStatsCard | undefined {
    return stats.value?.cards.find(c => c.key === key)
  }

  return {
    loading,
    error,
    stats,
    loadStats,
    cardByKey,
  }
}
