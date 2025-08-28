`<template>
  <UModal :show="show" @close="closeModal">
    <template #header>
      <div class="text-lg font-semibold">
        Mover cotización a otro consolidado
      </div>
    </template>

    <template #body>
      <div class="space-y-4 w-full">
        <div class="w-full">
          <label class="block text-sm mb-2">
            Selecciona el consolidado destino:
          </label>
          <USelect
            v-model="selectedConsolidado"
            :items="consolidados"
            item-value="id"
            item-title="code"
            placeholder="Selecciona una carga consolidada"
            class="w-full"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
          color="neutral"
          variant="outline"
          @click="closeModal"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!selectedConsolidado || loading"
          @click="handleMove"
        >
          Mover cotización
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import { CotizacionService } from '~/services/cargaconsolidada/cotizacionService'

interface Props {
  show: boolean
  cotizacionId?: number
  idConsolidado?: string
  isFromCalculadora?: boolean
}
//set defaults values
const props = withDefaults(defineProps<Props>(), {
  isFromCalculadora: false,
  show: true,


})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'moved'): void
}>()

const loading = ref(false)
const consolidados = ref<any[]>([])
const selectedConsolidado = ref('')

const closeModal = () => {
  selectedConsolidado.value = ''
  emit('close')
}

const loadConsolidados = async () => {
  try {
    const response = await ConsolidadoService.getContenedoresDisponibles()
    console.log(response)
    consolidados.value = response.map((item: any) => ({
      value: item.id,
      label: `Contenedor #${item.carga}`
    }))
  } catch (error) {
    console.error('Error cargando consolidados:', error)
  }
}

const handleMove = async () => {
  if (!selectedConsolidado.value || !props.cotizacionId) return

  loading.value = true
  try {
    await ConsolidadoService.moveCotizacion({
      idCotizacion: props.cotizacionId,
      idContenedorDestino: selectedConsolidado.value,
      isFromCalculadora: props.isFromCalculadora
    })
    
    emit('moved')
    closeModal()
  } catch (error) {
    console.error('Error moviendo cotización:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConsolidados()
})
</script>`
