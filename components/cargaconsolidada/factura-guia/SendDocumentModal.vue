<template>
  <UModal :modelValue="true" @close="handleClose" class="sm:max-w-md">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enviar Documento por WhatsApp
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="text-sm text-gray-600 mb-4">
          Selecciona el documento a enviar para: <span class="font-semibold">{{ props.clienteNombre }}</span>
        </div>
        
        <div class="space-y-3">
          <USelect
            v-model="selectedDocument"
            :items="documentOptions"
            placeholder="Selecciona un documento"
            size="lg"
            class="w-full"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton color="error" variant="outline" @click="handleClose">Cerrar</UButton>
        <UButton
          color="primary"
          variant="solid"
          block
          icon="i-heroicons-paper-airplane"
          @click="handleSend"
          :loading="loading"
          :disabled="!selectedDocument"
        >
          Enviar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { USelect, UButton } from '#components'

const props = defineProps<{
  idCotizacion: number
  clienteNombre: string
  hasFactura: boolean
  hasGuia: boolean
  onClose?: () => void
  onSend?: (documentType: 'factura' | 'guia') => void
}>()

const loading = ref(false)
const selectedDocument = ref<string | null>(null)

const documentOptions = computed(() => {
  const options = []
  if (props.hasFactura) {
    options.push({
      label: 'Factura Comercial',
      value: 'factura',
      icon: 'i-heroicons-document-text'
    })
  }
  if (props.hasGuia) {
    options.push({
      label: 'Guía de Remisión',
      value: 'guia',
      icon: 'i-heroicons-clipboard-document'
    })
  }
  return options
})

const handleClose = () => {
  if (props.onClose) {
    props.onClose()
  }
}

const handleSend = () => {
  if (!selectedDocument.value) return
  
  loading.value = true
  
  if (props.onSend) {
    props.onSend(selectedDocument.value as 'factura' | 'guia')
  }
  
  // Reset after a short delay to allow parent to handle
  setTimeout(() => {
    loading.value = false
    selectedDocument.value = null
  }, 100)
}
</script>

