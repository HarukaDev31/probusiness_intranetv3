<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3">
      <li class="inline-flex items-center">
        <NuxtLink 
          to="/" 
          class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
        >
          <UIcon name="i-heroicons-home" class="w-4 h-4 mr-2" />
          Inicio
        </NuxtLink>
      </li>
      
      <li v-for="(breadcrumb, index) in breadcrumbs" :key="index">
        <div class="flex items-center">
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400 mx-2" />
                     <NuxtLink 
             v-if="breadcrumb.path && breadcrumb.isAccessible"
             :to="breadcrumb.path"
             class="text-sm font-medium text-gray-700 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
           >
             {{ breadcrumb.label }}
           </NuxtLink>
           <span 
             v-else
             class="text-sm font-medium text-gray-500 dark:text-gray-500 cursor-default"
           >
             {{ breadcrumb.label }}
           </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/auth/useAuth'

interface Breadcrumb {
  label: string
  path?: string
  isAccessible: boolean
}

const route = useRoute()
const { menu } = useAuth()

const breadcrumbs = computed((): Breadcrumb[] => {
  const pathSegments = route.path.split('/').filter(segment => segment)
  const breadcrumbs: Breadcrumb[] = []
  
  let currentPath = ''
  
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`
    
    // Mapear segmentos a nombres legibles
    const label = getBreadcrumbLabel(segment, i, pathSegments, route.params)
    
    // Verificar si la ruta es accesible
    const isAccessible = isRouteAccessible(currentPath, segment, i, pathSegments)
    
    breadcrumbs.push({
      label,
      path: i < pathSegments.length - 1 ? currentPath : undefined,
      isAccessible
    })
  }
  
  return breadcrumbs
})

function getBreadcrumbLabel(segment: string, index: number, allSegments: string[], params: any): string {
  // Mapear segmentos específicos
  const segmentMap: Record<string, string> = {
    'basedatos': 'Base de Datos',
    'clientes': 'Clientes',
    'productos': 'Productos',
    'regulaciones': 'Regulaciones',
    'antidumping': 'Antidumping',
    'documentos': 'Documentos',
    'etiquetado': 'Etiquetado',
    'permisos': 'Permisos',
    'archivos': 'Archivos',
    'cargaconsolidada': 'Carga Consolidada',
    'abiertos': 'Abiertos',
    'embarcados': 'Embarcados',
    'pasos': 'Pasos',
    'verificacion': 'Verificación',
    'consolidado': 'Consolidado',
    'curso': 'Curso',
    'modules': 'Módulos',
    'crear': 'Crear',
    'editar': 'Editar'
  }
  
  // Si es un parámetro dinámico (ID), mostrar un label especial
  if (segment.match(/^\d+$/) && params.id === segment) {
    const parentSegment = allSegments[index - 1]
    switch (parentSegment) {
      case 'clientes': return 'Detalle de Cliente'
      case 'productos': return 'Detalle de Producto'
      case 'antidumping': return 'Detalle de Antidumping'
      case 'permisos': return 'Detalle de Permiso'
      case 'consolidado': return 'Detalle de Consolidado'
      case 'curso': return 'Detalle de Curso'
      default: return `ID: ${segment}`
    }
  }
  
  // Retornar el mapeo o capitalizar el segmento
  return segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

function isRouteAccessible(path: string, segment: string, index: number, allSegments: string[]): boolean {
  // Buscar en el menú si existe una ruta con url_intranet_v2 válida
  const findAccessibleRoute = (menuItems: readonly any[]): boolean => {
    for (const item of menuItems) {
      // Verificar si el item tiene url_intranet_v2 válida
      if (item.url_intranet_v2 && item.url_intranet_v2 !== '/' && item.url_intranet_v2 !== '#') {
        const itemPath = '/' + item.url_intranet_v2.replace(/^\/+/, '')
        if (itemPath === path) {
          return true
        }
      }
      
      // Verificar en los hijos
      if (item.Hijos && item.Hijos.length > 0) {
        if (findAccessibleRoute(item.Hijos)) {
          return true
        }
      }
      
      // Verificar en los subhijos
      if (item.SubHijos && item.SubHijos.length > 0) {
        if (findAccessibleRoute(item.SubHijos)) {
          return true
        }
      }
    }
    return false
  }
  
  // Buscar en el menú principal
  return findAccessibleRoute(menu.value)
}
</script> 