import type {
  SoporteTiEnviarMensajePayload,
  SoporteTiMensaje,
  SoporteTiMensajeApi
} from '~/types/soporteTi'
import { formatSoporteTiMarcaTiempo } from '~/utils/formatters'

export type SoporteTiEstadoEnvio = 'pendiente' | 'enviando' | 'entregado' | 'error'

/** ID intranet del usuario logueado (`ID_Usuario`). */
export function authUserIdInt(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    const u = JSON.parse(raw) as {
      id?: number | string
      raw?: { ID_Usuario?: number | string; id?: number | string }
    }
    const id = u?.id ?? u?.raw?.ID_Usuario ?? u?.raw?.id
    if (id == null || id === '') return null
    const n = Number(id)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/**
 * `es_propio` en broadcast es del emisor; cada cliente lo recalcula con `usuario_id`.
 */
export function resolveEsPropioMensaje(m: SoporteTiMensajeApi): boolean {
  if (m.es_sistema) return false
  const uid = authUserIdInt()
  if (m.usuario_id != null && uid != null) {
    return Number(m.usuario_id) === uid
  }
  return m.es_propio === true
}

export function crearClientIdMensaje(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function crearIdOptimista(): number {
  return -Math.floor(Math.random() * 2_000_000_000) - 1
}

function etiquetaAhora(): string {
  return formatSoporteTiMarcaTiempo(new Date())
}

/** Mensaje local antes de confirmación del servidor / job. */
export function mensajeOptimistaDesdeEnvio(
  clientId: string,
  remitente: { nombre: string; iniciales: string; color: string },
  payload: SoporteTiEnviarMensajePayload,
  previews?: { url: string; nombre: string }[]
): SoporteTiMensaje {
  const tieneArchivos = (payload.imagenes?.length ?? 0) > 0
  return {
    id: crearIdOptimista(),
    clientId,
    remitente: remitente.nombre,
    iniciales: remitente.iniciales,
    color: remitente.color,
    texto: payload.texto?.trim() ?? '',
    esSistema: false,
    marcaTiempo: etiquetaAhora(),
    esPropio: true,
    replyToId: payload.replyToId ?? null,
    replyTo: null,
    imagenes: previews?.length
      ? previews.map((p) => ({ url: p.url, nombre: p.nombre, tamano: null }))
      : undefined,
    archivoNombre: tieneArchivos && !previews?.length ? payload.imagenes![0]!.name : null,
    estadoEnvio: 'pendiente',
    adjuntoPendiente: tieneArchivos
  }
}

export function estadoEnvioDesdeApi(
  m: SoporteTiMensaje,
  esPropio?: boolean
): SoporteTiEstadoEnvio | undefined {
  if (!esPropio && !m.esPropio) return undefined
  if (m.adjuntoPendiente) return 'enviando'
  return 'entregado'
}
