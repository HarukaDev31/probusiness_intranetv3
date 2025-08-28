<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <!-- Sidebar -->
    <SidebarMenu v-model="sidebarVisible" :user="user" :menu-categories="sidebarCategories" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col transition-all duration-300" :class="sidebarVisible ? 'lg:ml-80' : ''">
      <!-- Top Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4">
          <!-- Breadcrumbs -->


          <!-- Title and Actions -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <UButton icon="i-heroicons-bars-3" variant="ghost" @click="toggleSidebar" class="mr-4" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 pt-6 px-6 bg-[#f0f4f9] dark:bg-gray-900">
        <div class="mb-3">
          <!-- <Breadcrumbs /> -->
        </div>
        <slot />
      </main>
    </div>

    <!-- Session Expired Modal -->
    <SessionExpiredModal />

    <!-- Global Notifications -->
    <GlobalNotifications />

    <!-- Modal Container -->
    <ModalContainer />

    <!-- Global Spinner -->
    <GlobalSpinner />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/auth/useAuth'
import SidebarMenu from '../components/SidebarMenu.vue'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import SessionExpiredModal from '../components/SessionExpiredModal.vue'
import GlobalNotifications from '../components/GlobalNotifications.vue'
import ModalContainer from '../components/ModalContainer.vue'
import GlobalSpinner from '../components/GlobalSpinner.vue'
import type { AuthMenu } from '../services/authService'
import type { SidebarCategory } from '../types/module'


const sidebarVisible = ref(true)

const pageTitle = computed(() => {
  const route = useRoute()

  // Ruta raíz
  if (route.path === '/') return 'Inicio'

  // Módulos
  if (route.path === '/modules') return 'Módulos'

  // Base de datos
  if (route.path.includes('/basedatos')) {
    // Clientes
    if (route.path.includes('/clientes')) {
      if (route.path.includes('/archivos')) return 'Archivos de Clientes'
      if (route.params.id) return 'Detalle de Cliente'
      return 'Clientes'
    }

    // Productos
    if (route.path.includes('/productos')) {
      if (route.params.id) return 'Detalle de Producto'
      return 'Productos'
    }

    // Regulaciones
    if (route.path.includes('/regulaciones')) {
      if (route.path.includes('/antidumping')) {
        if (route.path.includes('/crear')) return 'Crear Antidumping'
        if (route.path.includes('/editar')) return 'Editar Antidumping'
        if (route.params.id) return 'Detalle de Antidumping'
        return 'Antidumping'
      }

      if (route.path.includes('/documentos')) {
        if (route.path.includes('/crear')) return 'Crear Documento'
        if (route.path.includes('/editar')) return 'Editar Documento'
        return 'Documentos'
      }

      if (route.path.includes('/etiquetado')) {
        if (route.path.includes('/crear')) return 'Crear Etiquetado'
        if (route.path.includes('/editar')) return 'Editar Etiquetado'
        return 'Etiquetado'
      }

      if (route.path.includes('/permisos')) {
        if (route.path.includes('/crear')) return 'Crear Permiso'
        if (route.path.includes('/editar')) return 'Editar Permiso'
        if (route.params.id) return 'Detalle de Permiso'
        return 'Permisos'
      }

      return 'Regulaciones'
    }

    return 'Base de Datos'
  }

  // Carga Consolidada
  if (route.path.includes('/cargaconsolidada')) {
    if (route.path.includes('/abiertos')) {
      if (route.path.includes('/pasos')) return 'Pasos de Carga'
      return 'Carga Abiertos'
    }
    if (route.path.includes('/embarcados')) return 'Carga Embarcados'
    return 'Carga Consolidada'
  }

  // Verificación
  if (route.path.includes('/verificacion')) {
    if (route.path.includes('/consolidado')) return 'Verificación Consolidado'
    if (route.path.includes('/curso')) return 'Verificación Curso'
    return 'Verificación'
  }

  // Login
  if (route.path === '/login') return 'Iniciar Sesión'

  // Páginas de prueba
  if (route.path === '/ejemplo-modales') return 'Ejemplo de Modales'
  if (route.path === '/test-spinner') return 'Test Spinner'

  // Título por defecto basado en el path
  const pathSegments = route.path.split('/').filter(segment => segment)
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1]
    // Capitalizar primera letra y reemplazar guiones por espacios
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  return 'Página'
})

const { user, logout, initializeAuth, menu } = useAuth()

