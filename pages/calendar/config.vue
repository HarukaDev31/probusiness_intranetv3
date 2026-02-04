<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          label="Regresar"
          @click="navigateTo('/calendar')"
        />
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-primary-500" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración del Calendario</h1>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <!-- Cards de navegación -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card Registro de Actividades -->
        <UCard 
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/calendar/actividades')"
        >
          <div class="flex flex-col items-center text-center py-6">
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registro de Actividades</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Ver y crear actividades del equipo</p>
            <UButton label="Ver" color="primary" />
          </div>
        </UCard>

        <!-- Card Progreso -->
        <UCard 
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/calendar/progreso')"
        >
          <div class="flex flex-col items-center text-center py-6">
            <div class="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Progreso</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Ver progreso del equipo y actividades</p>
            <UButton label="Ver" color="success" />
          </div>
        </UCard>
      </div>

      <!-- Progreso del Equipo -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold">Progreso del Equipo</h2>
          </div>
        </template>

        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-primary-500 animate-spin" />
        </div>

        <div v-else class="flex flex-wrap items-center gap-6 justify-center md:justify-start">
          <div class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span class="text-sm text-gray-600 dark:text-gray-400">Total</span>
            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ teamProgress?.total_actividades || 0 }}</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <span class="text-sm text-success-600 dark:text-success-400">Completadas</span>
            <span class="text-2xl font-bold text-success-600 dark:text-success-400">{{ teamProgress?.completadas || 0 }}</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-info-50 dark:bg-info-900/20 rounded-lg">
            <span class="text-sm text-info-600 dark:text-info-400">Progresos</span>
            <span class="text-2xl font-bold text-info-600 dark:text-info-400">{{ teamProgress?.en_progreso || 0 }}</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
            <span class="text-sm text-warning-600 dark:text-warning-400">Pendientes</span>
            <span class="text-2xl font-bold text-warning-600 dark:text-warning-400">{{ teamProgress?.pendientes || 0 }}</span>
          </div>
        </div>
      </UCard>

      <!-- Progreso por Responsable -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold">Progreso por Responsable</h2>
          </div>
        </template>

        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-primary-500 animate-spin" />
        </div>

        <div v-else-if="responsableProgress.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos de progreso disponibles
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="responsable in responsableProgress"
            :key="responsable.user_id"
            class="flex items-center gap-4"
          >
            <div class="w-24 flex-shrink-0">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ responsable.nombre }}</span>
            </div>
            <div class="flex-1">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${responsable.porcentaje_completado}%`,
                    backgroundColor: getResponsableColor(responsable.user_id, responsable.nombre)
                  }"
                />
              </div>
            </div>
            <div class="w-14 text-right">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ responsable.porcentaje_completado }}%</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Link a configuración de colores -->
      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-paint-brush" class="w-5 h-5 text-primary-500" />
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">Configuración de Colores</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Personalizar colores de los responsables</p>
            </div>
          </div>
          <UButton
            label="Configurar"
            variant="outline"
            @click="navigateTo('/calendar/colores')"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCalendarStore } from '~/composables/useCalendarStore'

const {
  teamProgress,
  responsableProgress,
  loading,
  loadProgress,
  getResponsableColor,
  initialize
} = useCalendarStore()

onMounted(async () => {
  await initialize()
  await loadProgress()
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
