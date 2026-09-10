import { ManualUsuarioService } from '~/services/manualUsuarioService'
import type {
  ManualCapturaCatalogItem,
  ManualCapturaUpdatePayload,
  ManualCapturaUpdateResult,
} from '~/types/manualUsuario'

export function useManualCapturas() {
  const catalog = ref<ManualCapturaCatalogItem[]>([])
  const loading = ref(false)

  const loadCatalog = async () => {
    loading.value = true
    try {
      catalog.value = await ManualUsuarioService.adminListCapturas()
    } finally {
      loading.value = false
    }
  }

  const assignCaptura = async (
    blockId: number,
    payload: { media_id?: number | null; capture_key?: string | null }
  ) => {
    return ManualUsuarioService.adminAssignCaptura(blockId, payload)
  }

  const updateCaptura = async (payload: ManualCapturaUpdatePayload): Promise<ManualCapturaUpdateResult> => {
    const result = await ManualUsuarioService.adminUpdateCaptura(payload)
    if (result.item) {
      const idx = catalog.value.findIndex((entry) => {
        if (result.item?.media_id && entry.media_id === result.item.media_id) return true
        if (result.item?.capture_key && entry.capture_key === result.item.capture_key) return true
        return String(entry.id) === String(result.item?.id)
      })
      if (idx >= 0) catalog.value[idx] = result.item
      else catalog.value = [result.item, ...catalog.value]
    } else {
      await loadCatalog()
    }
    return result
  }

  return {
    catalog,
    loading,
    loadCatalog,
    assignCaptura,
    updateCaptura,
  }
}
