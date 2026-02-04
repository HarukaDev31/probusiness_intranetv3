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
          <p class="text-sm text-gray-500 dark:text-gray-400">Personaliza los colores de los responsables</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-500 animate-spin" />
      </div>

      <!-- Configuración de colores -->
      <UCard v-else>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-paint-brush" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold">Colores de Responsables</h2>
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
            Asigna un color único a cada responsable. Este color se usará para identificar sus actividades en el calendario.
          </p>

          <!-- Lista de responsables -->
          <div class="space-y-3">
            <div
              v-for="responsable in responsables"
              :key="responsable.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :alt="responsable.nombre"
                  size="md"
                  :src="responsable.avatar"
                  :style="{ backgroundColor: getColor(responsable.id) }"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ responsable.nombre }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ responsable.email }}</p>
                </div>
              </div>

              <!-- Color Picker -->
              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform"
                  :style="{ backgroundColor: getColor(responsable.id) }"
                  @click="toggleColorPicker(responsable.id)"
                />
                <UPopover v-model:open="colorPickerOpen[responsable.id]">
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
                            'border-primary-500 ring-2 ring-primary-500': getColor(responsable.id) === color,
                            'border-transparent': getColor(responsable.id) !== color
                          }"
                          :style="{ backgroundColor: color }"
                          @click="setColor(responsable.id, color)"
                        />
                      </div>
                      <!-- Input para color personalizado -->
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          :value="getColor(responsable.id)"
                          class="w-10 h-10 rounded cursor-pointer border-0"
                          @input="(e) => setColor(responsable.id, (e.target as HTMLInputElement).value)"
                        />
                        <UInput
                          :model-value="getColor(responsable.id)"
                          placeholder="#000000"
                          size="sm"
                          class="w-24"
                          @update:model-value="(val) => setColor(responsable.id, val as string)"
                        />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="responsables.length === 0"
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              No hay responsables configurados
            </div>
          </div>
        </div>
      </UCard>

      <!-- Preview -->
      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-eye" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold">Vista previa</h2>
          </div>
        </template>

        <div class="flex flex-wrap gap-3">
          <div
            v-for="responsable in responsables"
            :key="responsable.id"
            class="flex items-center gap-2 px-3 py-2 rounded-lg"
            :style="{ backgroundColor: getColor(responsable.id) + '20' }"
          >
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: getColor(responsable.id) }"
            />
            <span class="text-sm font-medium" :style="{ color: getColor(responsable.id) }">
              {{ responsable.nombre }}
            </span>
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
  responsables,
  loading,
  loadResponsables,
  loadColorConfig,
  updateUserColor,
  getResponsableColor
} = useCalendarStore()

const { showSuccess, showError } = useModal()

// Estado local
const localColors = ref<Record<number, string>>({})
const colorPickerOpen = ref<Record<number, boolean>>({})
const saving = ref(false)
const colorPresets = COLOR_PRESETS

// Computed
const hasChanges = computed(() => {
  for (const [userId, color] of Object.entries(localColors.value)) {
    const originalColor = getResponsableColor(Number(userId), '')
    if (color !== originalColor) {
      return true
    }
  }
  return false
})

// Helpers
const getColor = (userId: number): string => {
  if (localColors.value[userId]) {
    return localColors.value[userId]
  }
  return getResponsableColor(userId, responsables.value.find(r => r.id === userId)?.nombre)
}

const setColor = (userId: number, color: string) => {
  localColors.value[userId] = color
}

const toggleColorPicker = (userId: number) => {
  colorPickerOpen.value[userId] = !colorPickerOpen.value[userId]
}

// Guardar todos los colores
const saveAllColors = async () => {
  saving.value = true
  try {
    for (const [userId, color] of Object.entries(localColors.value)) {
      const originalColor = getResponsableColor(Number(userId), '')
      if (color !== originalColor) {
        await updateUserColor(Number(userId), color)
      }
    }
    showSuccess('Éxito', 'Los colores se han actualizado correctamente.')
    localColors.value = {} // Limpiar cambios locales
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudieron guardar los colores.')
  } finally {
    saving.value = false
  }
}

// Inicialización
onMounted(async () => {
  await Promise.all([
    loadResponsables(),
    loadColorConfig()
  ])
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
