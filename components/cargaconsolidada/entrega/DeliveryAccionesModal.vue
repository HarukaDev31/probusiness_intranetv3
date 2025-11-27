<template>
  <UModal v-model="isOpen" @close="$emit('close')" class="sm:max-w-2xl">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Acciones de Delivery
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="text-sm text-gray-600 mb-4">
          Selecciona una acción para: <span class="font-semibold">{{ clienteNombre }}</span>
        </div>
        
        <div class="space-y-3">
          <USelect
            v-model="selectedAction"
            :items="actionOptions"
            placeholder="Selecciona una acción"
            size="lg"
            class="w-full"
          />
          
          
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton color="error" variant="outline" @click="$emit('close')">Cerrar</UButton>
        <UButton
            color="primary"
            variant="solid"
            block
            icon="i-heroicons-paper-airplane"
            @click="handleSend"
            :loading="loading !== null"
            :disabled="!selectedAction"
          >
            Enviar
          </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'
import { USelect, UButton } from '#components'

const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()
const { 
  sendRecordatorioFormularioDelivery, 
  sendCobroCotizacionFinalDelivery, 
  sendCobroDeliveryDelivery ,
  sendMessageForCotizacion
} = useEntrega()

const props = defineProps<{
  idCotizacion: number
  clienteNombre: string
  messageRecordatorioFormulario?: string
  messageCobroCotizacionFinal?: string
  messageCobroDelivery?: string
  modelValue?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'success'): void
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref<string | null>(null)
const selectedAction = ref<string | null>(null)

const actionOptions = [
  { 
    label: 'Recordatorio de formulario', 
    value: 'recordatorio_formulario',
    icon: 'i-heroicons-chat-bubble-left-right'
  },
  { 
    label: 'Cobro cotización final', 
    value: 'cobro_cotizacion_final',
    icon: 'i-heroicons-currency-dollar'
  },
  { 
    label: 'Cobro de delivery', 
    value: 'cobro_delivery',
    icon: 'i-heroicons-truck'
  }
]

const handleSend = async () => {
  if (!selectedAction.value) return
  
  loading.value = selectedAction.value
  
  await withSpinner(async () => {
    try {
      let response = null
      let message = ''
      
      switch(selectedAction.value) {
        case 'recordatorio_formulario':
          message = props.messageRecordatorioFormulario || 'Mensaje de recordatorio de formulario'
          response = await  sendMessageForCotizacion(props.idCotizacion)
          break
        case 'cobro_cotizacion_final':
          message = props.messageCobroCotizacionFinal || 'Mensaje de cobro de cotización final'
          await withSpinner(async () => {
                      const nuxtApp = useNuxtApp()
                      const endpoint = `/api/carga-consolidada/contenedor/cotizacion-final/general/${props.idCotizacion}/send-reminder-pago`
                      const res = await nuxtApp.$api.call(endpoint, { method: 'POST', body: {} })
                      if (res.success) {  
                        response = res
                      } else {
                        showError('Error', (res as any).message || 'No se pudo enviar el recordatorio')
                      }
                    }, 'Enviando recordatorio...')
          break
        case 'cobro_delivery':
          message = props.messageCobroDelivery || 'Mensaje de cobro de delivery'
          response = await sendCobroDeliveryDelivery(props.idCotizacion, message)
          break
      }

      if (response?.success) {
        showSuccess('Mensaje enviado', 'El mensaje se ha enviado correctamente')
        selectedAction.value = null
        emit('success')
        emit('close')
      } else {
        showError('Error', response?.error || response?.message || 'No se pudo enviar el mensaje')
      }
    } catch (error: any) {
      showError('Error', error?.message || 'No se pudo enviar el mensaje')
    } finally {
      loading.value = null
    }
  }, 'Enviando mensaje...')
}
</script>

