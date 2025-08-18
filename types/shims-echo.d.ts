declare module 'laravel-echo' {
  import { Channel as PusherChannel, PresenceChannel as PusherPresenceChannel } from 'pusher-js'

  export interface Channel extends PusherChannel {
    listen(event: string, callback: Function): Channel
    stopListening(event: string, callback?: Function): Channel
    subscribed(callback: Function): Channel
    error(callback: Function): Channel
  }

  export interface PresenceChannel<T = any> extends PusherPresenceChannel {
    here(callback: (members: T[]) => void): PresenceChannel<T>
    joining(callback: (member: T) => void): PresenceChannel<T>
    leaving(callback: (member: T) => void): PresenceChannel<T>
    error(callback: Function): PresenceChannel<T>
  }

  interface EchoOptions {
    broadcaster: string
    key?: string
    wsHost?: string
    wsPort?: number
    wssPort?: number
    forceTLS?: boolean
    encrypted?: boolean
    disableStats?: boolean
    cluster?: string
    enabledTransports?: string[]
    disabledTransports?: string[]
    authEndpoint?: string
    auth?: {
      headers?: Record<string, string>
    }
    [key: string]: any
  }

  export default class Echo {
    constructor(options: EchoOptions)
    
    channel(channel: string): Channel
    private(channel: string): Channel
    join(channel: string): PresenceChannel
    leave(channel: string): void
    disconnect(): void
    connect(): void
    socketId(): string | null
  }
}

declare global {
  interface Window {
    Pusher: any
  }
}