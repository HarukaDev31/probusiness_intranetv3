import { computed, ref } from 'vue'
import { useRoute } from '#imports'
import { useEncargadoChina } from '~/composables/china-caja/useEncargadoChina'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerOptions } from '~/types/china-caja'

/** Columna y panel «Etapas» de Carga consolidada (solo Encargado China). */
export function useChinaStages() {
  const { isEncargadoChina } = useEncargadoChina()
  const route = useRoute()
  const rows = ref<ChinaContainer[]>([])
  const options = ref<ChinaContainerOptions>({ lines: [], shippers: [], container_types: [] })
  const selectedId = ref<number | null>(null)
  const openStage = ref<number | null>(null)
  const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)

  async function loadStages() {
    if (!isEncargadoChina.value) return
    try {
      const response = await ChinaCajaService.containers('stages')
      rows.value = response.data
      options.value = response.options
    } catch {
      rows.value = []
    }
    const id = Number(route.query.etapas || 0)
    if (id) open(id, Number(route.query.etapa || 0) || null)
  }

  function open(id: number, stage: number | null = null) {
    selectedId.value = id
    openStage.value = stage ?? rows.value.find((row) => row.id === id)?.progress.current ?? 1
  }

  function onSaved(container: ChinaContainer) {
    rows.value = rows.value.map((row) => (row.id === container.id ? container : row))
    ChinaCajaService.containers('stages').then((response) => { options.value = response.options }).catch(() => {})
  }

  function stageOf(id: number) {
    return rows.value.find((row) => row.id === id)?.progress ?? null
  }

  return { isEncargadoChina, selected, selectedId, openStage, options, loadStages, open, onSaved, stageOf }
}
