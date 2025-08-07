<template>
  <UModal v-model="showModal" title="Crear Nueva Entidad" :triger="true">
    <UButton 
      :label="buttonLabel" 
      :icon="buttonIcon" 
      :size="buttonSize" 
      :variant="buttonVariant"
      @click="showModal = true" 
    />

    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de la Entidad <span class="text-red-500">*</span>
          </label>
          <UInput 
            v-model="entity.nombre" 
            placeholder="Ej: MTC, MINSA, PRODUCE" 
            class="w-full"
            :class="{ 'ring-red-500 border-red-500': showValidationError && entity.nombre.trim() === '' }"
            @update:model-value="updateEntityName"
          />
          <p v-if="showValidationError && entity.nombre.trim() === ''" class="mt-1 text-sm text-red-600">
            El nombre de la entidad es obligatorio
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <UTextarea 
            v-model="entity.descripcion" 
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
        <UButton label="Cancelar" variant="outline" @click="handleCancel(close)" />
        <UButton 
          label="Crear Entidad" 
          color="primary" 
          @click="handleCreate(close)"
          :disabled="!entity.nombre.trim()"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Entity {
  nombre: string
  descripcion: string
}

interface Props {
  buttonLabel?: string
  buttonIcon?: string
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  buttonVariant?: 'outline' | 'link' | 'solid' | 'soft' | 'subtle' | 'ghost'
  onEntityCreated?: (entity: Entity) => void
}

const props = withDefaults(defineProps<Props>(), {
  buttonLabel: 'Crear Entidad',
  buttonIcon: 'i-heroicons-plus',
  buttonSize: 'xs',
  buttonVariant: 'outline'
})

const emit = defineEmits<{
  'entity-created': [entity: Entity]
}>()

// Modal state
const showModal = ref(false)

// Form data
const entity = ref<Entity>({
  nombre: '',
  descripcion: ''
})

// Validation state
const showValidationError = ref(false)

// Methods
const updateEntityName = (value: string) => {
  entity.value.nombre = value
  // Ocultar error cuando el usuario empiece a escribir
  if (showValidationError.value && value.trim()) {
    showValidationError.value = false
  }
}

const updateEntityDescription = (value: string) => {
  entity.value.descripcion = value
}

const handleCancel = (close: () => void) => {
  // Limpiar formulario
  entity.value = {
    nombre: '',
    descripcion: ''
  }
  showValidationError.value = false
  close()
}

const handleCreate = (close: () => void) => {
  if (!entity.value.nombre.trim()) {
    showValidationError.value = true
    return
  }

  // Emitir evento con la entidad creada
  emit('entity-created', { ...entity.value })
  
  // Limpiar formulario
  entity.value = {
    nombre: '',
    descripcion: ''
  }
  showValidationError.value = false
  
  close()
}
</script>
