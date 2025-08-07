<template>
  <li>
    <div
      class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
      :class="isActive ? 'bg-gray-100 text-orange-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'"
      @click="navigateToItem(item)"
      :style="{ paddingLeft: `${level * 18 + 12}px` }"
    >
      <i v-if="item.Txt_Css_Icons" :class="item.Txt_Css_Icons + ' mr-2 text-base'" />
      <span class="truncate">{{ item.No_Menu }}</span>
      <span v-if="hasChildren" class="ml-auto">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
    <ul v-if="hasChildren && expanded" class="ml-1 border-l border-gray-100">
      <SidebarMenuItem
        v-for="child in children"
        :key="child.ID_Menu"
        :item="child"
        :level="level + 1"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ item: any; level: number }>()
const route = useRoute()
const router = useRouter()

const expanded = ref(false)

const hasChildren = computed(() => {
  return (props.item.Hijos && props.item.Hijos.length > 0) || (props.item.SubHijos && props.item.SubHijos.length > 0)
})

const hasAccessibleRoute = computed(() => {
  return (props.item.No_Menu_Url && props.item.No_Menu_Url !== '#') || props.item.url_intranet_v2
})

const children = computed(() => {
  return [
    ...(props.item.Hijos || []),
    ...(props.item.SubHijos || [])
  ]
})

const isActive = computed(() => {
  // Considera activo si la ruta actual incluye el nombre del controlador o la URL intranet
  const menuUrl = props.item.No_Menu_Url
  const intranetUrl = props.item.url_intranet_v2
  
  if ((!menuUrl || menuUrl === '#') && !intranetUrl) return false
  
  if (menuUrl && menuUrl !== '#' && props.item.url_intranet_v2 === "/") {
    const cleanMenuUrl = menuUrl.replace(/\\/g, '/')
    // Manejar caso especial donde la URL es solo "/"
    if (cleanMenuUrl === '/') {
      return route.fullPath === '/'
    } else {
      const normalizedUrl = cleanMenuUrl.replace(/^\/+/, '')
      return route.fullPath.includes('/' + normalizedUrl)
    }
  }
  
  if (intranetUrl) {
    // Manejar caso especial donde la URL es solo "/"
    if (intranetUrl === '/') {
      return route.fullPath === '/'
    } else {
      const cleanIntranetUrl = intranetUrl.replace(/^\/+/, '')
      return route.fullPath.includes('/' + cleanIntranetUrl)
    }
  }
  
  return false
})

function navigateToItem(item: any) {
  // Si tiene ruta accesible, navegar (independientemente de si tiene hijos o no)
  if (hasAccessibleRoute.value) {
    let targetUrl = ''
    
    // Priorizar url_intranet_v2 si existe
    if (item.url_intranet_v2) {
      console.log('Navegando a url_intranet_v2:', item.url_intranet_v2)
      targetUrl = item.url_intranet_v2
    } else if (item.No_Menu_Url && item.No_Menu_Url !== '#' && item.url_intranet_v2 !== "/") {
      console.log('Navegando a No_Menu_Url:', item.No_Menu_Url)
      targetUrl = item.No_Menu_Url.replace(/\\/g, '/')
    }
    
    // Asegurar que la URL empiece con / pero no tenga doble //
    if (targetUrl) {
      // Manejar caso especial donde la URL es solo "/"
      if (targetUrl === '/' || targetUrl === '') {
        router.push('/')
      } else {
        // Remover / inicial si existe y luego agregar uno
        targetUrl = targetUrl.replace(/^\/+/, '')
        router.push('/' + targetUrl)
      }
    }
    return
  }
  
  // Solo si NO tiene ruta accesible pero SÍ tiene hijos, expandir/colapsar
  if (hasChildren.value) {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
li > ul {
  margin-top: 2px;
}
</style> 