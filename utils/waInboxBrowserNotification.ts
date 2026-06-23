import { waInboxConversationPath } from '~/utils/whatsappInboxRoute'
import {
  registrarServiceWorkerNotificaciones,
  solicitarPermisoNotificacionNavegador,
  permisoNotificacionNavegador,
  soporteTiNotificacionNavegadorSoportada
} from '~/utils/soporteTiBrowserNotification'

const ICONO_NOTIFICACION =
  'https://intranet.probusiness.pe/assets/img/logos/probusiness.png'

const MAX_CUERPO = 220

export {
  permisoNotificacionNavegador as permisoNotificacionNavegadorWaInbox,
  solicitarPermisoNotificacionNavegador as solicitarPermisoNotificacionNavegadorWaInbox,
  soporteTiNotificacionNavegadorSoportada as waInboxNotificacionNavegadorSoportada,
  registrarServiceWorkerNotificaciones as registrarServiceWorkerNotificacionesWaInbox
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

export interface OpcionesNotificacionNavegadorWaInbox {
  conversationId: number
  contactName: string
  messagePreview: string
  urlDetalle?: string
}

async function esperarServiceWorkerListo(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    await registrarServiceWorkerNotificaciones()
    return await navigator.serviceWorker.ready
  } catch (e) {
    console.warn('[WaInbox] Service worker no listo:', e)
    return null
  }
}

async function mostrarConServiceWorker(
  titulo: string,
  cuerpo: string,
  tag: string,
  path: string,
  icon?: string
): Promise<boolean> {
  const reg = await esperarServiceWorkerListo()
  if (!reg?.showNotification) return false

  const options: NotificationOptions = {
    body: cuerpo,
    tag,
    data: { url: path },
    requireInteraction: false,
    silent: false
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
  path: string
): void {
  const notif = new Notification(titulo, {
    body: cuerpo,
    icon,
    tag,
    silent: false
  })

  notif.onclick = (ev) => {
    ev.preventDefault()
    window.focus()
    notif.close()
    window.location.assign(path)
  }
}

export async function mostrarNotificacionNavegadorWaInbox(
  opts: OpcionesNotificacionNavegadorWaInbox
): Promise<boolean> {
  if (!soporteTiNotificacionNavegadorSoportada()) return false
  if (Notification.permission !== 'granted') return false
  if (!opts.conversationId && !opts.urlDetalle) return false

  const titulo = 'Tienes nuevos mensajes'
  const contacto = opts.contactName?.trim() || 'Contacto'
  const preview = truncarTexto(
    opts.messagePreview?.trim() || 'Nuevo mensaje en WhatsApp',
    MAX_CUERPO
  )
  const cuerpo = `${contacto}: ${preview}`
  const path = opts.urlDetalle || waInboxConversationPath(opts.conversationId)
  const tag = `wa-inbox-conv-${opts.conversationId || 'demo'}`
  const icon = iconoNotificacion()
  const tabVisible =
    typeof document !== 'undefined' && document.visibilityState === 'visible'

  // Pestaña visible: Notification API (más fiable en Windows).
  if (tabVisible) {
    try {
      mostrarConNotificationApi(titulo, cuerpo, tag, icon, path)
      return true
    } catch (e) {
      console.warn('[WaInbox] Notification API falló:', e)
    }
  }

  // Pestaña en segundo plano: service worker.
  try {
    const viaSw = await mostrarConServiceWorker(titulo, cuerpo, tag, path, icon)
    if (viaSw) return true
  } catch (e) {
    console.warn('[WaInbox] SW notification falló, probando Notification API:', e)
  }

  try {
    mostrarConNotificationApi(titulo, cuerpo, tag, icon, path)
    return true
  } catch (e) {
    console.warn('[WaInbox] No se pudo mostrar notificación del navegador:', e)
    return false
  }
}

export async function mostrarNotificacionPruebaWaInbox(): Promise<void> {
  await mostrarNotificacionNavegadorWaInbox({
    conversationId: 0,
    contactName: 'Demo',
    messagePreview: 'Verás un aviso cuando llegue un mensaje al WhatsApp Inbox.',
    urlDetalle: '/coordinacion/whatsapp-inbox'
  })
}

export function registrarSolicitudPermisoNotificacionWaInboxEnPrimerClic(): void {
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
