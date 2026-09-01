<template>
  <div class="flex flex-col gap-2 min-w-[220px] w-full max-w-full">
    <template v-if="editable">
      <div
        v-for="line in lines"
        :key="line.id"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect
          :model-value="line.tipo_servicio"
          :items="getItemsForLine(line)"
          size="xs"
          class="w-[8.5rem] shrink-0"
          @update:model-value="(v: string) => { line.tipo_servicio = normalizeTipo(v) }"
        />
        <UInput
          v-if="!isBqTipo(line.tipo_servicio)"
          :model-value="String(line.importe)"
          type="number"
          size="xs"
          class="w-[5rem] shrink-0 text-right"
          @update:model-value="(v: string) => { line.importe = Number(v) || 0 }"
        />
        <span
          v-else
          class="w-[5rem] shrink-0 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums"
          :title="'Total BQ: ' + formatCurrency(line.importe)"
        >
          {{ formatCurrency(line.importe) }}
        </span>
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          :icon="isBqTipo(line.tipo_servicio) ? 'i-heroicons-beaker' : 'material-symbols:save-sharp'"
          :title="isBqTipo(line.tipo_servicio) ? 'Detalle BQ' : 'Guardar'"
          :loading="savingId === line.id"
          @click="isBqTipo(line.tipo_servicio) ? openBqModal() : saveLine(line)"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          class="shrink-0"
          icon="i-heroicons-trash"
          title="Eliminar"
          :loading="deletingId === line.id"
          @click="onDelete(line)"
        />
      </div>

      <div
        v-if="draft"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect
          v-model="draft.tipo_servicio"
          :items="availableItemsForDraft"
          size="xs"
          class="w-[8.5rem] shrink-0"
        />
        <UInput
          v-if="!isBqTipo(draft.tipo_servicio)"
          v-model="draft.importe"
          type="number"
          size="xs"
          class="w-[5rem] shrink-0 text-right"
        />
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          :icon="isBqTipo(draft.tipo_servicio) ? 'i-heroicons-beaker' : 'material-symbols:save-sharp'"
          :title="isBqTipo(draft.tipo_servicio) ? 'Configurar BQ' : 'Guardar'"
          :loading="creating"
          @click="isBqTipo(draft.tipo_servicio) ? openBqModal(true) : createLine()"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="shrink-0"
          icon="i-heroicons-x-mark"
          title="Cancelar"
          @click="draft = null"
        />
      </div>

      <UButton
        v-if="!draft && canAddMore"
        size="xs"
        variant="outline"
        icon="i-heroicons-plus"
        class="self-start"
        title="Agregar concepto"
        @click="openDraft"
      />
    </template>

    <template v-else>
      <div v-if="lines.length === 0" class="text-xs text-gray-600 dark:text-gray-400">Sin conceptos</div>
      <div v-for="line in lines" :key="line.id" class="text-xs leading-tight">
        <span class="font-medium">{{ labelTipo(line.tipo_servicio) }}</span>
        <span class="text-gray-600 dark:text-gray-400"> — {{ formatCurrency(line.importe) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CargosExtraServiciosCellProps } from './types'
import { computed, ref, watch } from 'vue'
import { useOverlay } from '#imports'
import { UButton, UInput, USelect } from '#components'
import BoletinQuimicoModal from '~/components/basedatos/BoletinQuimicoModal.vue'
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'
import { useModal } from '~/composables/commons/useModal'

type ServicioLine = { id: number; tipo_servicio: string; importe: number }
type DraftLine = { tipo_servicio: string; importe: string }

const props = defineProps<CargosExtraServiciosCellProps>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { addDeliveryServicioLine, updateDeliveryServicioLine, deleteDeliveryServicioLine } = useEntrega()
const { showError, showSuccess, showConfirmation } = useModal()
const overlay = useOverlay()
const boletinModal = overlay.create(BoletinQuimicoModal)

const baseOptions = [
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Montacarga', value: 'MONTACARGA' },
  { label: 'Sanciones', value: 'SANCIONES' },
  { label: 'BQ', value: 'BQ' },
]

const lines = ref<ServicioLine[]>([])
const draft = ref<DraftLine | null>(null)
const creating = ref(false)
const savingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

watch(
  () => props.servicios,
  (value) => {
    let parsed: any = value
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value)
      } catch {
        parsed = []
      }
    }
    const arr = Array.isArray(parsed) ? parsed : []
    lines.value = arr.map((x: any) => ({
      id: Number(x.id),
      tipo_servicio: normalizeTipo(x.tipo_servicio),
      importe: Number(x.importe) || 0
    }))
  },
  { immediate: true, deep: true }
)

