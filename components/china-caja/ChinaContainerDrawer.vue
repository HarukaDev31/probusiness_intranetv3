<template>
  <USlideover :open="!!container" side="right" :ui="{ content: 'w-full max-w-xl sm:max-w-xl', body: 'bg-elevated/40' }" @update:open="(value: boolean) => !value && emit('close')">
    <template #header>
      <div v-if="container" class="flex w-full items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted">{{ container.country }} · Carga consolidada</p>
          <p class="truncate text-2xl font-bold text-highlighted">{{ container.label }}</p>
          <p class="text-sm text-muted">{{ container.client }} · {{ containerArrivalText(container) }}</p>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
      </div>
    </template>
    <template #body>
      <div v-if="container" class="flex flex-col gap-5">
        <section class="rounded-xl border border-default bg-default p-4">
          <p class="mb-3 font-semibold text-highlighted">Datos del contenedor</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField v-for="field in CHINA_CONTAINER_FIELDS" :key="field.key" :label="field.label">
              <USelect v-if="field.type === 'list'" v-model="form[field.key]" :items="containerTypes" class="w-full" />
              <UInputNumber v-else-if="field.type === 'amount'" v-model="freight" :min="0" :step="0.01" :ui="AMOUNT_UI" :disabled="container.freight.paid" class="w-full" />
              <UInput v-else v-model="form[field.key]" :type="field.type" class="w-full" />
            </UFormField>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <UButton v-if="dirty" color="neutral" variant="ghost" @click="fill">Descartar</UButton>
            <UButton color="primary" :disabled="!dirty" @click="save">Guardar</UButton>
          </div>
        </section>

        <section class="flex flex-col gap-3 rounded-xl border border-default bg-default p-4 text-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">BL oficial</p>
              <p class="text-muted">{{ container.data.bl_official_name || dueText(container.status.bl_from, container.status.bl_due, '3 semanas tras zarpe') }}</p>
            </div>
            <div class="flex gap-2">
              <UButton v-if="container.bl_official_url" size="xs" color="neutral" variant="outline" @click="() => { viewer = { url: container.bl_official_url, name: container.data.bl_official_name } }">Ver</UButton>
              <UButton v-if="container.data.bl_official_name" size="xs" color="error" variant="link" @click="removeBl">Eliminar</UButton>
            </div>
          </div>
          <YuanFilePick v-if="!container.data.bl_official_name" label="Subir BL oficial (PDF o imagen)" :accept="CHINA_FILE_ACCEPT" @pick="(file) => file && emit('update', { bl_official: file })" />
          <USeparator />
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">Telex</p>
              <p class="text-muted">{{ container.data.telex ? 'Liberado' : dueText(container.status.arrival_from, container.status.arrival_due, '1 semana antes del arribo') }}</p>
            </div>
            <USelect :model-value="container.data.telex ? 'si' : 'no'" :items="TELEX" class="w-24" @update:model-value="(value: string) => emit('update', { telex: value === 'si' })" />
          </div>
          <USeparator />
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1">
              <p class="font-semibold text-highlighted">Cobro cliente</p>
              <p class="text-muted">{{ container.operation?.code || 'Aún no hay operación' }}</p>
            </div>
            <UBadge v-if="container.operation" :color="CHINA_COLLECTION[container.collection].color" variant="soft">{{ CHINA_COLLECTION[container.collection].label }}</UBadge>
            <UButton size="xs" color="primary" variant="link" :to="operationLink">Ir a operación →</UButton>
          </div>
          <USeparator />
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">Flete pagado</p>
              <p class="text-muted">{{ freightText }}</p>
            </div>
            <div class="flex flex-none gap-2">
              <template v-if="container.freight.paid">
                <UButton v-if="container.freight.voucher_url" size="xs" color="neutral" variant="outline" @click="() => { viewer = { url: container.freight.voucher_url, name: container.freight.voucher_name } }">Ver voucher</UButton>
                <UButton size="xs" color="error" variant="link" @click="cancel">Anular</UButton>
              </template>
              <template v-else-if="container.data.freight_usd">
                <UButton size="xs" color="primary" @click="emit('pay')">Pagar</UButton>
                <UButton size="xs" color="neutral" variant="outline" @click="confirmManual">Sin voucher</UButton>
              </template>
            </div>
          </div>
          <p v-if="!container.freight.paid && container.data.freight_usd && container.collection !== 'paid'" class="text-xs text-warning">El cliente aún no paga esta operación.</p>
        </section>
      </div>
      <VoucherViewerModal :open="!!viewer" :url="viewer?.url || null" :name="viewer?.name || null" @close="viewer = null" />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI, CHINA_COLLECTION, CHINA_CONTAINER_FIELDS, CHINA_FILE_ACCEPT } from '~/constants/chinaCaja'