// Convertir menús del login al formato del sidebar
const sidebarCategories = computed(() => {
  const backend = menu.value ?? []

  // Mapear padres -> módulos (cada padre tiene children: Hijos -> SubHijos)
  const modules = (backend as any[]).map((p: any) => {
    const parentId = String(p.ID_Menu ?? p.id ?? '')
    const parentName = p.No_Menu ?? p.Nombre ?? p.name ?? 'Sin nombre'
    const parentIcon = convertIconToHeroicons(p.Txt_Css_Icons)
    const parentRouteRaw = p.No_Menu_Url ?? p.Ruta ?? p.route ?? ''
    const parentRoute = (parentRouteRaw === '#' || parentRouteRaw === '') ? '' : convertUrlToRoute(parentRouteRaw, p.url_intranet_v2)

    const children = (p.Hijos ?? []).map((h: any) => {
      const childId = String(h.ID_Menu ?? h.id ?? '')
      const childName = h.No_Menu ?? h.Nombre ?? h.name ?? 'Sin nombre'
      const childIcon = convertIconToHeroicons(h.Txt_Css_Icons)
      const childRouteRaw = h.No_Menu_Url ?? h.Ruta ?? h.route ?? ''
      const childRoute = (childRouteRaw === '#' || childRouteRaw === '') ? '' : convertUrlToRoute(childRouteRaw, h.url_intranet_v2)

      const subChildren = (h.SubHijos ?? []).map((s: any) => {
        const sId = String(s.ID_Menu ?? s.id ?? '')
        const sName = s.No_Menu ?? s.Nombre ?? s.name ?? 'Sin nombre'
        const sIcon = convertIconToHeroicons(s.Txt_Css_Icons)
        const sRouteRaw = s.No_Menu_Url ?? s.Ruta ?? s.route ?? ''
        const sRoute = (sRouteRaw === '#' || sRouteRaw === '') ? '' : convertUrlToRoute(sRouteRaw, s.url_intranet_v2)
        return {
          id: sId,
          name: sName,
          icon: sIcon,
          route: sRoute || '',
          // propiedades extra requeridas por SidebarModule
          category: parentName,
          categoryId: parentId,
          order: s.Nu_Orden ?? 0,
          isVisible: true,
          hasNotifications: false,
          notificationCount: 0,
          permissions: ['view'],
          children: []
        }
      })

      return {
        id: childId,
        name: childName,
        icon: childIcon,
        route: childRoute || '',
        category: parentName,
        categoryId: parentId,
        order: h.Nu_Orden ?? 0,
        isVisible: true,
        hasNotifications: false,
        notificationCount: 0,
        permissions: ['view'],
        children: subChildren
      }
    })

    // Padre como módulo (si no tiene ruta, route = '' => será toggle)
    return {
      id: parentId,
      name: parentName,
      icon: parentIcon,
      route: parentRoute || '',
      category: parentName,
      categoryId: parentId,
      order: p.Nu_Orden ?? 0,
      isVisible: true,
      hasNotifications: false,
      notificationCount: 0,
      permissions: ['view'],
      children
    }
  })

  // Una sola categoría que contiene todos los módulos padre (para que SidebarMenu los muestre como botones)
  return [
    {
      id: 'main',
      name: 'Menú',
      icon: null,
      color: 'gray',
      order: 0,
      isVisible: true,
      modules
    } as SidebarCategory
  ]
})

// Función para convertir iconos de FontAwesome a Heroicons
const convertIconToHeroicons = (faIcon: string): string => {
  const iconMap: Record<string, string> = {
    'fa fa-home': 'i-heroicons-home',
    'fas fa-boxes': 'solar:box-outline',
    'fa fa-list': 'i-heroicons-document-text',
    'fa fa-file-excel': 'vscode-icons:file-type-excel',
    'fa fa-file-pdf' : 'vscode-icons:file-type-pdf',
    'fa fa-users': 'i-heroicons-users',
    'fa fa-cog': 'i-heroicons-cog-6-tooth',
    'fa fa-chart-bar': 'i-heroicons-chart-bar',
    'fa fa-shopping-cart': 'i-heroicons-shopping-cart',
    'fa fa-truck': 'i-heroicons-truck',
    'fa fa-warehouse': 'i-heroicons-building-office',
    'fa fa-ship': 'i-heroicons-truck',
    'fa fa-plane': 'i-heroicons-paper-airplane',
    'fa fa-file': 'i-heroicons-document',
    'fa fa-folder': 'i-heroicons-folder',
    'fa fa-database': 'i-heroicons-circle-stack',
    'bi bi-clipboard': 'i-heroicons-clipboard',
    'fa fa-user': 'mdi:account-box-outline'
  }

  return iconMap[faIcon] || ''
}

// Función para convertir URLs a rutas de Nuxt
const convertUrlToRoute = (menuUrl: string, intranetUrl?: string | null): string => {
  // Priorizar url_intranet_v2 si existe
  if (intranetUrl && intranetUrl !== "/") {
    return `/${intranetUrl}`
  }

  // Mapear URLs específicas del backend
  const urlMap: Record<string, string> = {
    'InicioController': '/',
    'BaseDatos/ProductosController/index': '/basedatos/productos',
    'BaseDatos/RegulacionesController/index': '/basedatos/regulaciones',
    'CargaConsolidada/ContenedorConsolidado/listar': '/carga-consolidada',
    'CargaConsolidada/ContenedorConsolidado/listarCompletados': '/carga-consolidada/completados'
  }

  return urlMap[menuUrl] || '/'
}

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

onMounted(async () => {
  console.log('Layout mounted, initializing...')
  await initializeAuth()
  console.log('Auth initialized, menu loaded:', menu.value)
  console.log('Sidebar categories:', sidebarCategories.value)
})
</script>