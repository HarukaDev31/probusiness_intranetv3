export interface Notification {
  id: number
  titulo: string
  mensaje: string
  descripcion?: string
  modulo: string
  navigate_to?: string
  navigate_params?: Record<string, any> | string // Puede ser objeto o string JSON
  tipo: 'info' | 'success' | 'warning' | 'error'
  icono?: string
  prioridad: 1 | 2 | 3 | 4 | 5
  referencia_tipo?: string
  referencia_id?: number
  fecha_creacion: string
  fecha_expiracion?: string
  creador: {
    id: number
    nombre: string
  }
  estado_usuario: {
    leida: boolean
    fecha_lectura?: string
    archivada: boolean
    fecha_archivado?: string
  }
}

export interface NotificationFilters {
  modulo?: string
  tipo?: 'info' | 'success' | 'warning' | 'error'
  prioridad_minima?: number
  no_leidas?: boolean
  per_page?: number
  page?: number
}

export interface NotificationCreateData {
  titulo: string
  mensaje: string
  modulo: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  prioridad: 1 | 2 | 3 | 4 | 5
  descripcion?: string
  configuracion_roles?: string[]
  rol_destinatario?: string
  usuario_destinatario?: number
  navigate_to?: string
  navigate_params?: Record<string, any>
  icono?: string
  referencia_tipo?: string
  referencia_id?: number
  fecha_expiracion?: string
}

export interface NotificationResponse {
  success: boolean
  data: {
    current_page: number
    data: Notification[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: any[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
    
  }
  conteos?: {
    total: number
    no_leidas: number
    leidas: number
  }
  message: string
}

export interface NotificationCountResponse {
  success: boolean
  data: {
    total_no_leidas: number
  }
}

export interface NotificationSingleResponse {
  success: boolean
  data: Notification
  message?: string
}

export interface NotificationActionResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

// Legacy types para compatibilidad con componentes existentes
export interface LegacyNotification {
  id: string
  title: string
  description: string
  status: 'read' | 'unread'
  category: string
  createdAt: Date
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationPriority = 1 | 2 | 3 | 4 | 5
export type NotificationStatus = 'read' | 'unread'