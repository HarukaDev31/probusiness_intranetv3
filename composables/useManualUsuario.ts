import { ManualUsuarioService } from '~/services/manualUsuarioService'
import type { ManualUsuarioContext, ManualUsuarioManualData } from '~/types/manualUsuario'

export const useManualUsuario = () => {
  const getContext = () => ManualUsuarioService.getContext()
  const getMyManual = () => ManualUsuarioService.getMyManual()
  const getRoleManual = (slug: string) => ManualUsuarioService.getRoleManual(slug)
  const downloadMyPdf = () => ManualUsuarioService.downloadMyPdf()
  const downloadRolePdf = (slug: string) => ManualUsuarioService.downloadRolePdf(slug)
  const downloadGlobalPdf = () => ManualUsuarioService.downloadGlobalPdf()
  const fetchAsset = (url: string) => ManualUsuarioService.fetchAsset(url)

  return {
    getContext,
    getMyManual,
    getRoleManual,
    downloadMyPdf,
    downloadRolePdf,
    downloadGlobalPdf,
    fetchAsset,
  }
}

export type { ManualUsuarioContext, ManualUsuarioManualData }
