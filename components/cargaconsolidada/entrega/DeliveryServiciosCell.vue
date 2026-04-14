<template>
  <div class="flex flex-col gap-2 min-w-[200px] w-full max-w-full">
    <template v-if="editable">
      <!-- Sin líneas en BD: primera fila (select + importe + guardar) -->
      <div
        v-if="!firstLine"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect v-model="initialTipo" :items="tipoItems" size="xs" class="w-[7rem] shrink-0" />
        <UInput
          v-model="initialImporte"
          type="number"
          size="xs"
          class="w-[4.5rem] shrink-0 text-right"
          placeholder="Monto"
        />
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          icon="material-symbols:save-sharp"
          title="Guardar"
          :loading="saving === 'empty'"
          @click="saveFirstFromEmpty"
        />
      </div>

      <!-- Primera línea ya en BD -->
      <div
        v-if="firstLine"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect
          :model-value="firstLine.tipo_servicio"
          :items="tipoItems"
          size="xs"
          class="w-[7rem] shrink-0"
          @update:model-value="(v: string) => { firstLine!.tipo_servicio = v }"
        />
        <UInput
          :model-value="String(firstLine.importe)"
          type="number"
          size="xs"
          class="w-[4.5rem] shrink-0 text-right"
          @update:model-value="(v: string) => { firstLine!.importe = Number(v) || 0 }"
        />
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          icon="material-symbols:save-sharp"
          title="Guardar"
          :loading="saving === 'r1'"
          @click="() => firstLine && saveRow(firstLine)"
        />
      </div>

      <!-- Segunda fila: borrador (copia del layout; aún no en BD) -->
      <div
        v-if="secondDraft"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect
          :model-value="secondDraft.tipo_servicio"
          :items="tipoItems"
          size="xs"
          class="w-[7rem] shrink-0"
          @update:model-value="(v: string) => { secondDraft!.tipo_servicio = v }"
        />
        <UInput
          :model-value="String(secondDraft.importe)"
          type="number"
          size="xs"
          class="w-[4.5rem] shrink-0 text-right"
          @update:model-value="(v: string) => { secondDraft!.importe = Number(v) || 0 }"
        />
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          icon="material-symbols:save-sharp"
          title="Guardar"
          :loading="saving === 'r2new'"
          @click="persistSecondDraft"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          class="shrink-0"
          icon="i-heroicons-trash"
          title="Quitar"
          @click="cancelSecondDraft"
        />
      </div>

      <!-- Segunda línea ya en BD (2 líneas) -->
      <div
        v-if="secondLine && !secondDraft"
        class="flex flex-nowrap items-center gap-1.5 overflow-x-auto min-w-0 [scrollbar-width:thin]"
      >
        <USelect
          :model-value="secondLine.tipo_servicio"
          :items="tipoItems"
          size="xs"
          class="w-[7rem] shrink-0"
          @update:model-value="(v: string) => { secondLine!.tipo_servicio = v }"
        />
        <UInput
          :model-value="String(secondLine.importe)"
          type="number"
          size="xs"
          class="w-[4.5rem] shrink-0 text-right"
          @update:model-value="(v: string) => { secondLine!.importe = Number(v) || 0 }"
        />
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          class="shrink-0"
          icon="material-symbols:save-sharp"
          title="Guardar"
          :loading="saving === 'r2'"
          @click="() => secondLine && saveRow(secondLine)"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          class="shrink-0"
          icon="i-heroicons-trash"
          title="Eliminar"
          @click="() => secondLine && onDelete(secondLine)"
        />
      </div>

      <!-- + solo con 1 línea en BD y sin borrador abierto (máx. 2) -->
      <UButton
        v-if="firstLine && lines.length < 2 && !secondDraft"
        size="xs"
        variant="outline"
        icon="i-heroicons-plus"
        class="self-start"
        title="Agregar otro servicio"
        @click="openSecondDraft"
      />
    </template>
    <template v-else>
      <template v-if="lines.length">
        <div v-for="s in lines" :key="s.id" class="text-xs leading-tight">
          <span class="font-medium">{{ labelTipo(s.tipo_servicio) }}</span>
          <span class="text-gray-600 dark:text-gray-400"> — {{ formatPen(s.importe) }}</span>
        </div>
      </template>
      <div v-else class="text-xs text-gray-600 dark:text-gray-400">
        {{ labelTipo(fallbackTipo) }} — {{ formatPen(fallbackImporte) }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UButton, UInput, USelect } from '#components'
import { useModal } from '~/composables/commons/useModal'
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'

export type ServicioLine = { id: number; tipo_servicio: string; importe: number }

