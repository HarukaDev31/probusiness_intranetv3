<template>
  <UModal
    :open="!!target"
    :title="target?.title"
    :description="target?.kind === 'invoice' ? 'Cada emisión queda guardada con los datos de esa fecha.' : 'Cada balance queda guardado con los saldos de esa fecha.'"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <!-- #1995/#1996: aviso de éxito, historial con el más reciente resaltado. -->
      <UAlert
        v-if="justIssued"
        class="mb-3 !p-2.5"
        color="success"
        variant="subtle"
        icon="i-heroicons-check-circle"
        title="Documento generado correctamente"
        description="Se ha agregado un nuevo registro en el historial."
        :ui="{ title: 'text-xs font-semibold', description: 'text-xs', icon: 'size-4' }"
        :close="{ color: 'neutral', variant: 'link', size: 'xs' }"
        @update:open="justIssued = false"
      />
      <div class="mb-2 flex items-center gap-2 border-b border-default pb-2">
        <UIcon name="i-heroicons-document-text" class="size-5 text-highlighted" />
        <p class="text-sm font-semibold text-highlighted">Documentos generados (Historial)</p>
      </div>
      <USkeleton v-if="loading" class="h-20 w-full" />
      <p v-else-if="!history.length" class="py-2 text-sm text-muted">Aún no se emitió ningún documento. Genera el primero.</p>
      <div v-else class="flex max-h-80 flex-col gap-2 overflow-y-auto">
        <div
          v-for="(document, index) in history"
          :key="document.id"
          class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
          :class="index === 0 ? 'border-primary/30 bg-primary/10' : 'border-default'"
        >
          <UIcon name="i-heroicons-document-text" class="size-7 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-highlighted">
              {{ longDate(document.issued_on) }}
              <span v-if="index === 0" class="ml-2 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">Más reciente</span>
            </p>
            <p class="truncate text-xs text-muted">
              {{ document.generated_by || 'Sistema' }}<span v-if="document.total !== null"> · {{ usd(document.total) }}</span>
            </p>
          </div>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-down-tray"
            :loading="downloadingId === document.id"
            @click="download(document)"
          >
            Descargar PDF
          </UButton>
        </div>
      </div>
      <UAlert v-if="errorMessage" class="mt-3" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :description="errorMessage" />
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="soft" @click="emit('close')">Cerrar</UButton>
        <UButton color="primary" icon="i-heroicons-document-plus" :loading="issuing" @click="issue">Generar documento nuevo</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaDocument, ChinaDocumentTarget } from '~/types/china-billing'

const props = defineProps<{ target: ChinaDocumentTarget | null }>()
const emit = defineEmits<{ close: [] }>()

const history = ref<ChinaDocument[]>([])
const loading = ref(false)
const issuing = ref(false)
const downloadingId = ref<number | null>(null)
const errorMessage = ref('')
const justIssued = ref(false)

const MONTHS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.']
/** «17 nov. 2026», como en el modelo. */
function longDate(date: string | null): string {
  const [year, month, day] = (date || '').slice(0, 10).split('-')
  return year ? `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}` : '—'
}

watch(() => props.target, async (target) => {
  history.value = []
  errorMessage.value = ''
  justIssued.value = false
  if (!target) return
  loading.value = true
  try {
    history.value = (await ChinaBillingService.documentHistory(target)).data || []
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo cargar el historial.'
  } finally {
    loading.value = false
  }
})

async function download(doc: ChinaDocument) {
  if (!props.target) return
  downloadingId.value = doc.id
  errorMessage.value = ''
  try {
    await ChinaBillingService.downloadDocument(doc, props.target.mode)
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo descargar el documento.'
  } finally {
    downloadingId.value = null
  }
}

async function issue() {
  if (!props.target) return
  issuing.value = true
  errorMessage.value = ''
  try {
    const document = (await ChinaBillingService.issueDocument(props.target)).data
    history.value = [document, ...history.value]
    justIssued.value = true
    await ChinaBillingService.downloadDocument(document, props.target.mode)
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo generar el documento.'
  } finally {
    issuing.value = false
  }
}
</script>
