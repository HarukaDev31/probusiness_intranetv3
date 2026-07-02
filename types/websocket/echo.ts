import { Channel, PresenceChannel } from 'laravel-echo'

export interface EchoConfig {
  broadcaster?: string
  key?: string
  wsHost?: string
  wsPort?: number
  wssPort?: number
  forceTLS?: boolean
  disableStats?: boolean
  cluster?: string
  enabledTransports?: string[]
  authEndpoint?: string
  bearerToken?: string | null
  channelAuthorization?: {
    endpoint: string
    transport: 'ajax' | 'jsonp'
    headers?: Record<string, string>
  }
  auth?: {
    headers: {
      Authorization?: string
      Accept?: string
      'X-CSRF-TOKEN'?: string
      [key: string]: string | undefined
    }
  }
}

export interface WebSocketChannel {
  name: string
  type: 'public' | 'private' | 'presence'
  handlers: {
    event: string
    callback: (data: any) => void
  }[]
}

export interface WebSocketRole {
  role: string
  channels: WebSocketChannel[]
}

export interface WebSocketEvent<T = any> {
  type: string
  data: T
}
