<template>
  <div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <!-- Progreso del equipo -->
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Card: Progreso general -->
      <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Progreso del Equipo</h3>
          <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ teamProgress?.porcentaje_completado || 0 }}%
          </span>
        </div>
        <UProgress
          :value="teamProgress?.porcentaje_completado || 0"
          color="primary"
          size="md"
          class="mb-3"
        />
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
            <p class="text-lg font-semibold text-warning-600 dark:text-warning-400">
              {{ teamProgress?.pendientes || 0 }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">En Progreso</p>
            <p class="text-lg font-semibold text-info-600 dark:text-info-400">
              {{ teamProgress?.en_progreso || 0 }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Completadas</p>
            <p class="text-lg font-semibold text-success-600 dark:text-success-400">
              {{ teamProgress?.completadas || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cards: Progreso por responsable -->
      <div class="flex-[2] bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Progreso por Responsable</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="responsable in responsableProgress"
            :key="responsable.user_id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div class="flex items-center gap-2 mb-2">
              <UAvatar
                :alt="responsable.nombre"
                size="xs"
                :style="{
                  backgroundColor: getResponsableColor(responsable.user_id, responsable.nombre),
                  color: '#fff'
                }"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {{ responsable.nombre }}
              </span>
            </div>
            <UProgress
              :value="responsable.porcentaje_completado"
              :color="getProgressColor(responsable.porcentaje_completado)"
              size="sm"
              class="mb-2"
            />
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ responsable.completadas }}/{{ responsable.total_asignadas }}</span>
              <span class="font-semibold">{{ responsable.porcentaje_completado }}%</span>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="responsableProgress.length === 0"
            class="col-span-full text-center py-4 text-sm text-gray-500 dark:text-gray-400"
          >
            No hay datos de progreso disponibles
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamProgress, ResponsableProgress } from '~/types/calendar'

interface Props {
  teamProgress: TeamProgress | null
  responsableProgress: ResponsableProgress[]
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = defineProps<Props>()

const getProgressColor = (percentage: number): string => {
  if (percentage >= 75) return 'success'
  if (percentage >= 50) return 'info'
  if (percentage >= 25) return 'warning'
  return 'error'
}
</script>
