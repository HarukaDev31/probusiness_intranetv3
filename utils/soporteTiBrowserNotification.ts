const ICONO_NOTIFICACION =
  'https://intranet.probusiness.pe/assets/img/logos/probusiness.png'

const SW_PATH = '/soporte-ti-notifications-sw.js'
const MAX_CUERPO = 220

export type SoporteTiNotificacionNavegadorKind = 'mensaje' | 'estado'

let swRegistro: Promise<ServiceWorkerRegistration | null> | null = null

export function soporteTiNotificacionNavegadorSoportada(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permisoNotificacionNavegador(): NotificationPermission | 'unsupported' {
  if (!soporteTiNotificacionNavegadorSoportada()) return 'unsupported'
  return Notification.permission
}

export async function solicitarPermisoNotificacionNavegador(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!soporteTiNotificacionNavegadorSoportada()) return 'unsupported'
  if (Notification.permission === 'granted') {
    await registrarServiceWorkerNotificaciones()
    return 'granted'
  }
  if (Notification.permission === 'denied') return 'denied'
  try {
    const permiso = await Notification.requestPermission()
    if (permiso === 'granted') {
      await registrarServiceWorkerNotificaciones()
    }
    return permiso
  } catch {
    return 'denied'
  }
}

export async function registrarServiceWorkerNotificaciones(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!swRegistro) {
    swRegistro = navigator.serviceWorker
      .register(SW_PATH, { scope: '/' })
      .then((reg) => reg)
      .catch((e) => {
        console.warn('[SoporteTI] SW de notificaciones no registrado:', e)
        return null
      })
  }
  return swRegistro
}

function truncarTexto(texto: string, max: number): string {
  const t = texto.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function iconoNotificacion(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return undefined
  return ICONO_NOTIFICACION
}

function urlAbsoluta(path: string): string {
  if (typeof window === 'undefined') return path
  if (path.startsWith('http')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

export interface OpcionesNotificacionNavegadorSoporteTi {
  chatUuid: string
  codigo: string
  title: string
  message: string
  kind?: SoporteTiNotificacionNavegadorKind
  urlDetalle?: string
  onClick?: () => void
}

async function mostrarConServiceWorker(
  titulo: string,
  cuerpo: string,
  tag: string,
  urlDetalle: string,
  icon?: string
): Promise<boolean> {
  const reg = await registrarServiceWorkerNotificaciones()
  if (!reg?.showNotification) return false

  const data: Record<string, string> = { url: urlDetalle }
  const options: NotificationOptions = {
    body: cuerpo,
    tag,
    data,
    requireInteraction: false
  }
  if (icon) options.icon = icon

  await reg.showNotification(titulo, options)
  return true
}

function mostrarConNotificationApi(
  titulo: string,
  cuerpo: string,
  tag: string,
  icon: string | undefined,
  onClick?: () => void
): void {
  const notif = new Notification(titulo, {
    body: cuerpo,
    icon,
    tag
  })

  notif.onclick = (ev) => {
    ev.preventDefault()
    window.focus()
    notif.close()
    onClick?.()
  }
}

/**
 * Toast del sistema (Windows) para mensajes de chat Soporte TI.
 */
export async function mostrarNotificacionNavegadorSoporteTi(
  opts: OpcionesNotificacionNavegadorSoporteTi
): Promise<boolean> {
  if (!soporteTiNotificacionNavegadorSoportada()) return false
  if (Notification.permission !== 'granted') return false
  if (!opts.chatUuid) return false
  if (opts.kind === 'estado') return false

  const titulo =
    opts.title?.trim() || (opts.codigo ? `Nuevo mensaje — ${opts.codigo}` : 'Nuevo mensaje')
  const cuerpo = truncarTexto(
    opts.message?.trim() || 'Tienes un mensaje nuevo en el chat.',
    MAX_CUERPO
  )
  const tag = `soporte-ti-chat-${opts.chatUuid}`
  const path = opts.urlDetalle || `/soporte-ti/${encodeURIComponent(opts.chatUuid)}`
  const urlAbs = urlAbsoluta(path)
  const icon = iconoNotificacion()

  const onClick = () => {
    window.focus()
    opts.onClick?.()
    if (!opts.onClick) {
      window.location.assign(path)
    }
  }

  try {
    const viaSw = await mostrarConServiceWorker(titulo, cuerpo, tag, path, icon)
    if (viaSw) return true
    mostrarConNotificationApi(titulo, cuerpo, tag, icon, onClick)
    return true
  } catch (e) {
    console.warn('[SoporteTI] No se pudo mostrar notificación del navegador:', e)
    return false
  }
}

/** Prueba rápida tras conceder permiso. */
export async function mostrarNotificacionPruebaSoporteTi(): Promise<void> {
  await mostrarNotificacionNavegadorSoporteTi({
    chatUuid: 'prueba',
    codigo: 'DEMO',
    title: 'Notificaciones activadas',
    message: 'Verás un aviso en Windows cuando llegue un mensaje al chat.',
    kind: 'mensaje',
    urlDetalle: '/soporte-ti'
  })
}

export function registrarSolicitudPermisoNotificacionEnPrimerClic(): void {
  if (typeof document === 'undefined') return
  if (!soporteTiNotificacionNavegadorSoportada()) return
  if (Notification.permission !== 'default') return
  if (!localStorage.getItem('auth_token')) return

  const handler = () => {
    document.removeEventListener('click', handler, true)
    void solicitarPermisoNotificacionNavegador()
  }
  document.addEventListener('click', handler, true)
}
