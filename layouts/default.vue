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
      <main class="flex-1 pt-6 px-6">
        <div class="mb-3">
          <Breadcrumbs />
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
import { useAuth } from '../composables/useAuth'
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
  const categories: SidebarCategory[] = []

  for (const menuItem of menu.value) {
    if (menuItem.ID_Padre === 0) { // Solo menús padre
      const category: SidebarCategory = {
        id: menuItem.ID_Menu.toString(),
        name: menuItem.No_Menu,
        icon: convertIconToHeroicons(menuItem.Txt_Css_Icons),
        color: 'gray',
        order: menuItem.Nu_Orden,
        isVisible: true,
        modules: []
      }

      // Agregar el menú padre como módulo principal
      if (menuItem.No_Menu_Url !== '#' && menuItem.url_intranet_v2 !== null) {
        category.modules.push({
          id: menuItem.ID_Menu.toString(),
          name: menuItem.No_Menu,
          icon: convertIconToHeroicons(menuItem.Txt_Css_Icons),
          route: convertUrlToRoute(menuItem.No_Menu_Url, menuItem.url_intranet_v2),
          category: menuItem.No_Menu,
          categoryId: menuItem.ID_Menu.toString(),
          order: menuItem.Nu_Orden,
          isVisible: true,
          hasNotifications: false,
          notificationCount: 0,
          permissions: ['view']
        })
      }

      // Agregar submenús
      for (const hijo of menuItem.Hijos) {
        category.modules.push({
          id: hijo.ID_Menu.toString(),
          name: hijo.No_Menu,
          icon: convertIconToHeroicons(hijo.Txt_Css_Icons),
          route: convertUrlToRoute(hijo.No_Menu_Url, hijo.url_intranet_v2),
          category: menuItem.No_Menu,
          categoryId: menuItem.ID_Menu.toString(),
          order: hijo.Nu_Orden,
          isVisible: true,
          hasNotifications: false,
          notificationCount: 0,
          permissions: ['view']
        })
      }

      categories.push(category)
    }
  }

  return categories
})

// Función para convertir iconos de FontAwesome a Heroicons
const convertIconToHeroicons = (faIcon: string): string => {
  const iconMap: Record<string, string> = {
    'fa fa-home': 'i-heroicons-home',
    'fas fa-boxes': 'i-heroicons-cube-transparent',
    'fa fa-list': 'i-heroicons-document-text',
    'fa fa-file-excel': 'i-heroicons-document-text',
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
    'fa fa-database': 'i-heroicons-circle-stack'
  }

  return iconMap[faIcon] || 'i-heroicons-square-3-stack-3d'
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