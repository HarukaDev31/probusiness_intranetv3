<template>
  <div>
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Módulos del Sistema</h1>
      <p class="text-gray-600">Accede a todas las herramientas y funcionalidades disponibles.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900">{{ moduleStats.totalModules }}</p>
              <p class="text-sm text-gray-500">Total Módulos</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900">{{ moduleStats.totalActive }}</p>
              <p class="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900">{{ moduleStats.totalCategories }}</p>
              <p class="text-sm text-gray-500">Categorías</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900">{{ moduleStats.totalSidebarItems }}</p>
              <p class="text-sm text-gray-500">En Sidebar</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories and Modules -->
      <div class="space-y-8">
        <div v-for="category in categories" :key="category.id" class="bg-white rounded-xl shadow-sm border border-gray-100">
          <!-- Category Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-4" :class="getCategoryColorClass(category.color)">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path :d="category.icon"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">{{ category.name }}</h2>
                  <p class="text-sm text-gray-500">{{ category.description }}</p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                {{ modulesByCategory[category.id]?.length || 0 }} módulos
              </div>
            </div>
          </div>

          <!-- Modules Grid -->
          <div class="p-6">
            <div v-if="modulesByCategory[category.id]?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                v-for="module in modulesByCategory[category.id]" 
                :key="module.id"
                class="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                @click="navigateToModule(module)"
              >
                <div class="flex items-center mb-4">
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center mr-4" :class="getModuleColorClass(module.color)">
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path :d="module.icon"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-gray-900">{{ module.name }}</h3>
                    <p class="text-sm text-gray-600">{{ module.description }}</p>
                  </div>
                </div>

                <!-- Module Stats -->
                <div v-if="module.stats" class="mb-4">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-500">Usuarios</p>
                      <p class="font-medium text-gray-900">{{ module.stats.totalUsers }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Operaciones</p>
                      <p class="font-medium text-gray-900">{{ module.stats.totalOperations }}</p>
                    </div>
                  </div>
                </div>

                <!-- Permissions -->
                <div class="flex flex-wrap gap-1 mb-4">
                  <span 
                    v-for="permission in module.permissions" 
                    :key="permission"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getPermissionColorClass(permission)"
                  >
                    {{ permission }}
                  </span>
                </div>

                <!-- Action Button -->
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Acceder
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <p class="text-gray-500">No hay módulos en esta categoría</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Module } from '../types/module'

// Composable para módulos
const { 
  modules, 
  categories, 
  loading, 
  error, 
  modulesByCategory, 
  fetchModules,
  getModuleStats 
} = useModules()

// Computed
const moduleStats = computed(() => getModuleStats())

// Cargar módulos al montar el componente
onMounted(() => {
  fetchModules()
})

// Métodos
const navigateToModule = (module: Module) => {
  if (module.route) {
    navigateTo(module.route)
  }
}

const getCategoryColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }
  return colorMap[color] || 'bg-gray-600'
}

const getModuleColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }
  return colorMap[color] || 'bg-gray-600'
}

const getPermissionColorClass = (permission: string) => {
  const permissionMap: Record<string, string> = {
    view: 'bg-blue-100 text-blue-800',
    create: 'bg-green-100 text-green-800',
    edit: 'bg-yellow-100 text-yellow-800',
    delete: 'bg-red-100 text-red-800',
    admin: 'bg-purple-100 text-purple-800'
  }
  return permissionMap[permission] || 'bg-gray-100 text-gray-800'
}
</script> 