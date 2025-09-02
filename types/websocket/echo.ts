import { Channel, PresenceChannel } from 'laravel-echo'

export interface EchoConfig {
  broadcaster?: string
  key?: string
  wsHost?: string
  wsPort?: number
  forceTLS?: boolean
  cluster?: string
  enabledTransports?: string[]
  authEndpoint?: string
  auth?: {
    headers: {
      Authorization?: string
      Accept?: string
      'X-CSRF-TOKEN'?: string
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
