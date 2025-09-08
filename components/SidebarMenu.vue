<template>
  <!-- Sidebar -->
  <div
    class="fixed inset-y-0 left-0 z-50 w-70 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col"
    :class="visible ? 'translate-x-0' : '-translate-x-full'">
    <!-- Top: centered logo -->
    <div class="py-6 px-4 flex items-center justify-center">
      <NuxtLink to="/" class="flex items-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">probusiness</h1>  
        <img src="https://intranet.probusiness.pe/dist_v2/img/logos/probusiness.png?ver=2.0.0"
             alt="Probusiness" class="w-14 h-auto" />
      </NuxtLink>
    </div>




    <!-- Nav: scrollable -->
    <nav class="px-2 overflow-y-auto flex-1">
      <div class="space-y-2 pb-4">
        <template v-if="!menuCategories || menuCategories.length === 0">
          <div class="text-center py-6">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando menú...</p>
          </div>
        </template>

        <template v-else>
          <template v-for="category in menuCategories" :key="category.id">
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ category.name }}
            </div>

            <div class="space-y-1 px-1">
              <template v-for="item in category.modules" :key="item.id">
                <!-- Item padre con hijos: izquierda = navegación/opcional toggle, derecha = chevron que controla expand -->
                <div v-if="item.children && item.children.length" class="w-full">
                  <div class="flex items-center justify-between">
                    <!-- Left: clickable area (navega si tiene route, sino actúa como toggle) -->
                    <button
                      type="button"
                      class="flex-1 flex items-center gap-3 py-2 px-3 rounded-md text-sm text-left focus:outline-none"
                      :class="isParentActive(item) ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                      @click="navigateOrToggle(item)">
                      <UIcon :name="item.icon || 'i-heroicons-archive-box'" class="w-5 h-5 text-gray-400" />
                      <span class="truncate">{{ item.name }}  </span>
                    </button>

                    <!-- Right: chevron toggle (stop propagation para no navegar) -->
                    <button
                      type="button"
                      class="ml-2 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click.stop="toggleParent(item.id)">
                      <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 transform" :class="expanded[String(item.id)] ? 'rotate-180' : ''" />
                    </button>
                  </div>

                  <transition name="fade" enter-active-class="transition-all duration-150" leave-active-class="transition-all duration-150">
                    <div v-show="expanded[String(item.id)]" class="pl-10 mt-1 space-y-1">
                      <template v-for="child in item.children" :key="child.id">
                        <!-- Child con sub-hijos -->
                        <div v-if="child.children && child.children.length">
                          <div class="flex items-center justify-between">
                            
                            <button
                              type="button"
                              class="flex-1 flex items-center gap-2 py-2 px-2 rounded-md text-sm text-left focus:outline-none"
                              :class="isParentActive(child) ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                              @click="navigateOrToggle(child)">
                              <UIcon :name="child.icon || 'i-heroicons-archive-box'" class="w-4 h-4 text-gray-400" />
                              <span class="truncate">{{ child.name }}</span>
                            </button>

                            <button
                              type="button"
                              class="ml-2 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              @click.stop="toggleParent(child.id)">
                              <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 transform" :class="expanded[String(child.id)] ? 'rotate-180' : ''" />
                            </button>
                          </div>

                          <div v-show="expanded[String(child.id)]" class="pl-6 mt-1 space-y-1">
                            <template v-for="sub in child.children" :key="sub.id">
                              <UButton
                                :label="sub.name"
                                :icon="sub.icon"
                                variant="ghost"
                                class="w-full justify-start text-sm gap-2 py-1 px-2 rounded-md"
                                :class="isActiveRoute(sub.route) ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                                @click="handleNavigation(sub.route)"
                              />
                            </template>
                          </div>
                        </div>

                        <!-- Child simple -->
                        <div v-else>
                          <UButton
                            :label="getCustomMenuName(item.name, child.name)"
                            :icon="child.icon"
                            variant="ghost"
                            class="w-full justify-start text-sm gap-2 py-2 px-2 rounded-md"
                            :class="isActiveRoute(child.route) ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                            @click="handleNavigation(child.route)"
                          />
                        </div>
                      </template>
                    </div>
                  </transition>
                </div>

                <!-- Item simple (sin hijos) -->
                <div v-else>
                  <UButton
                    :label="item.name"
                    :icon="item.icon"
                    variant="ghost"
                    class="w-full justify-start text-sm gap-3 py-2 px-3 rounded-md"
                    :class="isActiveRoute(item.route) ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                    @click="handleNavigation(item.route)"
                  />
                </div>
              </template>
            </div>

          </template>
        </template>

        <!-- Preferencias -->
        <div class="py-5 border-t border-b border-gray-100 dark:border-gray-700"
        v-if="currentRole !== ROLES.CONTENEDOR_ALMACEN"
        >
          <div class="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferencias</div>
          <div class="mt-2 space-y-1 px-2">
            <div class="py-2">
              <UButton
                variant="ghost"
                class="w-full justify-start rounded-md text-sm text-gray-700 dark:text-gray-300"
                icon="i-heroicons-bell"
                label="Notificaciones"
                @click="openNotifications"
              />
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-moon" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div class="text-sm text-gray-700 dark:text-gray-300">Modo oscuro</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" :checked="isDark" @change="toggleDarkMode" />
                <div class="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform peer-checked:translate-x-4 transition-transform" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Bottom: user info + logout -->
    <div class="border-b border-gray-100 dark:border-gray-700 px-4 py-4">
      <div class="flex items-center gap-3">
        <UAvatar :src="userData?.avatar || undefined" :alt="userName || 'Usuario'" size="sm" />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ userName || 'Usuario' }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ currentRole || 'Sin rol' }}</div>
        </div>
      </div>

      
    </div>
    <div class="mt-3 p-4">
        <UButton label="Cerrar sesión" icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" color="error" class="w-full text-sm" @click="logout" />
      </div>
  </div>

  <!-- Overlay -->
  <div v-if="visible" class="fixed inset-0 z-40  bg-opacity-50 lg:hidden" @click="toggleSidebar" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { SidebarCategory } from '../types/module'
