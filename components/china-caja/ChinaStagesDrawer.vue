<template>
  <USlideover :open="!!container" side="right" title="Etapas del contenedor" :ui="{ content: 'w-full max-w-[620px] sm:max-w-[620px] divide-y-0' }" @update:open="(value: boolean) => !value && emit('close')">
    <template #content>
      <div v-if="container" class="cc cc-drawer">
        <div class="cc-drawer-head">
          <div class="flex justify-between gap-3">
            <div class="flex flex-col gap-[3px]"><span class="text-xs tracking-[.08em] text-(--cc-muted)">ETAPAS DEL CONTENEDOR</span><span class="text-[21px] font-semibold leading-tight">{{ container.label }}</span><span class="text-[13px] text-(--cc-muted)">{{ container.country }} · {{ container.client }} · {{ container.cbm.toFixed(2) }} CBM</span></div>
            <button type="button" title="Cerrar" class="grid size-[38px] flex-none place-items-center rounded-[10px] text-(--cc-body) hover:bg-(--cc-empty)" @click="emit('close')"><UIcon name="i-lucide-x" class="size-5" /></button>
          </div>
          <div class="flex items-center gap-3.5">
            <div class="cc-segs cc-segs--lg"><span v-for="stage in container.progress.stages" :key="stage.number" :style="{ flex: stage.total }"><i><span :class="stage.done >= stage.total ? 'bg-(--cc-green)' : 'bg-(--cc-orange)'" :style="{ width: `${Math.round(stage.done / stage.total * 100)}%` }" /></i><span class="cc-cut">{{ CHINA_STAGE_SEGMENT[stage.number] }}</span></span></div>
            <span class="text-[28px] font-bold leading-none" :class="container.progress.complete ? 'cc-t-green' : ''">{{ container.progress.percent }}%</span>
          </div>
        </div>

        <div class="cc-drawer-body">
          <section v-for="stage in container.progress.stages" :key="stage.number" class="cc-stage">
            <button type="button" class="cc-stage-head" :aria-expanded="current === stage.number" @click="current = current === stage.number ? null : stage.number">
              <span class="cc-stage-num" :class="numberTone(stage)">{{ stage.done >= stage.total ? '✓' : stage.number }}</span>
              <span class="cc-stack flex-1"><span class="text-[15px] font-semibold">{{ stage.title }}</span><span class="cc-sub">{{ stage.locked ? stage.lock_message : `${stage.done} de ${stage.total} completados` }}</span></span>
              <span class="cc-pill !py-1 !font-medium" :class="pill(stage).tone">{{ pill(stage).label }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-[18px] text-(--cc-muted) transition-transform" :class="current === stage.number ? 'rotate-180' : ''" />
            </button>

            <div v-if="current === stage.number" class="cc-stage-body">
              <template v-if="stage.locked">
                <div v-if="stage.number === 1" class="cc-lock flex flex-col gap-2">
                  <span class="text-(--cc-ink)">La reserva se habilita cuando el contenedor llegue a <strong>60 CBM</strong>.</span>
                  <span class="block h-2 overflow-hidden rounded bg-(--cc-line2)"><span class="block h-full bg-[#f0b400]" :style="{ width: `${Math.min(100, container.cbm / CHINA_STAGE_CBM * 100)}%` }" /></span>
                  <span class="cc-sub">{{ container.cbm.toFixed(2) }} de 60 CBM · faltan {{ Math.max(0, CHINA_STAGE_CBM - container.cbm).toFixed(2) }}</span>
                </div>
                <div v-else class="cc-lock">🔒 {{ stage.lock_message }}.</div>
              </template>

              <div v-else-if="stage.number === 1" class="grid grid-cols-2 gap-3.5">
                <label v-for="field in reservation" :key="field.key" class="cc-field">{{ field.label }}
                  <div v-if="creating === field.key" class="flex gap-1.5">
                    <UInput v-model="newName" variant="none" autofocus :maxlength="field.maxlength" :placeholder="field.createPlaceholder" class="flex-1" :ui="{ base: 'cc-input' }" @keydown.enter.prevent="create(field.key)" />
                    <button type="button" class="cc-btn !px-3 !py-0 !text-[13px]" @click="create(field.key)">Crear</button>
                  </div>
                  <USelect v-else-if="field.items" :model-value="form[field.key] || undefined" :items="field.items" variant="none" placeholder="Seleccionar…" :ui="{ base: 'cc-input' }" @update:model-value="(value: string) => choose(field.key, value)" />
                  <UInputNumber v-else-if="field.type === 'amount'" v-model="freight" :min="0" :step="0.01" variant="none" placeholder="0.00" :ui="{ ...AMOUNT_UI, base: 'cc-input' }" :disabled="container.freight.paid" @change="saveFreight" />
                  <UInput v-else v-model="form[field.key]" :type="field.type" variant="none" :placeholder="field.placeholder" :ui="{ base: 'cc-input' }" @change="saveText(field.key)" />
                </label>
                <label class="cc-field">N. BL<UInput :model-value="container.data.bl_number || ''" disabled variant="none" placeholder="Se registra después del llenado" :ui="{ base: 'cc-input' }" /></label>
              </div>

              <template v-else-if="stage.number === 2">
                <div class="cc-box items-center">
                  <button type="button" class="cc-check" :class="{ on: container.data.list_updated }" role="checkbox" :aria-checked="container.data.list_updated" aria-label="Lista de embarque actualizada" @click="save({ list_updated: !container.data.list_updated })">{{ container.data.list_updated ? '✓' : '' }}</button>
                  <span class="cc-stack flex-1"><span class="text-sm font-medium">Lista de embarque actualizada</span><span class="cc-sub">Confirma cuando la lista esté revisada con el almacén</span></span>
                  <button type="button" class="cc-link" @click="navigateTo(`${listPath}/cotizaciones/${container.id}?tab=embarque`)">Ver lista</button>
                </div>
                <div class="cc-box cc-box--col !gap-2.5 !p-3.5">
                  <span class="text-sm font-semibold">Información del BL</span>
                  <label class="cc-field"><span class="flex justify-between"><span>Importador</span><span class="text-xs" :class="tagTone(container.data.bl_consignee)">{{ tag(container.data.bl_consignee) }}</span></span><UInput v-model="form.bl_consignee" variant="none" placeholder="Razón social del importador" :ui="{ base: 'cc-input' }" @change="saveText('bl_consignee')" /></label>
                  <label class="cc-field"><span class="flex justify-between"><span>Descripción del BL</span><span class="text-xs" :class="tagTone(container.data.bl_description)">{{ tag(container.data.bl_description) }}</span></span><UTextarea v-model="form.bl_description" :rows="3" :maxlength="255" variant="none" placeholder="Descripción de la mercadería para el BL" :ui="{ base: 'cc-input resize-y' }" @change="saveText('bl_description')" /></label>
                </div>
              </template>

              <template v-else>
                <div class="cc-box items-center">
                  <span class="cc-check !cursor-default" :class="{ on: container.operation }">{{ container.operation ? '✓' : '' }}</span>
                  <span class="cc-stack flex-1"><span class="text-sm font-medium">Cobro del consolidado en sistema</span><span class="text-xs" :class="container.operation ? 'cc-t-green' : container.operation_to_approve ? 'cc-t-deep' : 'text-(--cc-muted)'">{{ operationText }}</span></span>
                  <button type="button" class="cc-link" @click="navigateTo(operationLink)">Ir a Operaciones →</button>
                </div>
                <div class="cc-box cc-box--col">
                  <div class="flex items-center gap-3">
                    <span class="cc-check !cursor-default" :class="{ on: container.data.bl_draft_name }">{{ container.data.bl_draft_name ? '✓' : '' }}</span>
                    <span class="cc-stack flex-1"><span class="text-sm font-medium">BL draft</span><span class="cc-sub cc-cut">{{ container.data.bl_draft_name || 'Sube el BL draft (PDF o imagen)' }}</span></span>
                    <button v-if="container.bl_draft_url" type="button" class="cc-link" @click="viewer = true">Ver</button>
                    <button v-if="container.data.bl_draft_name" type="button" class="cc-link cc-link--danger" @click="save({ remove_bl_draft: true })">Quitar</button>
                    <label class="cc-btn cc-btn--soft !rounded-lg !px-3 !py-[7px] !text-[13px]">{{ container.data.bl_draft_name ? 'Reemplazar' : 'Subir' }}<input type="file" class="hidden" :accept="CHINA_FILE_ACCEPT" @change="uploadDraft"></label>
                  </div>
                  <label class="cc-field pl-[34px]"><span class="flex justify-between"><span>N. BL</span><span class="text-xs" :class="tagTone(container.data.bl_number)">{{ tag(container.data.bl_number) }}</span></span><UInput v-model="form.bl_number" variant="none" placeholder="ej. MEDUQ1234567" :ui="{ base: 'cc-input' }" @change="saveText('bl_number')" /></label>
                </div>
                <div class="cc-box cc-box--col !gap-2.5 !p-3.5">
                  <span class="text-sm font-semibold">Datos pendientes de la reserva</span>
                  <div v-if="container.progress.missing_reservation.length" class="cc-t-deep flex flex-wrap items-center gap-2 text-[13px]">
                    <span>Falta en reserva:</span><span v-for="name in container.progress.missing_reservation" :key="name" class="rounded-md bg-(--cc-orange-bg) px-2 py-0.5">{{ name }}</span>
                    <button type="button" class="cc-link" @click="current = 1">Completar →</button>
                  </div>
                  <span v-else class="cc-t-green text-[13px]">Reserva completa</span>
                </div>
              </template>
            </div>
          </section>
        </div>
        <VoucherViewerModal :open="viewer" :url="container.bl_draft_url" :name="container.data.bl_draft_name" title="BL draft" @close="viewer = false" />
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { AMOUNT_UI, CHINA_FILE_ACCEPT, CHINA_STAGE_CBM, CHINA_STAGE_SEGMENT } from '~/constants/chinaCaja'
import type { ChinaContainer, ChinaContainerData, ChinaContainerOptions, ChinaContainerValues, ChinaStage } from '~/types/china-caja'

interface Field { key: string; label: string; type?: string; placeholder?: string; items?: Array<string | { label: string; value: string }>; maxlength?: number; createPlaceholder?: string }

const NEW = '__new'
const TEXT_KEYS: Array<keyof ChinaContainerData> = ['filling_on', 'sailing_on', 'arrival_on', 'shipping_line', 'destination_port', 'free_days', 'container_type', 'shipper', 'bl_consignee', 'bl_description', 'bl_number']

const props = defineProps<{ container: ChinaContainer | null; options: ChinaContainerOptions; stage?: number | null }>()
const emit = defineEmits<{ close: []; save: [id: number, values: ChinaContainerValues] }>()

const current = ref<number | null>(null)
const form = reactive<Record<string, string>>({})
const freight = ref<number | null>(null)
const creating = ref('')
const newName = ref('')
const viewer = ref(false)

const creatable = (names: string[], label: string) => [...names, { label, value: NEW }]
const reservation = computed<Field[]>(() => [
  { key: 'container_type', label: 'Tipo de contenedor', items: props.options.container_types },
  { key: 'shipper', label: 'Shipping', items: creatable(props.options.shippers, '+ Crear shipping'), maxlength: 10, createPlaceholder: 'Código corto · ej. SHI-XUA' },
  { key: 'freight_usd', label: 'Precio flete (USD)', type: 'amount' },
  { key: 'filling_on', label: 'Fecha de llenado', type: 'date' },
  { key: 'sailing_on', label: 'Fecha de zarpe', type: 'date' },
  { key: 'arrival_on', label: 'Fecha de llegada', type: 'date' },
  { key: 'shipping_line', label: 'Línea naviera', items: creatable(props.options.lines, '+ Crear línea naviera'), maxlength: 100, createPlaceholder: 'Nombre de la línea' },
  { key: 'destination_port', label: 'Puerto destino', type: 'text', placeholder: 'ej. Callao' },
  { key: 'free_days', label: 'Sobrestadía', type: 'text', placeholder: 'ej. 21 días libres' }
])
const listPath = computed(() => `/cargaconsolidada/${props.container?.closed ? 'completados' : 'abiertos'}`)
const operationText = computed(() => {
  if (props.container?.operation) return `Generado automáticamente · ${props.container.operation.code}`
  return props.container?.operation_to_approve ? 'Pendiente de aprobar en Operaciones' : 'Se marca al aprobar la operación en Operaciones'
})
const operationLink = computed(() => {
  if (props.container?.operation) return `/operaciones-china?operacion=${props.container.operation.id}`
  return props.container?.operation_to_approve ? `/operaciones-china?borrador=${props.container.id}` : '/operaciones-china'
})

watch(() => props.container, (container) => {
  if (!container) return
  TEXT_KEYS.forEach((key) => { form[key] = String(container.data[key] ?? '') })
  freight.value = container.data.freight_usd
}, { immediate: true })
watch(() => [props.container?.id, props.stage], () => {
  current.value = props.stage ?? 1
  creating.value = ''
}, { immediate: true })

function numberTone(stage: ChinaStage) {
  if (stage.done >= stage.total) return 'cc-b-green'
  if (stage.locked) return 'bg-(--cc-line2) text-(--cc-muted)'
  return props.container?.progress.current === stage.number ? 'cc-b-orange' : 'bg-(--cc-empty) text-(--cc-muted)'
}

function pill(stage: ChinaStage) {
  if (stage.locked) return { label: 'Bloqueada', tone: 'bg-(--cc-empty) text-(--cc-muted)' }
  if (stage.done >= stage.total) return { label: 'Completa', tone: 'cc-c-green' }
  return stage.done ? { label: 'En curso', tone: 'cc-c-current' } : { label: 'Pendiente', tone: 'bg-(--cc-soft) text-(--cc-muted)' }
}

function tag(value: string | null) {
  return value ? 'Completo' : 'Falta'
}

function tagTone(value: string | null) {
  return value ? 'cc-t-green' : 'cc-t-deep'
}

/** Como en la maqueta, cada dato se guarda al salir del campo. */
function save(values: ChinaContainerValues) {
  if (props.container) emit('save', props.container.id, values)
}

function saveText(key: string) {
  const value = (form[key] || '').trim()
  if (value !== String(props.container?.data[key as keyof ChinaContainerData] ?? '')) save({ [key]: value })
}

function saveFreight() {
  if ((freight.value ?? null) !== props.container?.data.freight_usd) save({ freight_usd: freight.value })
}

function choose(key: string, value: string) {
  if (value === NEW) {
    creating.value = key
    newName.value = ''
    return
  }
  form[key] = value
  saveText(key)
}

function create(key: string) {
  const name = newName.value.trim().toUpperCase()
  creating.value = ''
  if (!name) return
  form[key] = name
  saveText(key)
}

function uploadDraft(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) save({ bl_draft: file })
}
</script>
