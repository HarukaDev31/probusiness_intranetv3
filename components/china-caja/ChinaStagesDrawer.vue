<template>
  <USlideover :open="!!container" side="right" :ui="{ content: 'w-full max-w-xl sm:max-w-xl', body: 'bg-elevated/40' }" @update:open="(value: boolean) => !value && emit('close')">
    <template #header>
      <div v-if="container" class="flex w-full items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted">{{ container.country }} · {{ container.client }} · {{ container.cbm.toFixed(2) }} CBM</p>
          <p class="truncate text-2xl font-bold text-highlighted">{{ container.label }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold" :class="container.progress.complete ? 'text-success' : 'text-highlighted'">{{ container.progress.percent }}%</span>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
        </div>
      </div>
    </template>
    <template #body>
      <div v-if="container" class="flex flex-col gap-4">
        <section v-for="stage in container.progress.stages" :key="stage.number" class="rounded-xl border border-default bg-default">
          <button type="button" class="flex w-full items-center gap-3 p-4 text-left" @click="current = current === stage.number ? null : stage.number">
            <span class="grid size-8 flex-none place-items-center rounded-full text-sm font-bold" :class="circle(stage)">{{ stage.done === stage.total ? '✓' : stage.number }}</span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold text-highlighted">{{ stage.title }}</span>
              <span class="block text-sm text-muted">{{ stage.locked ? stage.lock_message : `${stage.done} de ${stage.total} completados` }}</span>
            </span>
            <UIcon :name="stage.locked ? 'i-heroicons-lock-closed' : current === stage.number ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="size-5 text-muted" />
          </button>

          <div v-if="current === stage.number" class="border-t border-default p-4">
            <div v-if="stage.locked">
              <p class="text-sm text-muted">{{ stage.lock_message }}.</p>
              <UProgress v-if="stage.number === 1" class="mt-3" :model-value="Math.min(100, container.cbm / 60 * 100)" />
            </div>

            <div v-else-if="stage.number === 1" class="grid gap-3 sm:grid-cols-2">
              <UFormField v-for="field in reservation" :key="field.key" :label="field.label">
                <UInputMenu v-if="field.items" v-model="form[field.key]" :items="field.items" :create-item="field.create" class="w-full" @create="(value: string) => create(field.key, value)" />
                <UInput v-else v-model="form[field.key]" :type="field.type" :step="field.type === 'number' ? '0.01' : undefined" :min="field.type === 'number' ? 0 : undefined" class="w-full" />
              </UFormField>
            </div>

            <div v-else-if="stage.number === 2" class="flex flex-col gap-3">
              <UCheckbox v-model="listUpdated" label="Lista de embarque actualizada" description="Cajas, CBM, peso y fecha de llegada de cada proveedor" />
              <UFormField label="Importador (BL)"><UInput v-model="form.bl_consignee" class="w-full" /></UFormField>
              <UFormField label="Descripción (BL)"><UInput v-model="form.bl_description" class="w-full" /></UFormField>
            </div>

            <div v-else class="flex flex-col gap-3">
              <div class="flex items-center gap-3 rounded-lg border border-default p-3 text-sm">
                <UIcon :name="container.operation ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="size-5" :class="container.operation ? 'text-success' : 'text-warning'" />
                <span class="flex-1">
                  <span class="block font-medium text-highlighted">Cobro del consolidado en sistema</span>
                  <span class="text-muted">{{ operationText }}</span>
                </span>
                <UButton v-if="!container.operation" size="xs" color="primary" variant="link" :to="`/operaciones-china${container.operation_to_approve ? `?borrador=${container.id}` : ''}`">Ir a Operaciones</UButton>
              </div>
              <YuanFilePick label="Sube el BL draft (PDF o imagen)" accept=".pdf,image/*" :current-name="container.data.bl_draft_name" @pick="(file) => { draft = file }" />
              <a v-if="container.bl_draft_url" :href="container.bl_draft_url" target="_blank" rel="noopener" class="text-sm text-primary hover:underline">Ver BL draft</a>
              <UFormField label="N. BL"><UInput v-model="form.bl_number" class="w-full" /></UFormField>
              <div v-if="container.progress.missing_reservation.length" class="rounded-lg bg-warning/10 p-3 text-sm">
                <p class="text-warning">Faltan datos de la reserva: {{ container.progress.missing_reservation.join(', ') }}</p>
                <UButton class="px-0" size="xs" color="primary" variant="link" @click="current = 1">Completar en Etapa 1</UButton>
              </div>
              <p v-else class="text-sm text-success">Reserva completa</p>
            </div>

            <div v-if="!stage.locked" class="mt-4 flex justify-end">
              <UButton color="primary" :loading="saving" @click="save(stage.number)">Guardar</UButton>
            </div>
          </div>
        </section>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerData, ChinaContainerOptions, ChinaStage } from '~/types/china-caja'

