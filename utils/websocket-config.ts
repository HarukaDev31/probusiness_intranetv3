import type { EchoConfig } from '~/types/websocket/echo'

export type EchoClientConfig = EchoConfig & {
  bearerToken?: string | null
  disableStats?: boolean
  wssPort?: number
  channelAuthorization?: {
    endpoint: string
    transport: 'ajax' | 'jsonp'
    headers?: Record<string, string>
  }
}

function parseHostPort(value: string): { host: string; port?: number } {
  const trimmed = value.trim()
  if (!trimmed) return { host: '' }

  if (trimmed.includes('://')) {
    const url = new URL(trimmed)
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined
    }
  }

  if (trimmed.includes(':')) {
    const [host, portStr] = trimmed.split(':')
    const port = Number(portStr)
    return { host, port: Number.isFinite(port) ? port : undefined }
  }

  return { host: trimmed }
}

/** URL de autorización de canales privados (Laravel broadcasting). */
export function getBroadcastingAuthUrl(): string {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  return `${apiBase}/api/broadcasting/auth`
}

/**
 * Configuración de Echo/Pusher para el cliente.
 * Usa apiBaseUrl para auth (mismo origen que la API) y separa host/puerto del WebSocket.
 */
export function buildEchoClientConfig(authToken: string | null): EchoClientConfig {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  const useTls = apiBase.startsWith('https://')
  const authEndpoint = getBroadcastingAuthUrl()

  const headers: Record<string, string> = {
    Accept: 'application/json'
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const echoConfig: EchoClientConfig = {
    broadcaster: 'pusher',
    key: String(config.public.pusherAppKey || 'local').trim(),
    cluster: String(config.public.pusherAppCluster || 'mt1').trim(),
    enabledTransports: ['ws', 'wss'],
    forceTLS: useTls,
    disableStats: true,
    authEndpoint,
    bearerToken: authToken,
    auth: { headers },
    channelAuthorization: {
      endpoint: authEndpoint,
      transport: 'ajax',
      headers: { ...headers }
    }
  }

  const wsRaw = String(config.public.pusherWsHost || '').trim()
  if (wsRaw) {
    const { host, port } = parseHostPort(wsRaw)
    if (host) {
      echoConfig.wsHost = host
      const resolvedPort = port ?? (useTls ? 443 : 80)
      echoConfig.wsPort = resolvedPort
      echoConfig.wssPort = resolvedPort
      echoConfig.forceTLS = useTls
    }
  }

  return echoConfig
}

export const getWebSocketConfig = (): EchoConfig => buildEchoClientConfig(null)

export const validateWebSocketConfig = (): boolean => {
  const config = useRuntimeConfig()

  const missingVars = ['pusherAppKey', 'pusherAppCluster'].filter(
    (varName) => !config.public[varName as keyof typeof config.public]
  )

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars)
    return false
  }

  return true
}

export const testWebSocketConnectionAsync = async (): Promise<boolean> => {
  try {
    getWebSocketConfig()
    return validateWebSocketConfig()
  } catch (error) {
    console.error('❌ Error probando conexión WebSocket:', error)
    return false
  }
}
