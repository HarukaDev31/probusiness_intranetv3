<template>
  <UModal
    :open="!!operation"
    :title="operation ? `Facturas · ${operation.code}` : ''"
    :description="operation ? `${formatNombreEmpresa(operation.organization.name)} · Monto actual ${usd(operation.total)}` : ''"
    :dismissible="!busy"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && close()"
  >
    <template #body>
      <div v-if="operation" class="flex flex-col gap-2">
        <div
          v-if="current && changes.length"
          class="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
        >
          <div class="flex min-w-0 items-center gap-2 text-xs font-medium">
            <UIcon name="i-heroicons-exclamation-triangle" class="size-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <span>
              La V{{ current.version }} está desactualizada
              (<UTooltip :ui="tooltipUi">
                <span class="cursor-help font-semibold underline decoration-dotted underline-offset-2">{{ changes.length }} {{ changes.length === 1 ? 'cambio' : 'cambios' }}</span>
                <template #content>
                  <ChinaInvoiceChangesTip :operation="operation" :version="current.version ?? 0" />
                </template>
              </UTooltip>)
            </span>
          </div>
          <UButton
            v-if="canIssue"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            class="shrink-0 bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100"
            :disabled="busy"
            @click="update"
          >
            Actualizar a V{{ nextVersion }}
          </UButton>
        </div>
        <UAlert
          v-if="locked && current"
          color="info"
          variant="subtle"
          icon="i-heroicons-information-circle"
          title="Operación en caja"
          description="La factura vigente queda cerrada. Para corregirla, anúlala con motivo y genera otra."
          :ui="alertUi"
        />
        <UAlert
          v-if="history.length && !current && mode !== 'new'"
          color="error"
          variant="subtle"
          icon="i-heroicons-no-symbol"
          title="Sin factura vigente"
          description="Genera una nueva o marca una anterior como vigente."
          :ui="alertUi"
        />
        <p v-if="!loading && !history.length && mode !== 'new'" class="py-2 text-sm text-muted">Aún no hay factura. La primera quedará como vigente.</p>

        <!-- Motivo de la acción -->
        <div v-if="mode" class="flex flex-col gap-2 rounded-xl border border-default p-3">
          <label for="china-invoice-reason" class="text-sm font-semibold text-highlighted">{{ reasonTitle }}</label>
          <UAlert
            v-if="mode === 'new' && history.length && !changes.length"
            color="warning"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle"
            title="No hay cambios desde la factura vigente"
            description="La versión nueva saldría idéntica. Genérala solo si el cliente pidió un cambio que aún no registraste."
            :ui="alertUi"
          />
          <p v-if="mode === 'current'" class="text-xs text-muted">La vigente actual pasará a No vigente.</p>
          <p v-if="mode === 'annul'" class="text-xs text-muted">La operación quedará sin factura vigente hasta que generes otra o marques una anterior.</p>
          <template v-if="needsReasonBox">
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="quick in quickReasons"
                :key="quick"
                size="xs"
                color="neutral"
                variant="outline"
                class="rounded-full"
                :disabled="busy"
                @click="reason = quick; confirm()"
              >
                {{ quick }}
              </UButton>
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
            <span v-if="reasonError" class="text-xs text-error">Escribe un motivo para continuar.</span>
          </template>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="soft" size="sm" :disabled="busy" @click="cancelMode">Cancelar</UButton>
            <UButton :color="mode === 'annul' ? 'error' : 'primary'" size="sm" :loading="busy" @click="confirm">
              {{ confirmLabel }}
            </UButton>
          </div>
        </div>

        <div class="flex items-center gap-2 border-b border-default pb-2">
          <UIcon name="i-heroicons-document-text" class="size-5 text-highlighted" />
          <p class="text-sm font-semibold text-highlighted">Versiones de la factura</p>
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
          <UCollapsible v-if="others.length" v-model:open="othersOpen" class="border-t border-default pt-1">
            <UButton
              color="neutral"
              variant="link"
              :icon="othersOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="px-0"
            >
              Otras versiones ({{ others.length }})
            </UButton>
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
        <UButton color="neutral" variant="soft" :disabled="busy" @click="close">Cerrar</UButton>
        <UButton
          v-if="canIssue && !loading"
          color="primary"
          icon="i-heroicons-document-plus"
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

/** Mismo UAlert compacto que el historial de documentos. */
const alertUi = { root: '!p-2.5', title: 'text-xs font-semibold', description: 'text-xs', icon: 'size-4' }
const tooltipUi = { content: 'h-auto max-w-sm bg-inverted px-3 py-2.5 text-inverted' }

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
