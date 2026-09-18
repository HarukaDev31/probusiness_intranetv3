<template>
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
            placeholder="Selecciona una carga consolidada"
            class="w-full"
          />
          <p v-if="!loadingList && consolidados.length === 0" class="text-xs text-gray-500 mt-2">
            No hay consolidados del mismo país.
          </p>
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
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { useModal } from '~/composables/commons/useModal'
import type { MoveCotizacionModalProps } from './types'

const props = withDefaults(defineProps<MoveCotizacionModalProps>(), {
  isFromCalculadora: false,
  show: true,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'moved'): void
}>()

const { getContenedoresDisponibles, getConsolidadoById, moveCotizacion } = useConsolidado()
const { showError, showSuccess } = useModal()

const loading = ref(false)
const loadingList = ref(false)
const consolidados = ref<{ value: number; label: string }[]>([])
const selectedConsolidado = ref('')

const closeModal = () => {
  selectedConsolidado.value = ''
  emit('close')
}

const listFromResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

const loadConsolidados = async () => {
  loadingList.value = true
  try {
    const origenId = props.idConsolidado ? Number(props.idConsolidado) : 0
    let idPais: number | undefined
    if (origenId > 0) {
      const origen = await getConsolidadoById(origenId)
      const pais = Number(origen?.id_pais)
      if (pais > 0) idPais = pais
    }

    const response = await getContenedoresDisponibles({
      id_pais: idPais,
      id_contenedor_origen: origenId > 0 ? origenId : undefined
    })

    consolidados.value = listFromResponse(response)
      .filter((item: any) => Number(item.id) !== origenId)
      .filter((item: any) => !idPais || Number(item.id_pais) === idPais)
      .map((item: any) => ({
        value: item.id,
        label: `Contenedor #${item.carga}`
      }))
  } catch (error) {
    showError('No se pudieron cargar los consolidados', 'Intenta nuevamente.')
  } finally {
    loadingList.value = false
  }
}

const handleMove = async () => {
  if (!selectedConsolidado.value || !props.cotizacionId) return

  loading.value = true
  try {
    const res = await moveCotizacion({
      idCotizacion: props.cotizacionId,
      idContenedorDestino: selectedConsolidado.value,
      isFromCalculadora: props.isFromCalculadora
    })
    if (res?.success === false) {
      throw new Error(res.message || 'No se pudo mover la cotización')
    }
    showSuccess('Cotización movida', 'La cotización se movió al consolidado seleccionado.')
    emit('moved')
    closeModal()
  } catch (error) {
    showError(
      'No se pudo mover la cotización',
      error instanceof Error ? error.message : 'Solo puedes moverla a un consolidado del mismo país.'
    )
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConsolidados()
})
</script>
