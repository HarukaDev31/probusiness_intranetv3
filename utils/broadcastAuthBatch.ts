type AuthCallback = (error: Error | null, data: { auth: string } | null) => void

type PendingAuth = {
  socketId: string
  channelName: string
  callback: AuthCallback
}

const FLUSH_MS = 80

let queue: PendingAuth[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushEndpoint = ''
let flushHeaders: Record<string, string> = {}

function flushQueue() {
  const batch = queue
  const endpoint = flushEndpoint
  const headers = flushHeaders
  queue = []
  flushTimer = null
  if (!batch.length || !endpoint) return

  const bySocket = new Map<string, PendingAuth[]>()
  for (const item of batch) {
    const group = bySocket.get(item.socketId) || []
    group.push(item)
    bySocket.set(item.socketId, group)
  }

  bySocket.forEach((items, socketId) => {
    const channelNames = items.map((item) => item.channelName)
    fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        socket_id: socketId,
        channel_names: channelNames
      })
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          const error = new Error(body?.message || 'No se pudo autorizar los canales')
          items.forEach((item) => item.callback(error, null))
          return
        }

        const channels = body?.channels && typeof body.channels === 'object' ? body.channels : null
        items.forEach((item) => {
          const payload = channels ? channels[item.channelName] : body
          if (payload && typeof payload.auth === 'string') {
            item.callback(null, payload)
            return
          }
          item.callback(new Error(payload?.error || 'No autorizado para este canal'), null)
        })
      })
      .catch((error: unknown) => {
        const wrapped = error instanceof Error ? error : new Error('No se pudo autorizar los canales')
        items.forEach((item) => item.callback(wrapped, null))
      })
  })
}

/** Junta las autorizaciones de canales privados que salen juntas en una sola petición. */
export function createBroadcastAuthBatchHandler(endpoint: string, headers: Record<string, string>) {
  return (params: { socketId: string; channelName: string }, callback: AuthCallback) => {
    flushEndpoint = endpoint
    flushHeaders = headers
    queue.push({
      socketId: params.socketId,
      channelName: params.channelName,
      callback
    })
    if (flushTimer != null) return
    flushTimer = setTimeout(flushQueue, FLUSH_MS)
  }
}
