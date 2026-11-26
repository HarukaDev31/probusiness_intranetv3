<template>
  <UModal
    :open="!!operation"
    :title="operation ? `Facturas · ${operation.code}` : ''"
    :description="operation ? `${formatNombreEmpresa(operation.organization.name)} · Monto actual ${usd(operation.total)}` : ''"
    :dismissible="!busy"
    :ui="{ content: 'w-full max-w-[480px] sm:max-w-[480px]', header: 'border-t-4 border-t-primary-500', title: 'text-lg font-bold text-highlighted', description: 'text-[13px] text-muted' }"
    @update:open="(value: boolean) => !value && close()"
  >
    <template #body>
      <div v-if="operation" class="flex flex-col gap-2">
        <!-- Aviso de cambios desde la vigente -->
        <div v-if="current && changes.length" :class="[alertClass, tone.wait, 'items-center']">
          <UIcon name="i-heroicons-exclamation-triangle" class="size-4 flex-none" />
          <span class="flex-1">
            La V{{ current.version }} está desactualizada
            (<UTooltip :ui="tooltipUi">
              <button type="button" class="cursor-help font-bold underline decoration-dotted underline-offset-[3px]">{{ changes.length }} {{ changes.length === 1 ? 'cambio' : 'cambios' }}</button>
              <template #content>
                <ChinaInvoiceChangesTip :operation="operation" :version="current.version ?? 0" />
              </template>
            </UTooltip>)
          </span>
          <UButton
            v-if="canIssue"
            size="xs"
            color="warning"
            variant="outline"
            icon="i-heroicons-arrow-path"
            class="flex-none bg-default"
            :disabled="busy"
            @click="update"
          >
            Actualizar a V{{ nextVersion }}
          </UButton>
        </div>
        <div v-if="locked && current" :class="[alertClass, tone.info]">
          <UIcon name="i-heroicons-information-circle" class="size-4 flex-none" />
          <div><b class="block">Operación en caja:</b> la factura vigente queda cerrada. Para corregirla, anúlala con motivo y genera otra.</div>
        </div>
        <div v-if="history.length && !current && mode !== 'new'" :class="[alertClass, tone.bad]">
          <UIcon name="i-heroicons-no-symbol" class="size-4 flex-none" />
          <div><b class="block">Sin factura vigente.</b> Genera una nueva o marca una anterior como vigente.</div>
        </div>
        <div v-if="!loading && !history.length && mode !== 'new'" :class="[alertClass, tone.info]">
          <UIcon name="i-heroicons-information-circle" class="size-4 flex-none" />
          <div>Aún no hay factura. La primera quedará como vigente.</div>
        </div>

        <!-- Motivo de la acción -->
        <div v-if="mode" class="flex flex-col gap-2.5 rounded-xl border border-default bg-elevated/60 p-3.5">
          <label for="china-invoice-reason" class="text-sm font-semibold text-highlighted">{{ reasonTitle }}</label>
          <div v-if="mode === 'new' && history.length && !changes.length" :class="[alertClass, tone.wait]">
            <UIcon name="i-heroicons-exclamation-triangle" class="size-4 flex-none" />
            <div><b class="block">No hay cambios desde la factura vigente.</b>La versión nueva saldría idéntica. Genérala solo si el cliente pidió un cambio que aún no registraste.</div>
          </div>
          <p v-if="mode === 'current'" class="text-xs text-muted">La vigente actual pasará a No vigente.</p>
          <p v-if="mode === 'annul'" class="text-xs text-muted">La operación quedará sin factura vigente hasta que generes otra o marques una anterior.</p>
          <template v-if="needsReasonBox">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="quick in quickReasons"
                :key="quick"
                type="button"
                class="h-[30px] rounded-full border border-default bg-default px-2.5 text-xs font-semibold transition-colors hover:border-primary disabled:opacity-50"
                :disabled="busy"
                @click="reason = quick; confirm()"
              >
                {{ quick }}
              </button>
            </div>
            <UTextarea
              id="china-invoice-reason"
              v-model="reason"
              :rows="3"
              autoresize
              :placeholder="mode === 'current' ? 'O escribe otro motivo' : 'O escribe otro motivo (obligatorio)'"
              :color="reasonError ? 'error' : undefined"
              class="w-full"
            />
            <span v-if="reasonError" class="text-xs font-semibold text-error">Escribe un motivo para continuar.</span>
          </template>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" size="sm" :disabled="busy" @click="cancelMode">Cancelar</UButton>
            <UButton :color="mode === 'annul' ? 'error' : 'primary'" :variant="mode === 'annul' ? 'outline' : 'solid'" size="sm" :loading="busy" @click="confirm">
              {{ confirmLabel }}
            </UButton>
          </div>
        </div>

        <USkeleton v-if="loading" class="h-20 w-full" />
        <template v-else>
          <ChinaInvoiceVersionCard
            v-if="current"
            :document="current"
            :operation="operation"
            :locked="locked"
            :busy="busy"
            @download="download"
            @annul="startMode('annul', $event)"
          />
          <UCollapsible v-if="others.length" v-model:open="othersOpen" class="border-t border-default pt-1.5">
            <button type="button" class="flex h-9 w-full items-center gap-1.5 rounded-lg px-1 text-[13px] font-semibold text-muted hover:text-highlighted">
              <UIcon name="i-heroicons-chevron-right" class="size-3.5 transition-transform" :class="othersOpen ? 'rotate-90' : ''" />
              Otras versiones ({{ others.length }})
            </button>
            <template #content>
              <div class="flex flex-col gap-2 pt-1">
                <ChinaInvoiceVersionCard
                  v-for="doc in others"
                  :key="doc.id"
                  :document="doc"
                  :operation="operation"
                  :locked="locked"
                  :busy="busy"
                  @download="download"
                  @mark-current="startMode('current', $event)"
                />
              </div>
            </template>
          </UCollapsible>
        </template>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" :disabled="busy" @click="close">Cerrar</UButton>
        <UButton
          v-if="canIssue && !loading"
          :color="current ? 'neutral' : 'primary'"
          :variant="current ? 'outline' : 'solid'"
          icon="i-heroicons-plus"
          :disabled="busy"
          @click="startMode('new', null)"
        >
          {{ history.length ? 'Nueva versión' : 'Generar factura' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChinaInvoiceChangesTip from '~/components/china-billing/ChinaInvoiceChangesTip.vue'
import ChinaInvoiceVersionCard from '~/components/china-billing/ChinaInvoiceVersionCard.vue'
import {
  CHINA_INVOICE_QUICK_REASONS, invoiceChangesText, invoiceTargetFor, useChinaInvoices
} from '~/composables/china-billing/useChinaInvoices'
import { useModal } from '~/composables/commons/useModal'
import type { ChinaDocument, ChinaOperation } from '~/types/china-billing'
import { formatNombreEmpresa } from '~/utils/formatters'
import { usd } from '~/utils/yuanFormat'

type Mode = 'new' | 'current' | 'annul'

const props = defineProps<{ operation: ChinaOperation | null }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const { showError } = useModal()
const { history, loading, current, others, load, issue, markCurrent, annul, download: downloadDoc } = useChinaInvoices()

const mode = ref<Mode | null>(null)
const target = ref<ChinaDocument | null>(null)
const reason = ref('')
const reasonError = ref(false)
const busy = ref(false)
const othersOpen = ref(false)

const alertClass = 'flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs leading-[17px]'
const tone = {
  wait: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'bg-info/10 text-info',
  bad: 'bg-error/10 text-error'
}
const tooltipUi = { content: 'h-auto w-[300px] max-w-[300px] rounded-[10px] bg-slate-900 px-3 py-2.5 text-xs ring-0' }

const changes = computed(() => props.operation?.invoice?.changes || [])
const locked = computed(() => !!props.operation?.invoice?.locked)
const nextVersion = computed(() => Math.max(0, ...history.value.map((doc) => doc.version || 0)) + 1)
/** En caja con una vigente no se emite otra: primero se anula. */
const canIssue = computed(() => !(locked.value && current.value))
const needsReasonBox = computed(() => !(mode.value === 'new' && !history.value.length))
const quickReasons = computed(() => (mode.value === 'annul' ? CHINA_INVOICE_QUICK_REASONS.annul : mode.value === 'current' ? CHINA_INVOICE_QUICK_REASONS.current : CHINA_INVOICE_QUICK_REASONS.new))
const label = computed(() => (target.value ? `${props.operation?.code}-v${target.value.version}` : ''))
const reasonTitle = computed(() => {
  if (mode.value === 'new') return history.value.length ? '¿Por qué generas una versión nueva?' : 'Generar la primera factura'
  if (mode.value === 'current') return `¿Por qué ${label.value} pasa a ser la vigente?`
  return `¿Por qué anulas ${label.value}?`
})
const confirmLabel = computed(() => (mode.value === 'annul' ? 'Anular' : mode.value === 'current' ? 'Marcar como vigente' : 'Generar'))

watch(() => props.operation?.id, async (id) => {
  cancelMode()
  history.value = []
  if (!id || !props.operation) return
  try {
    await load(invoiceTargetFor(props.operation))
    othersOpen.value = !current.value
  } catch (error: unknown) {
    showError('Facturas', error instanceof Error ? error.message : 'No se pudo cargar el historial.')
  }
})

function startMode(next: Mode, doc: ChinaDocument | null) {
  mode.value = next
  target.value = doc
  reason.value = ''
  reasonError.value = false
}

function cancelMode() {
  mode.value = null
  target.value = null
  reason.value = ''
  reasonError.value = false
}

async function run(action: () => Promise<unknown>, fallback: string) {
  if (!props.operation) return
  busy.value = true
  try {
    await action()
    cancelMode()
    await load(invoiceTargetFor(props.operation))
    emit('changed')
  } catch (error: unknown) {
    showError('Facturas', error instanceof Error ? error.message : fallback)
  } finally {
    busy.value = false
  }
}

function confirm() {
  const text = reason.value.trim()
  if (needsReasonBox.value && mode.value !== 'current' && !text) {
    reasonError.value = true
    return
  }
  const operation = props.operation
  if (!operation) return
  if (mode.value === 'new') return run(() => issue(invoiceTargetFor(operation), text || undefined), 'No se pudo generar la factura.')
  if (mode.value === 'current' && target.value) {
    const doc = target.value
    return run(() => markCurrent(doc, text || undefined), 'No se pudo marcar como vigente.')
  }
  if (mode.value === 'annul' && target.value) {
    const doc = target.value
    return run(() => annul(doc, text), 'No se pudo anular la factura.')
  }
}

/** «Actualizar a Vn+1»: nueva versión con los cambios como motivo. */
function update() {
  const operation = props.operation
  if (!operation) return
  run(() => issue(invoiceTargetFor(operation), `Actualización: ${invoiceChangesText(operation)}`), 'No se pudo actualizar la factura.')
}

async function download(doc: ChinaDocument) {
  try {
    await downloadDoc(doc)
  } catch (error: unknown) {
    showError('Facturas', error instanceof Error ? error.message : 'No se pudo descargar la factura.')
  }
}

function close() {
  if (busy.value) return
  emit('close')
}
</script>
