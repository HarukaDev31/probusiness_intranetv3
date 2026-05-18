import type { SoporteTiSolicitud } from '~/types/soporteTi'

/** Ruta al detalle del ticket (prefiere id numérico del backend). */
export function rutaDetalleSoporteTi(solicitud: Pick<SoporteTiSolicitud, 'backendId' | 'chatUuid'>): string {
  if (solicitud.backendId != null) {
    return `/soporte-ti/${solicitud.backendId}`
  }
  if (solicitud.chatUuid) {
    return `/soporte-ti/${encodeURIComponent(solicitud.chatUuid)}`
  }
  return '/soporte-ti'
}

export function rutaDetalleSoporteTiPorChatUuid(
  chatUuid: string,
  resolver?: (uuid: string) => Pick<SoporteTiSolicitud, 'backendId' | 'chatUuid'> | null
): string {
  const local = resolver?.(chatUuid)
  if (local) return rutaDetalleSoporteTi(local)
  return `/soporte-ti/${encodeURIComponent(chatUuid)}`
}
