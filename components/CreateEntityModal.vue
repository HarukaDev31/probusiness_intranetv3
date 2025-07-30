<template>
  <UModal v-model="isOpen" title="Crear Nueva Entidad">
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de la Entidad
          </label>
          <UInput 
            :model-value="entity.nombre"
            placeholder="Ej: MTC, MINSA, PRODUCE" 
            class="w-full"
            @update:model-value="updateEntityName"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <UTextarea 
            :model-value="entity.descripcion"
            placeholder="Descripción de la entidad..." 
            :rows="3"
            class="w-full"
            @update:model-value="updateEntityDescription"
          />
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton label="Cancelar" variant="outline" @click="close" />
        <UButton 
          label="Crear Entidad" 
          color="primary" 
          @click="() => {
            $emit('create', entity);
            close();
          }" 
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Entity {
  nombre: string
  descripcion: string
}

interface Props {
  modelValue: boolean
  entity: Entity
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:entity': [entity: Entity]
  create: [entity: Entity]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateEntityName = (value: string) => {
  emit('update:entity', { ...props.entity, nombre: value })
}

const updateEntityDescription = (value: string) => {
  emit('update:entity', { ...props.entity, descripcion: value })
}
</script> 