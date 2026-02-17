<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-4xl mx-auto flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          label="Regresar"
          @click="navigateTo('/calendar/config')"
        />
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Configuración de Colores</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Personaliza los colores por consolidado</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-6">
      <!-- Loading skeleton -->
      <UCard v-if="loading">
        <template #header>
          <div class="flex items-center gap-2 animate-pulse">
            <div class="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div class="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          </div>
        </template>
        <div class="space-y-4 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div v-for="i in 6" :key="i" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div class="space-y-2">
                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              </div>
            </div>
            <div class="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        </div>
      </UCard>

      <!-- Configuración de colores -->
      <UCard v-else>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-paint-brush" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold">Colores por Consolidado</h2>
            </div>
            <UButton
              label="Guardar cambios"
              color="primary"
              :loading="saving"
              :disabled="!hasChanges"
              @click="saveAllColors"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Asigna un color único a cada consolidado. Este color se usará para identificar sus actividades en el calendario.
          </p>

          <!-- Lista de consolidados -->
          <div class="space-y-3">
            <div
              v-for="contenedor in contenedores"
              :key="contenedor.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: getColor(contenedor.id) + '30' }"
                >
                  <UIcon name="i-heroicons-cube" class="w-5 h-5" :style="{ color: getColor(contenedor.id) }" />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ contenedor.nombre }}</p>
                  <p v-if="contenedor.codigo" class="text-sm text-gray-500 dark:text-gray-400">{{ contenedor.codigo }}</p>
                </div>
              </div>

              <!-- Color Picker -->
              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform"
                  :style="{ backgroundColor: getColor(contenedor.id) }"
                  @click="toggleColorPicker(contenedor.id)"
                />
                <UPopover v-model:open="colorPickerOpen[contenedor.id]">
                  <template #default>
                    <UButton
                      icon="i-heroicons-chevron-down"
                      variant="ghost"
                      size="xs"
                    />
                  </template>
                  <template #content>
                    <div class="p-3 w-64">
                      <p class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Seleccionar color</p>
                      <!-- Colores predefinidos -->
                      <div class="grid grid-cols-5 gap-2 mb-3">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          class="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform"
                          :class="{
                            'border-primary-500 ring-2 ring-primary-500': getColor(contenedor.id) === color,
                            'border-transparent': getColor(contenedor.id) !== color
                          }"
                          :style="{ backgroundColor: color }"
                          @click="setColor(contenedor.id, color)"
                        />
                      </div>
                      <!-- Input para color personalizado -->
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          :value="getColor(contenedor.id)"
                          class="w-10 h-10 rounded cursor-pointer border-0"
                          @input="(e) => setColor(contenedor.id, (e.target as HTMLInputElement).value)"
                        />
                        <UInput
                          :model-value="getColor(contenedor.id)"
                          placeholder="#000000"
                          size="sm"
                          class="w-24"
                          @update:model-value="(val) => setColor(contenedor.id, val as string)"
                        />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="contenedores.length === 0"
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              No hay consolidados disponibles
            </div>
          </div>
        </div>
      </UCard>

    
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import { COLOR_PRESETS } from '~/constants/calendar'

const {
  contenedores,
  loading,
  loadContenedores,
  loadConsolidadoColorConfig,
  updateConsolidadoColors,
  getConsolidadoColor,
} = useCalendarStore()

const { showSuccess, showError } = useModal()

// Estado local
const localColors = ref<Record<number, string>>({})
const colorPickerOpen = ref<Record<number, boolean>>({})
const saving = ref(false)
const colorPresets = COLOR_PRESETS

// Computed
const hasChanges = computed(() => {
  for (const [id, color] of Object.entries(localColors.value)) {
    const originalColor = getConsolidadoColor(Number(id))
    if (color !== originalColor) return true
  }
  return false
})

// Helpers
const getColor = (contenedorId: number): string => {
  if (localColors.value[contenedorId]) {
    return localColors.value[contenedorId]
  }
  return getConsolidadoColor(contenedorId)
}

const setColor = (contenedorId: number, color: string) => {
  localColors.value[contenedorId] = color
}

const toggleColorPicker = (contenedorId: number) => {
  colorPickerOpen.value[contenedorId] = !colorPickerOpen.value[contenedorId]
}

// Guardar todos los colores en una sola petición
const saveAllColors = async () => {
  saving.value = true
  try {
    const changed = Object.entries(localColors.value)
      .filter(([id, color]) => color !== getConsolidadoColor(Number(id)))
      .map(([id, color]) => ({ contenedorId: Number(id), colorCode: color }))

    if (changed.length === 0) return

    await updateConsolidadoColors(changed)
    showSuccess('Éxito', 'Los colores se han actualizado correctamente.')
    localColors.value = {}
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudieron guardar los colores.')
  } finally {
    saving.value = false
  }
}

// Inicialización
onMounted(async () => {
  await Promise.all([
    loadContenedores(),
    loadConsolidadoColorConfig()
  ])
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