import { ROLES } from '~/constants/roles'
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
import { CUSTOM_MENUS_PER_ROLE } from '~/constants/sidebar' 
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

const navigateOrToggle = (item: any) => {
  // si tiene ruta válida, navegamos; si no, toggle
  const route = item?.route
  if (route && route !== '' && route !== '#') {
    navigateTo(route)
  } else {
    toggleParent(item.id)
  }
}

const logout = async () => {
  const { logout } = useAuth()
  await logout()
}

const openNotifications = () => {
  return navigateTo('/notificaciones')
}

/**
 * Estado de expansión por id
 */
const expanded = reactive<Record<string, boolean>>({})

const toggleParent = (key: string | number | undefined) => {
  if (!key) return
  const k = String(key)
  expanded[k] = !expanded[k]
}

const isParentActive = (item: any) => {
  if (!item) return false
  if (isActiveRoute(item.route)) return true
  if (item.children && item.children.length) {
    return item.children.some((c: any) => isActiveRoute(c.route) || (c.children && c.children.some((s: any) => isActiveRoute(s.route))))
  }
  return false
}

onMounted(() => {
  fetchCurrentUser()

  // expandir padres que contienen la ruta activa
  const current = useRoute().path
  for (const category of props.menuCategories || []) {
    for (const item of category.modules || []) {
      const key = String(item.id)
      if (item.children && item.children.length) {
        // si alguno de sus hijos o subhijos coincide con la ruta actual, abrir
        if (item.children.some((c: any) => c.route === current || (c.children && c.children.some((s: any) => s.route === current)))) {
          expanded[key] = true
        } else if (expanded[key] === undefined) {
          expanded[key] = false
        }
        // inicializar keys de sub-items
        item.children.forEach((c: any) => {
          if (c.children && c.children.length) {
            const subKey = String(c.id)
            expanded[subKey] = c.children.some((s: any) => s.route === current)
          }
        })
      }
    }
  }
})
const getCustomMenuName = (itemName: string, childName: string) => {
  //if object contains key
  if (Object.keys(CUSTOM_MENUS_PER_ROLE).includes(itemName) && Object.keys(CUSTOM_MENUS_PER_ROLE[itemName]).includes(currentRole.value) && Object.keys(CUSTOM_MENUS_PER_ROLE[itemName][currentRole.value]).includes(childName)) {
    return CUSTOM_MENUS_PER_ROLE[itemName][currentRole.value][childName]
  }
  return childName
}
</script>