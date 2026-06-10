import { ref, computed } from 'vue'
import type {
  WaCopilotoKanbanColumn,
  WaCopilotoPipelineKpis,
  WaCopilotoPipelineStage
} from '~/types/wa-copiloto'
import { WaCopilotoService } from '~/services/wa-copiloto/waCopilotoService'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { COPILOTO_KPI_METRICS } from '~/constants/copiloto/team'
import type { CopilotoKpiMetric } from '~/types/copiloto/lead'

const MAJOR_HEADER_COLORS: Record<string, string> = {
  nuevo: '#64748b',
  en_progreso: '#ea580c',
  cerrado: '#15803d',
  postventa: '#1d4ed8'
}

export function stageHeaderColor(major: string): string {
  return MAJOR_HEADER_COLORS[major] ?? '#475569'
}

export function useCopilotoPipeline(options?: { canManageStages?: boolean }) {
  const canManageStages = options?.canManageStages ?? false
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()

  const stages = ref<WaCopilotoPipelineStage[]>([])
  const columns = ref<WaCopilotoKanbanColumn[]>([])
  const kpis = ref<WaCopilotoPipelineKpis | null>(null)
  const loadingKanban = ref(false)
  const loadingKpis = ref(false)
  const assignedFilter = ref<number | null>(null)

  const kpiMetrics = computed<CopilotoKpiMetric[]>(() => {
    const data = kpis.value
    if (!data) return COPILOTO_KPI_METRICS

    return [
      {
        ...COPILOTO_KPI_METRICS[0],
        value: `${data.deals_cerrados}/${data.deals_meta}`,
        sub: 'Mes actual'
      },
      {
        ...COPILOTO_KPI_METRICS[1],
        value: String(data.pipeline_activo),
        sub: 'En progreso'
      },
      {
        ...COPILOTO_KPI_METRICS[2],
        value: `${data.conversion_pct}%`,
        sub: 'Cierre / inbound'
      },
      {
        ...COPILOTO_KPI_METRICS[3],
        value: String(data.alertas),
        sub: 'Sin leer + calientes'
      }
    ]
  })

  async function loadStages() {
    const res = await WaCopilotoService.getPipelineStages()
    stages.value = Array.isArray(res?.data) ? res.data : []
  }

  async function loadKanban() {
    loadingKanban.value = true
    try {
      const res = await WaCopilotoService.getPipelineKanban({
        assigned_user_id: assignedFilter.value ?? undefined,
        solo_cliente_inbound: 1
      })
      const data = res?.data
      columns.value = Array.isArray(data?.columns) ? data.columns : []
    } catch (e: any) {
      showError('Kanban', e?.message || 'No se pudo cargar el pipeline')
      columns.value = []
    } finally {
      loadingKanban.value = false
    }
  }

  async function loadKpis() {
    loadingKpis.value = true
    try {
      const res = await WaCopilotoService.getPipelineKpis({
        assigned_user_id: assignedFilter.value ?? undefined
      })
      kpis.value = res?.data ?? null
    } catch {
      kpis.value = null
    } finally {
      loadingKpis.value = false
    }
  }

  async function refreshAll() {
    await Promise.all([loadKanban(), loadKpis()])
  }

  function setAssignedFilter(userId: number | null) {
    assignedFilter.value = userId && userId > 0 ? userId : null
    void refreshAll()
  }

  async function moveCard(conversationId: number, stageId: number) {
    try {
      await withSpinner(async () => {
        const res = await WaCopilotoService.updatePipelineStage(conversationId, stageId)
        if (!res?.success) {
          throw new Error(res?.message || 'No se pudo mover el lead')
        }
      })
      showSuccess('Pipeline', 'Etapa actualizada')
      await refreshAll()
      return true
    } catch (e: any) {
      showError('Pipeline', e?.message || 'No se pudo cambiar la etapa')
      return false
    }
  }

  async function initPipeline() {
    if (!stages.value.length) {
      await loadStages()
    }
    await refreshAll()
  }

  async function createProgressStage(label: string, conversationId?: number) {
    if (!canManageStages) return null

    try {
      let stageId: number | null = null
      await withSpinner(async () => {
        const res = await WaCopilotoService.createPipelineStage(label)
        if (!res?.success || !res?.data?.id) {
          throw new Error(res?.message || 'No se pudo crear la etapa')
        }
        stageId = Number(res.data.id)
      })
      if (!stageId) return null
      showSuccess('Pipeline', 'Etapa creada')
      await loadStages()
      if (conversationId && conversationId > 0) {
        await moveCard(conversationId, stageId)
      } else {
        await loadKanban()
      }
      return stageId
    } catch (e: any) {
      showError('Pipeline', e?.message || 'No se pudo crear la etapa')
      return null
    }
  }

  async function reorderProgressStages(orderedStageIds: number[]) {
    if (!canManageStages) return false

    try {
      await withSpinner(async () => {
        const res = await WaCopilotoService.reorderPipelineStages(orderedStageIds)
        if (!res?.success) {
          throw new Error(res?.message || 'No se pudo reordenar')
        }
        stages.value = Array.isArray(res?.data) ? res.data : stages.value
      })
      await loadKanban()
      return true
    } catch (e: any) {
      showError('Pipeline', e?.message || 'No se pudo reordenar las columnas')
      return false
    }
  }

  return {
    canManageStages,
    stages,
    columns,
    kpis,
    kpiMetrics,
    loadingKanban,
    loadingKpis,
    assignedFilter,
    stageHeaderColor,
    loadKanban,
    loadKpis,
    refreshAll,
    setAssignedFilter,
    moveCard,
    createProgressStage,
    reorderProgressStages,
    initPipeline
  }
}
