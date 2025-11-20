import { ref, computed } from 'vue'
import { DashboardUsuarioService } from '~/services/dashboard/dashboardUsuarioService'
import type { 
    DashboardResumenItem, 
    DashboardVendedorItem, 
    DashboardFiltroContenedor, 
    DashboardFiltroVendedor,
    DashboardEvolucionItem,
    DashboardEvolucionData,
    DashboardCotizacionesDiariasData,
    DashboardFilters,
    DashboardMetricas 
} from '~/types/dashboard'

export function useDashboardUsuario() {
    // Estado reactivo
    const loading = ref(true) // Iniciar en true para mostrar skeleton al cargar la página
    const resumenData = ref<DashboardResumenItem[]>([])
    const vendedoresData = ref<DashboardVendedorItem[]>([])
    const evolucionData = ref<DashboardEvolucionData | null>(null)
    const cotizacionesDiariasData = ref<DashboardCotizacionesDiariasData | null>(null)
    const filtrosContenedores = ref<DashboardFiltroContenedor[]>([])
    const filtrosVendedores = ref<DashboardFiltroVendedor[]>([])
    const totales = ref({
        total_clientes: 0,
        volumenes: {
            china: 0,
            total: 0,
            vendido: 0,
            pendiente: 0
        },
        totales: {
            impuestos: 0,
            logistica: 0,
            fob: 0
        }
    })

    // Filtros actuales (sin id_vendedor ya que es por usuario)
    const filters = ref<DashboardFilters>({
        fecha_inicio: '',
        fecha_fin: '',
        id_vendedor: undefined,
        id_contenedor: undefined
    })

    // Computed properties para métricas principales
    const metricas = computed((): DashboardMetricas => ({
        volumenChina: totales.value.volumenes.china,
        volumenVendido: totales.value.volumenes.vendido,
        volumenPendiente: totales.value.volumenes.pendiente,
        totalVentas: totales.value.totales.fob,
        totalImpuestos: totales.value.totales.impuestos,
        totalLogistica: totales.value.totales.logistica
    }))

    // Computed para datos de gráficos
    const datosGraficoVolumenes = computed(() => {
        if (!evolucionData.value) return []
        
        return evolucionData.value.evolucion.map(item => ({
            contenedor: item.contenedor.carga,
            volumenChina: item.volumenes.china,
            volumenVendido: item.volumenes.vendido,
            volumenPendiente: item.volumenes.pendiente
        }))
    })

    const datosGraficoVendedores = computed(() => {
        return vendedoresData.value.map(item => ({
            vendedor: item.vendedor,
            volumenTotal: item.volumenes.total,
            volumenVendido: item.volumenes.vendido,
            volumenPendiente: item.volumenes.pendiente
        }))
    })

    const datosGraficoProgresoDiario = computed(() => {
        if (!cotizacionesDiariasData.value) return null
        return cotizacionesDiariasData.value.chart
    })

    // Métodos de carga de datos
    const loadResumen = async () => {
        try {
            const response = await DashboardUsuarioService.getResumen(filters.value)
            if (response.success) {
                resumenData.value = response.data
                totales.value = response.totales
            }
        } catch (error) {
            console.error('Error al cargar resumen:', error)
        }
    }

    const loadVendedores = async () => {
        try {
            const response = await DashboardUsuarioService.getPorVendedor(filters.value)
            if (response.success) {
                
                vendedoresData.value = response.data
            }
        } catch (error) {
            console.error('Error al cargar datos de vendedores:', error)
        }
    }

    const loadEvolucionVolumenes = async () => {
        try {
            const response = await DashboardUsuarioService.getEvolucionTotal(filters.value)
            if (response.success) {
                evolucionData.value = response.data
                // Actualizar métricas con datos de evolución
                totales.value.volumenes = response.data.totales.volumenes
            }
        } catch (error) {
            console.error('Error al cargar evolución de volúmenes:', error)
        }
    }

    const loadFiltrosContenedores = async () => {
        try {
            const response = await DashboardUsuarioService.getFiltrosContenedores(filters.value)
            if (response.success) {
                // Agregar opción "Todos" al inicio
                filtrosContenedores.value = [
                    { value: null, label: 'Todos los contenedores' },
                    ...response.data
                ]
            }
        } catch (error) {
            console.error('Error al cargar filtros de contenedores:', error)
        }
    }

    const loadFiltrosVendedores = async () => {
        try {
            const response = await DashboardUsuarioService.getFiltrosVendedores(filters.value)
            if (response.success) {
                // Agregar opción "Todos" al inicio
                filtrosVendedores.value = [
                    { value: null, label: 'Todos los vendedores' },
                    ...response.data
                ]
            }
        } catch (error) {
            console.error('Error al cargar filtros de vendedores:', error)
        }
    }

    const loadCotizacionesDiarias = async () => {
        try {
            const response = await DashboardUsuarioService.getCotizacionesConfirmadasPorVendedorPorDia(filters.value)
            if (response.success) {
                cotizacionesDiariasData.value = response.data
            }
        } catch (error) {
            console.error('Error al cargar cotizaciones diarias:', error)
        }
    }

    // Método para cargar todos los datos
    const loadDashboardData = async () => {
        loading.value = true
        try {
            await Promise.all([
                loadResumen(),
                loadEvolucionVolumenes(),
                loadCotizacionesDiarias(),
                loadFiltrosContenedores()
            ])
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error)
        } finally {
            loading.value = false
        }
    }

    // Métodos de filtros
    const updateFilters = (newFilters: Partial<DashboardFilters>) => {
        // Limpiar valores null para que no se envíen al servicio
        const cleanedFilters = Object.fromEntries(
            Object.entries(newFilters).filter(([key, value]) => value !== null && value !== undefined && value !== '')
        )
        
        filters.value = { ...filters.value, ...cleanedFilters }
        
        // Si se seleccionó "Todos" (null), eliminar el filtro correspondiente
        if (newFilters.id_contenedor === null) {
            delete filters.value.id_contenedor
        }
        // No permitir filtrar por vendedor en dashboard de usuario
        if (newFilters.id_vendedor !== undefined) {
            delete filters.value.id_vendedor
        }
        
        loadDashboardData()
    }

    const resetFilters = () => {
        filters.value = {
            fecha_inicio: '',
            fecha_fin: '',
            id_vendedor: undefined,
            id_contenedor: undefined
        }
        loadDashboardData()
    }

    // Métodos de utilidad
   

    const formatVolume = (volume: number) => {
        return `${volume.toFixed(2)} m³`
    }

    const formatPercentage = (percentage: number) => {
        return `${percentage.toFixed(1)}%`
    }

    return {
        // Estado
        loading,
        resumenData,
        vendedoresData,
        evolucionData,
        cotizacionesDiariasData,
        filtrosContenedores,
        filtrosVendedores,
        totales,
        filters,

        // Computed
        metricas,
        datosGraficoVolumenes,
        datosGraficoVendedores,
        datosGraficoProgresoDiario,

        // Métodos
        loadDashboardData,
        loadResumen,
        loadVendedores,
        loadEvolucionVolumenes,
        loadCotizacionesDiarias,
        loadFiltrosContenedores,
        loadFiltrosVendedores,
        updateFilters,
        resetFilters,

        // Utilidades
        formatCurrency,
        formatVolume,
        formatPercentage
    }
}

