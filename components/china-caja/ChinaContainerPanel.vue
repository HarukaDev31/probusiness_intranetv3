<template>
  <aside class="cc-panel">
    <div class="relative flex flex-col gap-1 border-b border-(--cc-line) py-[18px] pl-5 pr-[52px]">
      <button type="button" title="Cerrar" class="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-(--cc-body) hover:bg-(--cc-empty)" @click="emit('close')"><UIcon name="i-lucide-x" class="size-[18px]" /></button>
      <span class="cc-sub">{{ dmy(container.closing_on || container.closed_on) }} · {{ container.country }}</span>
      <span class="text-[20px] font-semibold leading-tight">{{ container.label }}</span>
      <span class="text-[13px] text-(--cc-muted)">BL <strong class="tracking-[.02em]" :class="container.data.bl_number ? 'text-(--cc-ink)' : 'cc-t-deep'">{{ container.data.bl_number || 'Pendiente' }}</strong></span>
      <span class="text-sm font-semibold uppercase">{{ container.client }}</span>
      <span class="cc-sub uppercase">CNE: {{ container.data.bl_consignee || '—' }}</span>
    </div>

    <div v-if="container.status.completed" class="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-(--cc-line) px-5 py-4">
      <div v-for="fact in facts" :key="fact.label" class="cc-stack"><span class="text-[11px] tracking-[.06em] text-(--cc-muted)">{{ fact.label }}</span><span class="cc-cut text-sm font-medium" :title="fact.value">{{ fact.value }}</span></div>
    </div>
    <div v-else class="cc-panel-part">
      <div class="flex flex-wrap items-baseline justify-between gap-x-2"><span class="cc-caps">DATOS DEL CONTENEDOR</span><span class="text-[11px] text-(--cc-faint)">Se guarda en Carga consolidada</span></div>
      <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-3 gap-y-2.5">
        <label v-for="field in CHINA_CONTAINER_FIELDS" :key="field.key" class="cc-field cc-field--mini" :class="field.wide ? 'col-span-2' : ''">{{ field.label }}
          <UInputNumber v-if="field.type === 'amount'" v-model="freight" :min="0" :step="0.01" variant="none" :placeholder="field.placeholder" :ui="{ ...AMOUNT_UI, base: 'cc-input cc-input--mini' }" :disabled="container.freight.paid" />
          <UInput v-else v-model="form[field.key]" :type="field.type" variant="none" :placeholder="field.placeholder" :ui="{ base: 'cc-input cc-input--mini' }" />
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="flex-1 text-[11px] text-(--cc-faint)">Cliente, país y servicio no se editan desde aquí.</span>
        <button v-if="dirty" type="button" class="cc-btn cc-btn--plain cc-btn--sm" @click="fill">Descartar</button>
        <button type="button" class="cc-btn cc-btn--sm !px-4 !py-2" :disabled="!dirty" @click="save">Guardar</button>
      </div>
    </div>

    <div class="cc-panel-part">
      <span class="cc-caps">CHECKLIST</span>
      <div class="cc-item" :class="state(hasBl, container.status.bl_due)">
        <i>{{ icon(hasBl, container.status.bl_due) }}</i>
        <span class="cc-stack flex-1 !gap-0"><span class="text-sm font-semibold">BL oficial</span><span class="cc-sub cc-cut">{{ container.data.bl_official_name || dueText(container.status.bl_from, container.status.bl_due, '3 semanas tras zarpe', '3 semanas después del zarpe') }}</span></span>
        <span v-if="hasBl" class="flex gap-1.5"><button type="button" class="cc-btn cc-btn--plain cc-btn--xs" @click="viewer = true">Ver</button><button type="button" class="cc-btn cc-btn--plain cc-btn--xs !text-(--cc-red)" title="Quitar BL" @click="removeBl">Quitar</button></span>
        <label v-else class="cc-btn cc-btn--soft cc-btn--xs"><UIcon name="i-lucide-upload" class="size-[13px]" />Subir BL<input type="file" class="hidden" :accept="CHINA_FILE_ACCEPT" @change="uploadBl"></label>
      </div>
      <div class="cc-item" :class="state(container.data.telex, container.status.arrival_due)">
        <i>{{ icon(container.data.telex, container.status.arrival_due) }}</i>
        <span class="cc-stack flex-1 !gap-0"><span class="text-sm font-semibold">Telex</span><span class="cc-sub">{{ container.data.telex ? 'Liberado' : arrivalDue }}</span></span>
        <select class="cc-telex" :class="{ on: container.data.telex }" aria-label="Telex" :value="container.data.telex ? 'SI' : 'NO'" @change="onTelex"><option value="NO">NO</option><option value="SI">SÍ</option></select>
      </div>
      <div class="cc-item" :class="container.collection === 'partial' ? 'mid' : state(container.collection === 'paid', true)">
        <i>{{ container.collection === 'partial' ? '◐' : icon(container.collection === 'paid', true) }}</i>
        <span class="cc-stack flex-1 !gap-0"><span class="text-sm font-semibold">Cobro cliente</span><span class="cc-sub cc-cut">{{ container.operation?.code || 'Aún no hay operación' }}</span></span>
        <span class="cc-pill !font-medium !py-1" :class="CHINA_COLLECTION[container.collection].tone">{{ CHINA_COLLECTION[container.collection].label }}</span>
        <button v-if="container.collection === 'none'" type="button" class="cc-btn cc-btn--xs" @click="navigateTo(container.operation_to_approve ? `/operaciones-china?borrador=${container.id}` : '/operaciones-china')">Ir a operación →</button>
      </div>
      <div class="cc-item" :class="state(container.freight.paid, container.status.arrival_due)">
        <i>{{ icon(container.freight.paid, container.status.arrival_due) }}</i>
        <span class="cc-stack flex-1 !gap-0"><span class="text-sm font-semibold">Flete pagado</span><span class="cc-sub cc-cut">{{ container.freight.paid ? `${container.freight.code} · ${container.freight.manual ? 'Confirmado manualmente' : container.freight.voucher_name}` : arrivalDue }}</span></span>
        <button v-if="container.freight.paid" type="button" class="cc-btn cc-btn--plain cc-btn--xs" @click="emit('voucher')">Ver voucher</button>
        <span v-else-if="container.data.freight_usd" class="flex flex-none gap-1.5">
          <button type="button" class="cc-btn cc-btn--plain cc-btn--xs" title="Confirmar el pago sin adjuntar voucher" @click="confirmManual">Confirmar</button>
          <button type="button" class="cc-btn cc-btn--soft cc-btn--xs" @click="emit('pay')"><UIcon name="i-lucide-upload" class="size-[13px]" />Subir voucher</button>
        </span>
      </div>
      <span v-if="!container.freight.paid && container.data.freight_usd && container.collection !== 'paid'" class="cc-t-deep px-0.5 text-xs">El cliente aún no termina de pagar este consolidado. Revisa antes de pagar el flete.</span>
    </div>
    <VoucherViewerModal :open="viewer" :url="container.bl_official_url" :name="container.data.bl_official_name" title="BL oficial" :description="`${container.label} · ${container.country}`" @close="viewer = false" />
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { AMOUNT_UI, CHINA_COLLECTION, CHINA_CONTAINER_FIELDS, CHINA_FILE_ACCEPT } from '~/constants/chinaCaja'
import type { ChinaContainer, ChinaContainerValues } from '~/types/china-caja'
import { dmy } from '~/utils/chinaCaja'
import { usd } from '~/utils/yuanFormat'