const props = defineProps<{ container: ChinaContainer | null; options: ChinaContainerOptions; stage?: number | null }>()
const emit = defineEmits<{ close: []; saved: [container: ChinaContainer] }>()
const { showError, showSuccess } = useModal()

const current = ref<number | null>(null)
const form = reactive<Record<string, string>>({})
const listUpdated = ref(false)
const draft = ref<File | null>(null)
const saving = ref(false)
const extra = reactive<Record<string, string[]>>({ shipping_line: [], shipper: [] })

const RESERVATION_KEYS = ['freight_usd', 'filling_on', 'sailing_on', 'arrival_on', 'shipping_line', 'destination_port', 'free_days', 'container_type', 'shipper'] as const
const TEXT_KEYS = [...RESERVATION_KEYS, 'bl_consignee', 'bl_description', 'bl_number'] as const

const reservation = computed(() => [
  { key: 'freight_usd', label: 'Precio flete (USD)', type: 'number' },
  { key: 'filling_on', label: 'Fecha de llenado', type: 'date' },
  { key: 'sailing_on', label: 'Fecha de zarpe', type: 'date' },
  { key: 'arrival_on', label: 'Fecha de llegada', type: 'date' },
  { key: 'shipping_line', label: 'Línea naviera', items: [...props.options.lines, ...extra.shipping_line!], create: true },
  { key: 'destination_port', label: 'Puerto destino', type: 'text' },
  { key: 'free_days', label: 'Sobrestadía', type: 'text' },
  { key: 'container_type', label: 'Tipo de contenedor', items: props.options.container_types, create: false },
  { key: 'shipper', label: 'Shipping', items: [...props.options.shippers, ...extra.shipper!], create: true }
] as Array<{ key: string; label: string; type?: string; items?: string[]; create?: boolean }>)

const operationText = computed(() => {
  if (props.container?.operation) return `Generado automáticamente · ${props.container.operation.code}`
  return props.container?.operation_to_approve ? 'Pendiente de aprobar en Operaciones' : 'Se marca al aprobar la operación en Operaciones'
})

// Solo se rellena al abrir otro contenedor o tras guardar: no pisa lo que se está escribiendo.
watch(() => props.container, (container) => {
  if (!container) return
  TEXT_KEYS.forEach((key) => { form[key] = String(container.data[key as keyof ChinaContainerData] ?? '') })
  listUpdated.value = container.data.list_updated
  draft.value = null
}, { immediate: true })
watch(() => [props.container?.id, props.stage], () => { current.value = props.stage ?? 1 }, { immediate: true })

function circle(stage: ChinaStage) {
  if (stage.done === stage.total) return 'bg-success text-white'
  if (stage.locked) return 'bg-accented text-muted'
  return props.container?.progress.current === stage.number ? 'bg-primary text-white' : 'bg-elevated text-toned'
}

function create(key: string, value: string) {
  const name = value.trim().toUpperCase()
  if (!name) return
  extra[key]?.push(name)
  form[key] = name
}

async function save(stage: number) {
  if (!props.container) return
  const values: Record<string, string | boolean | File | null> = {}
  const keys = stage === 1 ? RESERVATION_KEYS : stage === 2 ? ['bl_consignee', 'bl_description'] : ['bl_number']
  keys.forEach((key) => { values[key] = String(form[key] ?? '').trim() })
  if (stage === 2) values.list_updated = listUpdated.value
  if (stage === 3 && draft.value) values.bl_draft = draft.value
  saving.value = true
  try {
    emit('saved', (await ChinaCajaService.updateContainer(props.container.id, values)).data)
    showSuccess('Etapas', 'Datos guardados.')
  } catch (error: any) {
    showError('Etapas', error?.message || 'No se pudo guardar.')
  } finally {
    saving.value = false
  }
}
</script>
