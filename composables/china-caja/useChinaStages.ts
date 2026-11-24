import { computed, ref } from 'vue'
import { useRoute } from '#imports'
import { useChinaAction } from '~/composables/china-caja/useChinaAction'
import { useEncargadoChina } from '~/composables/china-caja/useEncargadoChina'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerOptions, ChinaContainerValues } from '~/types/china-caja'

/** Columna y panel «Etapas» de Carga consolidada (solo Encargado China). */
export function useChinaStages() {
  const { isEncargadoChina } = useEncargadoChina()
  const { run } = useChinaAction('Etapas')
  const route = useRoute()
  const rows = ref<ChinaContainer[]>([])
  const options = ref<ChinaContainerOptions>({ lines: [], shippers: [], container_types: [] })
  const selectedId = ref<number | null>(null)
  const openStage = ref<number | null>(null)
  const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)

  async function fetchRows() {
    const response = await ChinaCajaService.containers('stages')
    rows.value = response.data
    options.value = response.options
  }

  async function loadStages() {
    if (!isEncargadoChina.value) return
    if (!(await run(fetchRows, '', 'Cargando etapas…'))) return
    const id = Number(route.query.etapas || 0)
    if (id) open(id, Number(route.query.etapa || 0) || null)
  }

  function open(id: number, stage: number | null = null) {
    selectedId.value = id
    openStage.value = stage ?? rows.value.find((row) => row.id === id)?.progress.current ?? 1
  }

  function save(id: number, values: ChinaContainerValues) {
    return run(async () => {
      await ChinaCajaService.updateContainer(id, values)
      await fetchRows()
    })
  }

  function containerOf(id: number) {
    return rows.value.find((row) => row.id === id) ?? null
  }

  return { isEncargadoChina, selected, selectedId, openStage, options, loadStages, open, save, containerOf }
}
