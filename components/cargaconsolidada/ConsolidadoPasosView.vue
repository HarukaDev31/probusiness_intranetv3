<template>
  <div class="p-0 md:p-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <UIcon name="i-heroicons-truck" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
        <h1 class="text-base md:text-2xl font-bold text-gray-900 dark:text-white">Pasos de Carga Consolidada</h1>
      </div>
    </div>

    <div class="flex justify-center mb-8">
      <div class="flex flex-wrap flex-row gap-3 max-w-7xl justify-center">
        <div v-if="loading" class="flex flex-wrap flex-row gap-3 max-w-7xl justify-center">
          <div
            v-for="i in skeletonCount"
            :key="`skeleton-${i}`"
            class="bg-white min-w-40 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 text-center animate-pulse"
          >
            <div class="flex flex-col items-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
        </div>

        <div
          v-else
          v-for="paso in pasos"
          :key="paso.id"
          class="min-w-40 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer p-3 text-center"
          @click="handleNavigateToStep(paso.name)"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-14 h-14 rounded-full flex items-center justify-center">
              <img :src="paso.iconURL" alt="">
            </div>
            <h3 class="text-md text-gray-900 dark:text-white">{{ formatNombre(paso.name) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center">
      <UButton label="Regresar" color="neutral" variant="outline" size="lg" class="w-4xl justify-center px-8 py-3" @click="goBack" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ID_JEFEVENTAS, ROLES } from '~/constants/roles'

const props = withDefaults(
  defineProps<{
    /** Rol para skeleton/permisos (ej. ROLES.COORDINACION, ROLES.DOCUMENTACION) */
    role: string
    /** Ruta al hacer clic en Regresar */
    backRoute: string
    /** Base path para enlaces a pasos (ej. /cargaconsolidada/abiertos o /cargaconsolidada/coordinacion/abiertos) */
    basePath: string
  }>(),
  {}
)

const { currentId } = useUserRole()
const { getConsolidadoPasos, pasos, loading } = useConsolidado(toRef(props, 'role'))

const route = useRoute()
const id = Number(route.params.id)

const skeletonCount = computed(() => {
  if (props.role === ROLES.COORDINACION) return 6
  if (props.role === ROLES.DOCUMENTACION) return 3
  if (currentId.value === ID_JEFEVENTAS) return 2
  if (props.role === ROLES.COTIZADOR) return 1
  return 5
})

onMounted(async () => {
  // Pasar explícitamente el rol de la vista para que el backend (Jefe Importación) devuelva pasos de Coordinación o Documentación
  await getConsolidadoPasos(id, props.role)
})

const formatNombre = (s: string) => {
  if (!s) return ''
  const lower = s.toLocaleLowerCase('es-PE')
  return lower.charAt(0).toLocaleUpperCase('es-PE') + lower.slice(1)
}

const pasosMap = computed(() => ({
  'COTIZACION': `${props.basePath}/cotizaciones/${id}?tab=prospectos`,
  'CLIENTES': `${props.basePath}/clientes/${id}`,
  'DOCUMENTACION': `${props.basePath}/documentacion/${id}`,
  'COTIZACION FINAL': `${props.basePath}/cotizacion-final/${id}?tab=general`,
  'FACTURA Y GUIA': `${props.basePath}/factura-guia/${id}`,
  'ADUANA': `${props.basePath}/aduana/${id}`,
  'ENTREGA': `${props.basePath}/entrega/${id}`,
}))

const handleNavigateToStep = (step: string) => {
  const url = pasosMap.value[step.toUpperCase() as keyof typeof pasosMap.value]
  if (url) navigateTo(url)
}

const goBack = () => {
  navigateTo(props.backRoute)
}
</script>

<style scoped>
.grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