import type { ChinaContainer, ChinaContainerValues } from '~/types/china-caja'
import { containerArrivalText } from '~/utils/chinaCaja'
import { dayLabel, usd } from '~/utils/yuanFormat'

const TELEX = [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }]
const TEXT_FIELDS = CHINA_CONTAINER_FIELDS.filter((field) => field.type !== 'amount')

const props = defineProps<{ container: ChinaContainer | null; containerTypes: string[] }>()
const emit = defineEmits<{ close: []; update: [values: ChinaContainerValues]; pay: []; 'confirm-manual': []; 'cancel-freight': [] }>()
const { showConfirmation } = useModal()

const form = reactive<Record<string, string>>({})
const freight = ref<number | null>(null)
const viewer = ref<{ url: string | null; name: string | null } | null>(null)

const original = (key: string) => String(props.container?.data[key as keyof ChinaContainer['data']] ?? '')
const changed = computed(() => TEXT_FIELDS.filter(({ key }) => form[key] !== original(key)))
const freightChanged = computed(() => !!props.container && (freight.value ?? null) !== props.container.data.freight_usd)
const dirty = computed(() => changed.value.length > 0 || freightChanged.value)
const operationLink = computed(() => {
  if (props.container?.operation) return `/operaciones-china?operacion=${props.container.operation.id}`
  return props.container?.operation_to_approve ? `/operaciones-china?borrador=${props.container.id}` : '/operaciones-china'
})
const freightText = computed(() => {
  const row = props.container
  if (!row) return ''
  if (row.freight.paid) return `${dayLabel(row.freight.paid_on)} · ${row.freight.manual ? 'Confirmado manualmente' : row.freight.voucher_name}`
  return row.data.freight_usd ? `${usd(row.data.freight_usd)} · ${dueText(row.status.arrival_from, row.status.arrival_due, '1 semana antes del arribo')}` : 'Sin precio de flete'
})

function fill() {
  TEXT_FIELDS.forEach(({ key }) => { form[key] = original(key) })
  freight.value = props.container?.data.freight_usd ?? null
}
watch(() => props.container?.id, fill, { immediate: true })

function dueText(from: string | null, due: boolean, rule: string) {
  return from ? `${due ? 'Solicitado desde' : 'Se solicita desde'} ${dayLabel(from)} · ${rule}` : `Se solicita ${rule}`
}

function save() {
  const values: ChinaContainerValues = Object.fromEntries(changed.value.map(({ key }) => [key, String(form[key] ?? '').trim()]))
  if (freightChanged.value) values.freight_usd = freight.value
  emit('update', values)
}

function removeBl() {
  showConfirmation('¿Eliminar el BL oficial?', 'El contenedor vuelve a quedar sin BL oficial.', () => emit('update', { remove_bl_official: true }))
}

function confirmManual() {
  showConfirmation('¿Confirmar el pago sin voucher?', `${props.container?.label} · ${usd(props.container?.data.freight_usd)}`, () => emit('confirm-manual'))
}

function cancel() {
  showConfirmation('¿Anular el pago del flete?', 'Todos los contenedores de ese pago vuelven a «Por pagar».', () => emit('cancel-freight'))
}

// Tras guardar, los valores normalizados por el sistema vuelven al formulario.
watch(() => props.container?.data, (next, previous) => { if (next && previous && next !== previous && !viewer.value) fill() })
</script>
