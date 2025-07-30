<template>
  <UModal v-model="isOpen" title="Crear Nuevo Producto">
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Producto
          </label>
          <UInput 
            :model-value="product.nombre"
            placeholder="Ej: Zapatillas deportivas" 
            class="w-full"
            @update:model-value="updateProductName"
          />
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton label="Cancelar" variant="outline" @click="close" />
        <UButton 
          label="Crear Producto" 
          color="primary" 
          @click="() => {
            $emit('create');
            close();
          }" 
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Product {
  nombre: string
}

interface Props {
  modelValue: boolean
  product: Product
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:product': [product: Product]
  create: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateProductName = (value: string) => {
  emit('update:product', { ...props.product, nombre: value })
}
</script> 