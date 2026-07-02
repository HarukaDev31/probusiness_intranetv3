import { ref, computed } from 'vue'
import { CotizadorDocumentacionService } from '~/services/cargaconsolidada/cotizadorDocumentacionService'
import type { CotizadorDocumentacionResponse } from '~/services/cargaconsolidada/cotizadorDocumentacionService'

export interface DocItem {
  id: number
  id_proveedor?: number | null
  tipo_documento: string
  folder_name?: string
  file_url: string
}

export interface ProveedorItem {
  id: number
  code_supplier: string
  products?: string
}

export interface ProveedorDocItem {
  id: number
  id_proveedor: number
  file_url: string
  orden: number
}

export const useCotizadorDocumentacion = () => {
  const cotizacion = ref<CotizadorDocumentacionResponse['data'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeTab = ref('')
  const tabs = ref<{ id: string; label: string; value: string }[]>([])
  const proveedores = ref<ProveedorItem[]>([])
  const proveedorActivo = ref<ProveedorItem | null>(null)

  const hasData = computed(() => cotizacion.value !== null)
  const hasProveedores = computed(() => proveedores.value.length > 0)
  const files = computed(() => cotizacion.value?.files ?? [])
  const proveedorDocumentos = computed(() => cotizacion.value?.proveedor_documentos ?? [])

  const getDocumentacion = async (idCotizacion: number) => {
    if (!idCotizacion) return
    loading.value = true
    error.value = null
    try {
      const response = await CotizadorDocumentacionService.getDocumentacion(idCotizacion)
      if (response.success && response.data) {
        cotizacion.value = response.data
        const providers = response.data.providers ?? []
        proveedores.value = providers
        tabs.value = providers.map((p: ProveedorItem) => ({
          id: String(p.id),
          label: p.code_supplier ?? '',
          value: String(p.id)
        }))
        if (providers.length > 0) {
          proveedorActivo.value = providers[0]
          activeTab.value = String(providers[0].id)
        }
      } else {
        error.value = 'Error al obtener la documentación'
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener la documentación'
      console.error('getDocumentacion:', err)
    } finally {
      loading.value = false
    }
  }

  const cambiarProveedor = (tabId: string) => {
    activeTab.value = tabId
    const p = proveedores.value.find((x: ProveedorItem) => String(x.id) === tabId)
    proveedorActivo.value = p ?? null
  }

  const docsPorProveedor = (idProveedor: number) =>
    proveedorDocumentos.value.filter((d: ProveedorDocItem) => d.id_proveedor === idProveedor)

  const uploadDocumento = async (formData: FormData) => {
    const res = await CotizadorDocumentacionService.uploadDocumento(formData)
    return res
  }

  const deleteDocumento = async (id: number) => {
    const res = await CotizadorDocumentacionService.deleteDocumento(id)
    return res
  }

  const batchDelete = async (payload: { document_ids?: number[]; proveedor_document_ids?: number[] }) => {
    const res = await CotizadorDocumentacionService.batchDelete(payload)
    return res
  }

  const sync = async (formData: FormData) => {
    const res = await CotizadorDocumentacionService.sync(formData)
    return res
  }

  const uploadProveedorDocumento = async (formData: FormData) => {
    const res = await CotizadorDocumentacionService.uploadProveedorDocumento(formData)
    return res
  }

  const deleteProveedorDocumento = async (id: number) => {
    const res = await CotizadorDocumentacionService.deleteProveedorDocumento(id)
    return res
  }

  const clearState = () => {
    cotizacion.value = null
    loading.value = false
    error.value = null
    activeTab.value = ''
    tabs.value = []
    proveedores.value = []
    proveedorActivo.value = null
  }

  return {
    cotizacion,
    loading,
    error,
    activeTab,
    tabs,
    proveedores,
    proveedorActivo,
    hasData,
    hasProveedores,
    files,
    proveedorDocumentos,
    getDocumentacion,
    cambiarProveedor,
    docsPorProveedor,
    uploadDocumento,
    deleteDocumento,
    batchDelete,
    sync,
    uploadProveedorDocumento,
    deleteProveedorDocumento,
    clearState
  }
}
