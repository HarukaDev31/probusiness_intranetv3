<template>
  <div class="flex items-center gap-2 ml-auto shrink-0">
    <USelectMenu
      v-if="roleGroups.length > 1"
      :model-value="selectedOption"
      :items="options"
      size="xs"
      class="min-w-[200px]"
      placeholder="Selecciona calendario"
      :disabled="disabled"
      @update:model-value="(option) => option && option.value !== selectedRoleGroupId && emit('change-role-group', option.value)"
    />
    <UButton
      icon="i-heroicons-chart-bar"
      variant="ghost"
      size="xs"
      label="Progreso"
      class="hidden sm:inline-flex"
      :disabled="disabled"
      @click="emit('open-progress')"
    />
    <UButton
      v-if="canAccessConfig"
      icon="i-heroicons-cog-6-tooth"
      variant="ghost"
      size="xs"
      label="Configuración"
      class="hidden sm:inline-flex"
      :disabled="disabled"
      @click="emit('open-config')"
    />
    <UButton
      v-if="canCreate"
      icon="i-heroicons-plus"
      color="primary"
      size="xs"
      label="Crear Actividad"
      class="hidden sm:inline-flex"
      :disabled="disabled"
      @click="emit('create')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarMyRoleGroup } from '~/types/calendar'

const props = defineProps<{
  roleGroups: CalendarMyRoleGroup[]
  selectedRoleGroupId: number | null
  canAccessConfig: boolean
  canCreate: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'change-role-group', roleGroupId: number): void
  (e: 'open-progress'): void
  (e: 'open-config'): void
  (e: 'create'): void
}>()

const options = computed(() =>
  props.roleGroups.map(g => ({ label: g.code ? `${g.name} (${g.code})` : g.name, value: g.id }))
)

const selectedOption = computed(() => options.value.find(o => o.value === props.selectedRoleGroupId))
</script>
