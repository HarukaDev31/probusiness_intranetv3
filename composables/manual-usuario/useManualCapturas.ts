import { ManualUsuarioService } from '~/services/manualUsuarioService'
import type { ManualCapturaCatalogItem } from '~/types/manualUsuario'

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

  return {
    catalog,
    loading,
    loadCatalog,
    assignCaptura,
  }
}
