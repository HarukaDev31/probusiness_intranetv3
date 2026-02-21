import { ref, computed } from 'vue'
import { TramiteAduanaService } from '~/services/basedatos/tramiteAduanaService'
import { TramiteAduanaCatalogoService, type TramiteAduanaEntidad, type TramiteAduanaTipoPermiso } from '~/services/basedatos/tramiteAduanaCatalogoService'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'
import type { TramiteAduana, CreateTramiteAduanaRequest } from '~/types/basedatos/tramiteAduana'
import { ROLES } from '~/constants/roles'
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

  async function updateTipoPermisoEstado(tramiteId: number, tipoPermisoId: number, estado: string) {
    return TramiteAduanaService.updateTipoPermisoEstado(tramiteId, tipoPermisoId, estado)
  }

  // Opciones para dropdowns
  const consolidados = ref<Contenedor[]>([])
  const loadingConsolidados = ref(false)
  async function loadConsolidados(opciones?: { sinCompletarDocumentacion?: boolean }) {
    loadingConsolidados.value = true
    try {
      // Modal de permisos: endpoint ligero valid-containers-documentacion (carga + año)
      if (opciones?.sinCompletarDocumentacion === true) {
        const res = await ConsolidadoService.getValidContainersDocumentacion()
        const raw = res?.data ?? []
        consolidados.value = raw.map((item) => ({
          id: item.id,
          carga: item.carga != null ? String(item.carga) : String(item.id),
        })) as Contenedor[]
        return
      }
      const res = await ConsolidadoService.getConsolidadoData({
        limit: 500,
        page: 1,
        completado: undefined,
      })
      consolidados.value = res?.data ?? []
    } catch {
      consolidados.value = []
    } finally {
      loadingConsolidados.value = false
    }
  }

  const clientesByConsolidado = ref<Array<{ id: number; nombre?: string; ruc?: string; telefono?: string; email?: string }>>([])
  const loadingClientes = ref(false)
  /**
   * Carga clientes del consolidado usando el endpoint index de cotizaciones (CotizacionController)
   * con rol Coordinación, para tener la misma info que ve coordinación.
   */
  async function loadClientesByConsolidado(idConsolidado: number) {
    if (!idConsolidado) {
      clientesByConsolidado.value = []
      return
    }
    loadingClientes.value = true
    try {
      const res = await CotizacionService.getCotizaciones(idConsolidado, {
        role: ROLES.COORDINACION,
        limit: 500,
        page: 1,
      } as any)
      const list = res?.data ?? []
      clientesByConsolidado.value = Array.isArray(list) ? list.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        ruc: c.documento,
        telefono: c.telefono,
        email: c.correo,
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
    updateTipoPermisoEstado,
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
