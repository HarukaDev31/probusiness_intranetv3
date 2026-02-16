import { ref, computed } from 'vue'
import { TramiteAduanaService } from '~/services/basedatos/tramiteAduanaService'
import { TramiteAduanaCatalogoService, type TramiteAduanaEntidad, type TramiteAduanaTipoPermiso } from '~/services/basedatos/tramiteAduanaCatalogoService'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import { GeneralService } from '~/services/cargaconsolidada/clientes/generalService'
import type { TramiteAduana, CreateTramiteAduanaRequest } from '~/types/basedatos/tramiteAduana'
import type { Contenedor } from '~/types/cargaconsolidada/contenedor'

export function useTramitesAduana() {
  const tramites = ref<TramiteAduana[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
    from: 0,
    to: 0,
  })
  const search = ref('')
  const filters = ref<{ id_consolidado?: number; id_entidad?: number; estado?: string }>({})

  const totalItems = computed(() => pagination.value.total)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)

  async function loadTramites(params: { page?: number; limit?: number } = {}) {
    loading.value = true
    error.value = null
    try {
      const estadoRaw = filters.value.estado && String(filters.value.estado).trim()
      const estadoFilter =
        estadoRaw && estadoRaw !== 'ALL' ? estadoRaw : undefined
      const res = await TramiteAduanaService.list({
        page: params.page ?? pagination.value.current_page,
        limit: params.limit ?? pagination.value.per_page,
        search: search.value || undefined,
        id_consolidado: filters.value.id_consolidado,
        id_entidad: filters.value.id_entidad,
        estado: estadoFilter,
      })
      if (res.success) {
        tramites.value = res.data || []
        if (res.pagination) pagination.value = res.pagination
      } else {
        tramites.value = []
        error.value = res.error || 'Error al cargar'
      }
    } catch (e: any) {
      tramites.value = []
      error.value = e?.message || 'Error al cargar trámites'
    } finally {
      loading.value = false
    }
  }

  async function getTramiteById(id: number) {
    const res = await TramiteAduanaService.getById(id)
    return res.success ? res.data : null
  }

  async function createTramite(payload: CreateTramiteAduanaRequest) {
    const res = await TramiteAduanaService.create(payload)
    return res
  }

  async function updateTramite(id: number, payload: Partial<CreateTramiteAduanaRequest>) {
    const res = await TramiteAduanaService.update(id, payload)
    return res
  }

  async function deleteTramite(id: number) {
    return TramiteAduanaService.delete(id)
  }

  // Opciones para dropdowns
  const consolidados = ref<Contenedor[]>([])
  const loadingConsolidados = ref(false)
  async function loadConsolidados(opciones?: { sinCompletarDocumentacion?: boolean; estadoDocumentacion?: string }) {
    loadingConsolidados.value = true
    try {
      const res = await ConsolidadoService.getConsolidadoData({
        limit: 500,
        page: 1,
        completado: opciones?.sinCompletarDocumentacion === true ? false : undefined,
        estado_documentacion: opciones?.estadoDocumentacion,
      })
      let data = res?.data ?? []
      if (opciones?.estadoDocumentacion && data.length > 0) {
        data = data.filter((c: Contenedor) => (c.estado_documentacion || '').toUpperCase() === opciones.estadoDocumentacion!.toUpperCase())
      }
      consolidados.value = data
    } catch {
      consolidados.value = []
    } finally {
      loadingConsolidados.value = false
    }
  }

  const clientesByConsolidado = ref<Array<{ id: number; nombre?: string; ruc?: string; telefono?: string; email?: string }>>([])
  const loadingClientes = ref(false)
  async function loadClientesByConsolidado(idConsolidado: number) {
    if (!idConsolidado) {
      clientesByConsolidado.value = []
      return
    }
    loadingClientes.value = true
    try {
      const res = await GeneralService.getClientes(idConsolidado, {}, '', 500, 1)
      const list = res?.data ?? res ?? []
      clientesByConsolidado.value = Array.isArray(list) ? list.map((c: any) => ({
        id: c.id,
        nombre: c.nombre ?? c.razon_social,
        ruc: c.ruc ?? c.numero_documento,
        telefono: c.telefono ?? c.celular,
        email: c.email ?? c.correo,
      })) : []
    } catch {
      clientesByConsolidado.value = []
    } finally {
      loadingClientes.value = false
    }
  }

  const entidades = ref<TramiteAduanaEntidad[]>([])
  const loadingEntidades = ref(false)
  async function loadEntidades() {
    loadingEntidades.value = true
    try {
      const res = await TramiteAduanaCatalogoService.getEntidades()
      entidades.value = res?.data ?? []
    } catch {
      entidades.value = []
    } finally {
      loadingEntidades.value = false
    }
  }

  const tiposPermiso = ref<TramiteAduanaTipoPermiso[]>([])
  const loadingTiposPermiso = ref(false)
  async function loadTiposPermiso() {
    loadingTiposPermiso.value = true
    try {
      const res = await TramiteAduanaCatalogoService.getTiposPermiso()
      tiposPermiso.value = res?.data ?? []
    } catch {
      tiposPermiso.value = []
    } finally {
      loadingTiposPermiso.value = false
    }
  }

  return {
    tramites,
    loading,
    error,
    pagination,
    search,
    filters,
    totalItems,
    totalPages,
    currentPage,
    loadTramites,
    getTramiteById,
    createTramite,
    updateTramite,
    deleteTramite,
    consolidados,
    loadConsolidados,
    clientesByConsolidado,
    loadClientesByConsolidado,
    loadingClientes,
    loadingConsolidados,
    entidades,
    loadEntidades,
    loadingEntidades,
    tiposPermiso,
    loadTiposPermiso,
    loadingTiposPermiso,
  }
}
