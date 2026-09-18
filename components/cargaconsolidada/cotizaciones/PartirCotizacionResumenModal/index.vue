<template>
  <UModal>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3>Partir cotización</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Los proveedores marcados pasan a una cotización nueva en el consolidado que elijas. Debe quedar al menos uno aquí.
        </p>

        <UFormField label="Proveedores a mover" required>
          <UCheckboxGroup
            v-if="proveedores.length"
            v-model="seleccionados"
            :items="proveedores"
          />
          <p v-else class="text-xs text-gray-500">
            Cargando proveedores…
          </p>
        </UFormField>

        <UFormField label="Consolidado destino" required>
          <USelect
            v-model="contenedorDestino"
            :items="contenedores"
            placeholder="Selecciona un consolidado"
            class="w-full"
          />
          <p v-if="!loadingList && contenedores.length === 0" class="text-xs text-gray-500 mt-2">
            No hay consolidados del mismo país.
          </p>
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="outline" @click="close">
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          :disabled="!puedePartir"
          @click="handleConfirm(close)"
        >
          Partir
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCotizacionResumen } from '~/composables/cargaconsolidada/cotizacion-resumen'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { PartirCotizacionResumenModalProps } from './types'

const props = defineProps<PartirCotizacionResumenModalProps>()

const { partirCotizacion } = useCotizacionResumen()
const { getProveedoresByCotizacion } = useCotizacionProveedor()
const { getContenedoresDisponibles, getConsolidadoById } = useConsolidado()
const { showError, showSuccess } = useModal()
const { withSpinner } = useSpinner()

const proveedores = ref<{ label: string; value: number }[]>([])
const seleccionados = ref<number[]>([])
const contenedores = ref<{ label: string; value: number }[]>([])
const contenedorDestino = ref<number | null>(null)
const loadingList = ref(false)
const saving = ref(false)

const puedePartir = computed(() => {
  const total = proveedores.value.length
  const moving = seleccionados.value.length
  return total >= 2 && moving >= 1 && moving < total && !!contenedorDestino.value
})

const listFromResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

async function loadProveedores() {
  const response = await getProveedoresByCotizacion(props.idCotizacion)
  const rows = listFromResponse(response)
  proveedores.value = rows.map((proveedor: any) => ({
    value: Number(proveedor.id),
    label: proveedor.code_supplier || proveedor.products || proveedor.productos || `Proveedor #${proveedor.id}`,
  }))
}

async function loadContenedores() {
  loadingList.value = true
  try {
    const origenId = Number(props.idContenedor) || 0
    let idPais: number | undefined
    if (origenId > 0) {
      const origen = await getConsolidadoById(origenId)
      const pais = Number(origen?.id_pais)
      if (pais > 0) idPais = pais
    }
    const response = await getContenedoresDisponibles({
      id_pais: idPais,
      id_contenedor_origen: origenId > 0 ? origenId : undefined,
    })
    contenedores.value = listFromResponse(response)
      .filter((item: any) => Number(item.id) !== origenId)
      .filter((item: any) => !idPais || Number(item.id_pais) === idPais)
      .map((item: any) => ({
        value: Number(item.id),
        label: `Consolidado #${item.carga}`,
      }))
  } catch {
    showError('No se pudieron cargar los consolidados', 'Intenta nuevamente.')
  } finally {
    loadingList.value = false
  }
}

async function handleConfirm(close: () => void) {
  if (!puedePartir.value || !contenedorDestino.value) return
  if (seleccionados.value.length === proveedores.value.length) {
    showError('No se puede partir', 'Debe quedar al menos un proveedor en esta cotización.')
    return
  }
  saving.value = true
  try {
    await withSpinner(async () => {
      const res = await partirCotizacion(props.idCotizacion, {
        id_contenedor: contenedorDestino.value!,
        proveedores: seleccionados.value.map((id) => Number(id)),
      })
      if (!res?.success) {
        throw new Error(res?.message || 'No se pudo partir la cotización')
      }
    }, 'Partiendo cotización…')
    showSuccess('Cotización partida', 'Los proveedores marcados pasaron al consolidado elegido.')
    props.onSuccess?.()
    close()
  } catch (error) {
    showError(
      'No se pudo partir',
      error instanceof Error ? error.message : 'Intenta nuevamente.'
    )
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadProveedores(), loadContenedores()])
})
</script>
