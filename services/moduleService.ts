import type { 
  Module, 
  ModuleCategory, 
  ModuleResponse, 
  ModulesResponse,
  SidebarCategory,
  SidebarResponse,
  SidebarModule
} from '../types/module'

class ModuleService {
  private static instance: ModuleService
  private modules: Module[] = []
  private categories: ModuleCategory[] = []
  private sidebarCategories: SidebarCategory[] = []

  private constructor() {
    this.initializeData()
  }

  public static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService()
    }
    return ModuleService.instance
  }

  private initializeData(): void {
    // Datos estáticos para desarrollo
    this.categories = [
      {
        id: 'logistics',
        name: 'Logística',
        description: 'Gestión de importaciones y exportaciones',
        icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
        color: 'blue',
        order: 1,
        isVisible: true,
        modules: []
      },
      {
        id: 'administration',
        name: 'Administración',
        description: 'Gestión administrativa y financiera',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'green',
        order: 2,
        isVisible: true,
        modules: []
      },
      {
        id: 'hr',
        name: 'Recursos Humanos',
        description: 'Gestión de empleados y personal',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'purple',
        order: 3,
        isVisible: true,
        modules: []
      }
    ]

    this.modules = [
      {
        id: 'consolidated-load',
        name: 'Carga Consolidada',
        description: 'Gestión de cargas consolidadas y contenedores',
        icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
        color: 'blue',
        category: 'Logística',
        categoryId: 'logistics',
        route: '/modules/consolidated-load',
        isActive: true,
        isVisible: true,
        order: 1,
        permissions: ['view', 'create', 'edit', 'delete'],
        features: [
          {
            id: 'tracking',
            name: 'Seguimiento',
            description: 'Seguimiento de contenedores',
            route: '/modules/consolidated-load/tracking',
            icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3',
            isActive: true,
            permissions: ['view', 'edit']
          }
        ],
        stats: {
          totalUsers: 25,
          totalOperations: 150,
          lastActivity: '2024-01-15T10:30:00Z',
          successRate: 95.5
        },
        lastAccessed: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'imports',
        name: 'Importaciones',
        description: 'Gestión de importaciones y documentación',
        icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
        color: 'green',
        category: 'Logística',
        categoryId: 'logistics',
        route: '/modules/imports',
        isActive: true,
        isVisible: true,
        order: 2,
        permissions: ['view', 'create', 'edit'],
        features: [
          {
            id: 'documents',
            name: 'Documentos',
            description: 'Gestión de documentación',
            route: '/modules/imports/documents',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            isActive: true,
            permissions: ['view', 'create', 'edit']
          }
        ],
        stats: {
          totalUsers: 18,
          totalOperations: 89,
          lastActivity: '2024-01-14T16:45:00Z',
          successRate: 92.3
        },
        lastAccessed: '2024-01-14T16:45:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-14T16:45:00Z'
      },
      {
        id: 'users',
        name: 'Gestión de Usuarios',
        description: 'Administración de usuarios del sistema',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'purple',
        category: 'Administración',
        categoryId: 'administration',
        route: '/modules/users',
        isActive: true,
        isVisible: true,
        order: 1,
        permissions: ['view', 'create', 'edit', 'delete'],
        features: [
          {
            id: 'roles',
            name: 'Roles y Permisos',
            description: 'Gestión de roles y permisos',
            route: '/modules/users/roles',
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            isActive: true,
            permissions: ['view', 'edit']
          }
        ],
        stats: {
          totalUsers: 12,
          totalOperations: 45,
          lastActivity: '2024-01-15T09:15:00Z',
          successRate: 98.7
        },
        lastAccessed: '2024-01-15T09:15:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T09:15:00Z'
      }
    ]

    // Configurar sidebar
    this.sidebarCategories = [
      {
        id: 'menu',
        name: 'Menú',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
        color: 'gray',
        order: 1,
        isVisible: true,
        modules: [
          {
            id: 'home',
            name: 'Inicio',
            icon: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z',
            route: '/',
            category: 'Menú',
            categoryId: 'menu',
            order: 1,
            isVisible: true,
            hasNotifications: false,
            notificationCount: 0,
            permissions: ['view']
          },
          
        ]
      },
      {
        id: 'preferences',
        name: 'Preferencias',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        color: 'gray',
        order: 2,
        isVisible: true,
        modules: [
          {
            id: 'notifications',
            name: 'Notificaciones',
            icon: 'M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z',
            route: '/notifications',
            category: 'Preferencias',
            categoryId: 'preferences',
            order: 1,
            isVisible: true,
            hasNotifications: true,
            notificationCount: 5,
            permissions: ['view']
          },
          {
            id: 'dark-mode',
            name: 'Modo oscuro',
            icon: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z',
            route: '/settings/theme',
            category: 'Preferencias',
            categoryId: 'preferences',
            order: 2,
            isVisible: true,
            hasNotifications: false,
            notificationCount: 0,
            permissions: ['view']
          }
        ]
      }
    ]

    // Asignar módulos a categorías
    this.categories.forEach(category => {
      category.modules = this.modules.filter(module => module.categoryId === category.id)
    })
  }

  // Métodos para obtener datos
  async getAllModules(): Promise<ModulesResponse> {
    try {
      // Aquí iría la llamada a la API
      // const response = await $fetch('/api/modules')
      
      return {
        success: true,
        data: {
          categories: this.categories,
          modules: this.modules,
          sidebar: this.sidebarCategories
        }
      }
    } catch (error) {
      return {
        success: false,
        data: { categories: [], modules: [], sidebar: [] },
        error: 'Error al obtener módulos'
      }
    }
  }

  async getSidebarModules(): Promise<SidebarResponse> {
    try {
      // Aquí iría la llamada a la API
      // const response = await $fetch('/api/sidebar')
      
      return {
        success: true,
        data: this.sidebarCategories
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Error al obtener sidebar'
      }
    }
  }

  async getModuleById(id: string): Promise<ModuleResponse> {
    try {
      const module = this.modules.find(m => m.id === id)
      if (!module) {
        return {
          success: false,
          data: {} as Module,
          error: 'Módulo no encontrado'
        }
      }

      return {
        success: true,
        data: module
      }
    } catch (error) {
      return {
        success: false,
        data: {} as Module,
        error: 'Error al obtener módulo'
      }
    }
  }

  async getModulesByCategory(categoryId: string): Promise<Module[]> {
    return this.modules.filter(module => module.categoryId === categoryId)
  }

  async getCategories(): Promise<ModuleCategory[]> {
    return this.categories
  }

  // Métodos para estadísticas
  getTotalModules(): number {
    return this.modules.length
  }

  getActiveModules(): Module[] {
    return this.modules.filter(module => module.isActive && module.isVisible)
  }

  getModulesByPermission(permission: string): Module[] {
    return this.modules.filter(module => 
      module.isActive && 
      module.isVisible && 
      module.permissions.includes(permission)
    )
  }
}

export default ModuleService 