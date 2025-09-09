export interface Notification {
  id: string
  title: string
  description: string
  status: 'unread' | 'read'
  category: 'Cliente' | 'Carga' | 'Aduanas' | 'Sistema'
  createdAt: Date
  updatedAt?: Date
}

export interface NotificationFilters {
  status?: 'unread' | 'read' | 'all'
  category?: 'Cliente' | 'Carga' | 'Aduanas' | 'Sistema' | 'all'
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
}

export type NotificationCategory = 'Cliente' | 'Carga' | 'Aduanas' | 'Sistema'
export type NotificationStatus = 'unread' | 'read'