const options = computed(() => {
  const extraFromRows = lines.value
    .map(x => normalizeTipo(x.tipo_servicio))
    .filter(Boolean)
    .filter(v => !baseOptions.some(b => b.value === v))
    .map(v => ({ label: v, value: v }))
  return [...baseOptions, ...extraFromRows]
})

const usedTipos = computed(() => new Set(lines.value.map(x => normalizeTipo(x.tipo_servicio)).filter(Boolean)))
const canAddMore = computed(() => availableItemsForDraft.value.length > 0)

const availableItemsForDraft = computed(() =>
  options.value.filter(opt => !usedTipos.value.has(opt.value))
)

function normalizeTipo(value: string | undefined) {
  const t = (value || '').toUpperCase().trim()
  return t || 'DELIVERY'
}

function isBqTipo(tipo: string) {
  return normalizeTipo(tipo) === 'BQ'
}

function getItemsForLine(line: ServicioLine) {
  return options.value.map(opt => ({
    ...opt,
    disabled: opt.value !== line.tipo_servicio && usedTipos.value.has(opt.value)
  }))
}

function openDraft() {
  if (!canAddMore.value) return
  const next = availableItemsForDraft.value[0]?.value || 'DELIVERY'
  draft.value = { tipo_servicio: next, importe: '0' }
}

function openBqModal(fromDraft = false) {
  if (!props.idContenedor) {
    showError('Error', 'Falta el consolidado de la fila')
    return
  }
  boletinModal.open({
    embedded: true,
    idContenedor: props.idContenedor,
    idCotizacion: props.idCotizacion,
    clienteNombre: props.clienteNombre || '',
    onSaved: () => {
      if (fromDraft) draft.value = null
      emit('refresh')
    },
    onClose: () => {},
  } as any)
}

function labelTipo(tipo: string) {
  if (tipo === 'MONTACARGA') return 'Montacarga'
  if (tipo === 'SANCIONES') return 'Sanciones'
  if (tipo === 'BQ') return 'BQ'
  return 'Delivery'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
}

async function createLine() {
  if (!draft.value) return
  const concept = normalizeTipo(draft.value.tipo_servicio)
  if (isBqTipo(concept)) {
    openBqModal(true)
    return
  }
  if (usedTipos.value.has(concept)) {
    showError('Error', 'El concepto ya existe en esta cotización')
    return
  }
  creating.value = true
  try {
    const res = await addDeliveryServicioLine({
      id_cotizacion: props.idCotizacion,
      tipo_servicio: concept,
      importe: Number(draft.value.importe) || 0
    })
    if (res?.success) {
      showSuccess('Guardado', 'Concepto agregado')
      draft.value = null
      emit('refresh')
    } else {
      showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo guardar')
    }
  } catch (error: any) {
    showError('Error', error?.message || String(error))
  } finally {
    creating.value = false
  }
}

async function saveLine(line: ServicioLine) {
  const concept = normalizeTipo(line.tipo_servicio)
  if (isBqTipo(concept)) {
    const otherBq = lines.value.some(x => x.id !== line.id && isBqTipo(x.tipo_servicio))
    if (otherBq) {
      showError('Error', 'El concepto BQ ya existe en esta cotización')
      return
    }
    savingId.value = line.id
    try {
      const res = await updateDeliveryServicioLine(line.id, {
        tipo_servicio: 'BQ',
        importe: Number(line.importe) || 0
      })
      if (!res?.success) {
        showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo preparar BQ')
        return
      }
      openBqModal()
    } catch (error: any) {
      showError('Error', error?.message || String(error))
    } finally {
      savingId.value = null
    }
    return
  }
  const duplicated = lines.value.some(x => x.id !== line.id && normalizeTipo(x.tipo_servicio) === concept)
  if (duplicated) {
    showError('Error', 'El concepto ya existe en esta cotización')
    return
  }
  savingId.value = line.id
  try {
    const res = await updateDeliveryServicioLine(line.id, {
      tipo_servicio: concept,
      importe: Number(line.importe) || 0
    })
    if (res?.success) {
      showSuccess('Guardado', 'Cambios guardados')
      emit('refresh')
    } else {
      showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo guardar')
    }
  } catch (error: any) {
    showError('Error', error?.message || String(error))
  } finally {
    savingId.value = null
  }
}

function onDelete(line: ServicioLine) {
  showConfirmation('Eliminar concepto', '¿Desea eliminar este concepto?', async () => {
    deletingId.value = line.id
    try {
      const res = await deleteDeliveryServicioLine(line.id)
      if (res?.success || res == null || res === '') {
        showSuccess('Eliminado', 'Concepto eliminado')
        emit('refresh')
      } else {
        showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo eliminar')
      }
    } catch (error: any) {
      showError('Error', error?.message || String(error))
    } finally {
      deletingId.value = null
    }
  })
}
</script>
