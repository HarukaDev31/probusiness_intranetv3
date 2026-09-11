import { ref } from 'vue'
import { CotizacionResumenService } from '~/services/cargaconsolidada/cotizacionResumenService'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'
import type {
  CotizacionResumenClienteOption,
  CotizacionResumenFilters,
  CrearCotizacionResumenRequest
} from '~/types/cargaconsolidada/cotizacion-resumen'

export function useCotizacionResumen() {
  const vendedoresOptions = ref<{ label: string; value: number }[]>([])
  const contenedoresOptions = ref<{ label: string; value: number; id_pais?: number; phone_code?: string | null }[]>([])
  const clientesOptions = ref<CotizacionResumenClienteOption[]>([])
  const buscandoClientes = ref(false)

  async function extraerDocumento(file: File) {
    return CotizacionResumenService.extraerDocumento(file)
  }

  async function searchClientes(q = '') {
    buscandoClientes.value = true
    try {
      const res = await CotizacionResumenService.searchClientes(q)
      clientesOptions.value = res.success ? (res.data || []) : []
      return clientesOptions.value
    } finally {
      buscandoClientes.value = false
    }
  }

  async function crearCotizacion(payload: CrearCotizacionResumenRequest) {
    return CotizacionResumenService.crearCotizacion(payload)
  }

  async function getCotizacion(id: number) {
    return CotizacionResumenService.getCotizacion(id)
  }

  async function actualizarCotizacion(id: number, payload: CrearCotizacionResumenRequest) {
    return CotizacionResumenService.actualizarCotizacion(id, payload)
  }

  async function duplicarCotizacion(id: number) {
    return CotizacionResumenService.duplicarCotizacion(id)
  }

  async function getCotizaciones(filters: CotizacionResumenFilters = {}) {
    return CotizacionResumenService.getCotizaciones(filters)
  }

  async function updateEstado(id: number, estado: 'COTIZADO' | 'CONFIRMADO') {
    return CotizacionResumenService.updateEstado(id, estado)
  }

  async function deleteCotizacion(id: number) {
    return CotizacionResumenService.deleteCotizacion(id)
  }

  async function loadVendedores() {
    try {
      const response = await CotizacionService.getVendedoresDropdown()
      vendedoresOptions.value = response.data || response
    } catch (error) {
      console.error('Error al obtener vendedores:', error)
      vendedoresOptions.value = []
    }
  }

  async function loadContenedores() {
    try {
      const response = await CotizacionService.getCargasDisponiblesDropdown()
      contenedoresOptions.value = response.data || response
    } catch (error) {
      console.error('Error al obtener cargas disponibles:', error)
      contenedoresOptions.value = []
    }
  }

  return {
    vendedoresOptions,
    contenedoresOptions,
    clientesOptions,
    buscandoClientes,
    searchClientes,
    extraerDocumento,
    crearCotizacion,
    getCotizacion,
    actualizarCotizacion,
    duplicarCotizacion,
    getCotizaciones,
    updateEstado,
    deleteCotizacion,
    loadVendedores,
    loadContenedores
  }
}
