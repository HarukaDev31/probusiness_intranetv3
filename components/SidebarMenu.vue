<template>
  <!-- Sidebar -->
  <div
    class="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
    :class="visible ? 'translate-x-0' : '-translate-x-full'">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <NuxtLink to="/" class="flex items-center" >
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Probusiness</h1>
        <img src="https://intranet.probusiness.pe/dist_v2/img/logos/probusiness.png?ver=2.0.0" alt="Probusiness"
          class="w-10 h-10 mr-3" />

      </NuxtLink>
      <div class="flex items-center gap-2">
        <!-- Dark Mode Toggle -->
        <UButton :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" variant="ghost" @click="toggleDarkMode" />
        <UButton icon="i-heroicons-bars-3" variant="ghost" @click="toggleSidebar" class="lg:hidden" />
      </div>
    </div>

    <!-- User Info -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <UAvatar :src="userData?.avatar || undefined" :alt="userName || 'Usuario'" size="lg" class="mr-3" />
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">{{ userName || 'Usuario' }}</div>
          <div class="text-xs text-primary-600 dark:text-primary-400 font-medium">{{ currentRole || 'Sin rol' }}</div>
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4 overflow-y-auto">
      <div class="space-y-2">
        <!-- Debug info -->
        <div v-if="menuCategories.length === 0" class="text-center py-4">
          <UIcon name="i-heroicons-arrow-path"
            class="animate-spin w-6 h-6 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando menú...</p>
        </div>

        <template v-else v-for="category in menuCategories" :key="category.id">
          <!-- Category Header -->
          <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ category.name }}
          </div>

          <!-- Category Items -->
          <div class="space-y-1">
            <template v-for="item in category.modules" :key="item.id">
              <UButton :label="item.name" :icon="item.icon" variant="ghost" class="w-full justify-start" :class="{
                'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': isActiveRoute(item.route),
                'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isActiveRoute(item.route)
              }" @click="handleNavigation(item.route)" />
            </template>
          </div>
        </template>
      </div>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <UButton label="Cerrar Sesión" icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" color="error"
        class="w-full" @click="logout" />
    </div>
  </div>

  <!-- Overlay -->
  <div v-if="visible" class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" @click="toggleSidebar" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { SidebarCategory } from '../types/module'
import { useUserRole } from '../composables/auth/useUserRole'
import { useAuth } from '../composables/auth/useAuth'
interface AuthUser {
  id: number | string
  email: string
  name: string
  role?: string
  avatar?: string | null
  lastLogin?: string
  isActive?: boolean
  raw?: any
}

interface Props {
  modelValue: boolean
  user?: AuthUser | null
  menuCategories: SidebarCategory[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// User role composable
const {
  userData,
  currentRole,
  userName,
  userEmail,
  fetchCurrentUser
} = useUserRole()

// Dark mode
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const toggleSidebar = () => {
  visible.value = !visible.value
}

const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const isActiveRoute = (route: string) => {
  return useRoute().path === route
}

const handleNavigation = (route: string) => {
  console.log('Navegando a:', route)
  // Usar el navigateTo de Nuxt, no la función local
  return navigateTo(route)
}

const logout = async () => {
  const { logout } = useAuth()
  await logout()
}

// Cargar datos del usuario al montar el componente
onMounted(() => {
  fetchCurrentUser()
})
</script>