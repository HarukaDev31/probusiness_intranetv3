import type { 
  Module, 
  ModuleCategory, 
  ModulesResponse, 
  SidebarCategory,
  SidebarResponse 
} from '~/types/module'
import ModuleService from '~/services/moduleService'

export const useModules = () => {
  const modules = ref<Module[]>([])
  const categories = ref<ModuleCategory[]>([])
  const sidebarCategories = ref<SidebarCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const activeModules = computed(() => 
    modules.value.filter(module => module.isActive && module.isVisible)
  )

  const totalModules = computed(() => modules.value.length)

  const modulesByCategory = computed(() => {
    const grouped: Record<string, Module[]> = {}
    categories.value.forEach(category => {
      grouped[category.id] = modules.value.filter(
        module => module.categoryId === category.id && module.isVisible
      )
    })
    return grouped
  })

  const sidebarModules = computed(() => {
    const allModules: any[] = []
    sidebarCategories.value.forEach(category => {
      if (category.isVisible) {
        allModules.push(...category.modules.filter(module => module.isVisible))
      }
    })
    return allModules
  })

  // Methods
  const fetchModules = async () => {
    loading.value = true
    error.value = null
    
    try {
      const moduleService = ModuleService.getInstance()
      const response: ModulesResponse = await moduleService.getAllModules()
      
      if (response.success) {
        modules.value = response.data.modules
        categories.value = response.data.categories
        sidebarCategories.value = response.data.sidebar
      } else {
        error.value = response.error || 'Error al cargar módulos'
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error fetching modules:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchSidebar = async () => {
    console.log('fetchSidebar called')
    loading.value = true
    error.value = null
    
    try {
      const moduleService = ModuleService.getInstance()
      console.log('ModuleService instance created')
      const response: SidebarResponse = await moduleService.getSidebarModules()
      console.log('Sidebar response:', response)
      
      if (response.success) {
        sidebarCategories.value = response.data
        console.log('Sidebar categories set:', sidebarCategories.value)
      } else {
        error.value = response.error || 'Error al cargar sidebar'
        console.error('Sidebar error:', error.value)
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error fetching sidebar:', err)
    } finally {
      loading.value = false
      console.log('fetchSidebar completed')
    }
  }

  const getModuleById = (id: string) => {
    return modules.value.find(module => module.id === id)
  }

  const getModulesByCategory = (categoryId: string) => {
    return modules.value.filter(module => module.categoryId === categoryId)
  }

  const getModulesByPermission = (permission: string) => {
    return modules.value.filter(module => 
      module.isActive && 
      module.isVisible && 
      module.permissions.includes(permission)
    )
  }

  const getCategoryById = (id: string) => {
    return categories.value.find(category => category.id === id)
  }

  const getSidebarCategoryById = (id: string) => {
    return sidebarCategories.value.find(category => category.id === id)
  }

  const hasModulePermission = (moduleId: string, permission: string) => {
    const module = getModuleById(moduleId)
    return module?.permissions.includes(permission) || false
  }

  const getModuleStats = () => {
    const totalActive = activeModules.value.length
    const totalCategories = categories.value.filter(cat => cat.isVisible).length
    const totalSidebarItems = sidebarModules.value.length

    return {
      totalModules: totalModules.value,
      totalActive,
      totalCategories,
      totalSidebarItems
    }
  }

  return {
    // State
    modules: readonly(modules),
    categories: readonly(categories),
    sidebarCategories: readonly(sidebarCategories),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    activeModules,
    totalModules,
    modulesByCategory,
    sidebarModules,

    // Methods
    fetchModules,
    fetchSidebar,
    getModuleById,
    getModulesByCategory,
    getModulesByPermission,
    getCategoryById,
    getSidebarCategoryById,
    hasModulePermission,
    getModuleStats
  }
} 