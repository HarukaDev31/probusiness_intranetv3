// Tipos para módulos del sistema
export interface Module {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  categoryId: string
  route: string
  isActive: boolean
  isVisible: boolean
  order: number
  permissions: string[]
  features: ModuleFeature[]
  stats?: ModuleStats
  lastAccessed?: string
  createdAt: string
  updatedAt: string
}

export interface ModuleCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  isVisible: boolean
  modules: Module[]
}

export interface ModuleFeature {
  id: string
  name: string
  description: string
  route: string
  icon: string
  isActive: boolean
  permissions: string[]
}

export interface ModuleStats {
  totalUsers: number
  totalOperations: number
  lastActivity: string
  successRate: number
}

export interface SidebarModule {
  id: string
  name: string
  icon: string
  route: string
  category: string
  categoryId: string
  order: number
  isVisible: boolean
  hasNotifications: boolean
  notificationCount: number
  permissions: string[]
  children?: SidebarModule[]
}

export interface SidebarCategory {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isVisible: boolean
  modules: SidebarModule[]
}

// Respuestas de API
export interface ModulesResponse {
  success: boolean
  data: {
    categories: ModuleCategory[]
    modules: Module[]
    sidebar: SidebarCategory[]
  }
  message?: string
  error?: string
}

export interface ModuleResponse {
  success: boolean
  data: Module
  message?: string
  error?: string
}

export interface SidebarResponse {
  success: boolean
  data: SidebarCategory[]
  message?: string
  error?: string
} 