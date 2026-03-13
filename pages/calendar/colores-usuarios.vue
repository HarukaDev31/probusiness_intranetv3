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
          @click="router.back()"
        />
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Colores por Usuario</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Personaliza el color de cada responsable en el calendario.
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Colores de responsables</h2>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            El color definido aquí se usa para los indicadores y avatares de cada responsable, y también cuando la
            prioridad de color está configurada en <strong>Color de perfil (usuario)</strong>.
          </p>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 6" :key="i" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <div class="space-y-2">
                  <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32" />
                  <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-40" />
                </div>
              </div>
              <div class="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="resp in responsables"
              :key="resp.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="resp.avatar || undefined"
                  :alt="resp.nombre"
                  size="md"
                  :style="{ backgroundColor: getColor(resp.id, resp.nombre), color: '#fff' }"
                  class="ring-1 ring-white/40"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ resp.nombre }}</p>
                  <p v-if="resp.email" class="text-sm text-gray-500 dark:text-gray-400">{{ resp.email }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div
                  class="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform"
                  :style="{ backgroundColor: getColor(resp.id, resp.nombre) }"
                  @click="toggleColorPicker(resp.id)"
                />
                <UPopover v-model:open="colorPickerOpen[resp.id]">
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
                      <div class="grid grid-cols-5 gap-2 mb-3">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          class="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform"
                          :class="{
                            'border-primary-500 ring-2 ring-primary-500': getColor(resp.id, resp.nombre) === color,
                            'border-transparent': getColor(resp.id, resp.nombre) !== color
                          }"
                          :style="{ backgroundColor: color }"
                          @click="() => setColor(resp.id, color)"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          :value="getColor(resp.id, resp.nombre)"
                          class="w-10 h-10 rounded cursor-pointer border-0"
                          @input="(e) => setColor(resp.id, (e.target as HTMLInputElement).value)"
                        />
                        <UInput
                          :model-value="getColor(resp.id, resp.nombre)"
                          placeholder="#000000"
                          size="sm"
                          class="w-24"
                          @update:model-value="(val) => setColor(resp.id, val as string)"
                        />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>
            </div>

            <div v-if="!responsables.length" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay responsables disponibles.
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'

const router = useRouter()
import { COLOR_PRESETS } from '~/constants/calendar'

const {
  responsables,
  loading,
  loadResponsables,
  loadColorConfig,
  updateUserColor,
  getResponsableColor,
  getCalendarRoute
} = useCalendarStore()

const { showSuccess, showError } = useModal()

const colorPresets = COLOR_PRESETS
const colorPickerOpen = ref<Record<number, boolean>>({})

const getColor = (userId: number, nombre?: string) => {
  return getResponsableColor(userId, nombre)
}

const setColor = async (userId: number, color: string) => {
  const hex = color.startsWith('#') ? color : `#${color}`
  try {
    const ok = await updateUserColor(userId, hex)
    if (ok) {
      await loadColorConfig(true)
      showSuccess('Color actualizado', 'El color del responsable se guardó correctamente.')
    } else {
      showError('Error', 'No se pudo guardar el color.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo guardar el color.')
  }
}

const toggleColorPicker = (userId: number) => {
  colorPickerOpen.value[userId] = !colorPickerOpen.value[userId]
}

onMounted(async () => {
  await Promise.all([
    loadResponsables(),
    loadColorConfig(true)
  ])
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>

