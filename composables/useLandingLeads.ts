import { ref } from 'vue'
import { LandingLeadsService } from '~/services/landing/landingLeadsService'
import type {
  LandingConsolidadoLead,
  LandingCursoLead,
  LandingLeadPagination
} from '~/types/landing-leads'

const initialPagination = (): LandingLeadPagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0
})

export const useLandingLeads = () => {
  const activeTab = ref<'consolidado' | 'curso'>('consolidado')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const consolidadoLeads = ref<LandingConsolidadoLead[]>([])
  const cursoLeads = ref<LandingCursoLead[]>([])

  const searchConsolidado = ref('')
  const searchCurso = ref('')

  const perPageConsolidado = ref(20)
  const perPageCurso = ref(20)

  const paginationConsolidado = ref<LandingLeadPagination>(initialPagination())
  const paginationCurso = ref<LandingLeadPagination>(initialPagination())

  const loadConsolidado = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await LandingLeadsService.getConsolidadoLeads({
        page: paginationConsolidado.value.current_page,
        per_page: perPageConsolidado.value,
        search: searchConsolidado.value || undefined
      })
      consolidadoLeads.value = res.data || []
      paginationConsolidado.value = res.pagination || initialPagination()
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar leads de landing consolidado'
    } finally {
      loading.value = false
    }
  }

  const loadCurso = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await LandingLeadsService.getCursoLeads({
        page: paginationCurso.value.current_page,
        per_page: perPageCurso.value,
        search: searchCurso.value || undefined
      })
      cursoLeads.value = res.data || []
      paginationCurso.value = res.pagination || initialPagination()
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar leads de landing curso'
    } finally {
      loading.value = false
    }
  }

  return {
    activeTab,
    loading,
    error,
    consolidadoLeads,
    cursoLeads,
    searchConsolidado,
    searchCurso,
    perPageConsolidado,
    perPageCurso,
    paginationConsolidado,
    paginationCurso,
    loadConsolidado,
    loadCurso
  }
}