const props = defineProps<{
  idCotizacion: number
  servicios: ServicioLine[] | null | undefined
  editable: boolean
  fallbackTipo?: string
  fallbackImporte?: number
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { showConfirmation, showSuccess, showError } = useModal()
const { updateDeliveryServicioLine, addDeliveryServicioLine, deleteDeliveryServicioLine } = useEntrega()

const tipoItems = [
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Montacarga', value: 'MONTACARGA' }
]

const lines = ref<ServicioLine[]>([])
/** Borrador de 2.ª fila antes de guardar en BD */
const secondDraft = ref<{ tipo_servicio: string; importe: number } | null>(null)
const saving = ref<'' | 'empty' | 'r1' | 'r2' | 'r2new'>('')

const initialTipo = ref('DELIVERY')
const initialImporte = ref('0')

function normalizeTipo(t: string | undefined): 'DELIVERY' | 'MONTACARGA' {
  const u = (t || '').toUpperCase()
  return u === 'MONTACARGA' ? 'MONTACARGA' : 'DELIVERY'
}

watch(
  () => [props.fallbackTipo, props.fallbackImporte, props.editable] as const,
  () => {
    if (!props.editable) return
    initialTipo.value = normalizeTipo(props.fallbackTipo)
    initialImporte.value = String(Number(props.fallbackImporte ?? 0) || 0)
  },
  { immediate: true }
)

const firstLine = computed(() => lines.value[0] ?? null)
const secondLine = computed(() => (lines.value.length >= 2 ? lines.value[1] : null))

watch(
  () => props.servicios,
  (v) => {
    const arr = Array.isArray(v) ? v : []
    lines.value = arr.map(s => ({
      id: Number(s.id),
      tipo_servicio: s.tipo_servicio || 'DELIVERY',
      importe: Number(s.importe) || 0
    }))
    if (lines.value.length >= 2) {
      secondDraft.value = null
    }
  },
  { immediate: true, deep: true }
)

function formatPen(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(n) || 0)
}

function labelTipo(t: string | undefined) {
  if (t === 'MONTACARGA') return 'Montacarga'
  if (t === 'DELIVERY') return 'Delivery'
  if (!t || t === 'Sin servicio') return 'Sin servicio'
  return t
}

function openSecondDraft() {
  if (lines.value.length !== 1) return
  secondDraft.value = { tipo_servicio: 'DELIVERY', importe: 0 }
}

function cancelSecondDraft() {
  secondDraft.value = null
}

async function saveFirstFromEmpty() {
  saving.value = 'empty'
  try {
    const res = await addDeliveryServicioLine({
      id_cotizacion: props.idCotizacion,
      tipo_servicio: initialTipo.value,
      importe: Number(initialImporte.value) || 0
    })
    if (res?.success) {
      showSuccess('Guardado', 'Servicio registrado')
      emit('refresh')
    } else {
      showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo guardar')
    }
  } finally {
    saving.value = ''
  }
}

async function persistSecondDraft() {
  if (!secondDraft.value || lines.value.length !== 1) return
  saving.value = 'r2new'
  try {
    const res = await addDeliveryServicioLine({
      id_cotizacion: props.idCotizacion,
      tipo_servicio: secondDraft.value.tipo_servicio,
      importe: Number(secondDraft.value.importe) || 0
    })
    if (res?.success) {
      showSuccess('Guardado', 'Segundo servicio creado')
      secondDraft.value = null
      emit('refresh')
    } else {
      showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo guardar')
    }
  } finally {
    saving.value = ''
  }
}

async function saveRow(line: ServicioLine) {
  const key = line.id === firstLine.value?.id ? 'r1' : 'r2'
  saving.value = key
  try {
    const res = await updateDeliveryServicioLine(line.id, {
      tipo_servicio: line.tipo_servicio,
      importe: line.importe
    })
    if (res?.success) {
      showSuccess('Guardado', 'Cambios guardados')
      emit('refresh')
    } else {
      showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo guardar')
    }
  } finally {
    saving.value = ''
  }
}

/** DELETE puede responder 204 vacío o JSON sin `success`; si no hubo excepción, consideramos OK salvo `success: false` explícito. */
function responseLooksSuccessful(res: unknown): boolean {
  if (res == null || res === '') return true
  if (typeof res !== 'object' || res === null) return true
  const o = res as Record<string, unknown>
  if (o.success === false) return false
  if (typeof o.error === 'string' && o.error) return false
  return true
}

function onDelete(s: ServicioLine) {
  showConfirmation('Eliminar servicio', '¿Eliminar este segundo servicio?', async () => {
    try {
      const res = await deleteDeliveryServicioLine(s.id)
      if (responseLooksSuccessful(res)) {
        lines.value = lines.value.filter(l => l.id !== s.id)
        showSuccess('Eliminado', 'Servicio eliminado')
        emit('refresh')
      } else {
        showError('Error', (res as any)?.message || (res as any)?.error || 'No se pudo eliminar')
      }
    } catch (e: any) {
      showError('Error', e?.message || String(e) || 'No se pudo eliminar')
    }
  })
}
</script>