const TEXT_FIELDS = CHINA_CONTAINER_FIELDS.filter((field) => field.type !== 'amount')

const props = defineProps<{ container: ChinaContainer }>()
const emit = defineEmits<{ close: []; update: [values: ChinaContainerValues]; pay: []; 'confirm-manual': []; voucher: [] }>()
const { showConfirmation } = useModal()

const form = reactive<Record<string, string>>({})
const freight = ref<number | null>(null)
const viewer = ref(false)

const original = (key: string) => String(props.container.data[key as keyof ChinaContainer['data']] ?? '')
const hasBl = computed(() => !!props.container.data.bl_official_name)
const changed = computed(() => TEXT_FIELDS.filter(({ key }) => (form[key] || '') !== original(key)))
const freightChanged = computed(() => (freight.value ?? null) !== props.container.data.freight_usd)
const dirty = computed(() => changed.value.length > 0 || freightChanged.value)
const arrivalDue = computed(() => dueText(props.container.status.arrival_from, props.container.status.arrival_due, '1 semana antes del arribo', '1 semana antes del arribo'))
const facts = computed(() => {
  const data = props.container.data
  return [
    ['COD. BL', data.bl_number], ['COD. SHIPPER', data.shipper], ['NAVIERA', data.shipping_line], ['T. CONTENEDOR', data.container_type], ['FREE BOX', data.free_days],
    ['ZARPE', dmy(data.sailing_on)], ['ARRIBO', dmy(data.arrival_on)], ['FLETE', data.freight_usd ? usd(data.freight_usd) : ''], ['SERVICIO', 'Carga consolidada']
  ].map(([label, value]) => ({ label: label as string, value: value || '—' }))
})

function fill() {
  TEXT_FIELDS.forEach(({ key }) => { form[key] = original(key) })
  freight.value = props.container.data.freight_usd
}
// Al cambiar de contenedor o tras guardar, vuelven los valores del sistema.
watch(() => props.container, (next, previous) => {
  if (!previous || next.id !== previous.id || JSON.stringify(next.data) !== JSON.stringify(previous.data)) fill()
}, { immediate: true })

function state(done: boolean, due: boolean) {
  return done ? 'ok' : due ? '' : 'wait'
}

function icon(done: boolean, due: boolean) {
  return done ? '✓' : due ? '!' : '·'
}

function dueText(from: string | null, due: boolean, rule: string, noDate: string) {
  return from ? `${due ? 'Solicitado desde' : 'Se solicita desde'} ${dmy(from).slice(0, 5)} · ${rule}` : `Se solicita ${noDate}`
}

function save() {
  const values: ChinaContainerValues = Object.fromEntries(changed.value.map(({ key }) => [key, (form[key] || '').trim()]))
  if (freightChanged.value) values.freight_usd = freight.value
  emit('update', values)
}

function uploadBl(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('update', { bl_official: file })
}

function removeBl() {
  showConfirmation('¿Quitar el BL oficial?', 'El contenedor vuelve a quedar sin BL oficial.', () => emit('update', { remove_bl_official: true }))
}

function onTelex(event: Event) {
  emit('update', { telex: (event.target as HTMLSelectElement).value === 'SI' })
}

function confirmManual() {
  showConfirmation('¿Confirmar el pago del flete?', `${props.container.label} (${usd(props.container.data.freight_usd)}) sin voucher.`, () => emit('confirm-manual'))
}
</script>
