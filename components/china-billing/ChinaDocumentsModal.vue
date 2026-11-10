<template>
  <UModal
    :open="!!target"
    :title="target?.title"
    :description="target?.kind === 'invoice' ? 'Cada emisión queda guardada con los datos de esa fecha.' : 'Cada balance queda guardado con los saldos de esa fecha.'"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <USkeleton v-if="loading" class="h-20 w-full" />
      <p v-else-if="!history.length" class="text-sm text-muted">Aún no se emitió ningún documento. Genera el primero.</p>
      <div v-else class="flex flex-col divide-y divide-default">
        <div v-for="document in history" :key="document.id" class="flex items-center justify-between gap-3 py-2.5">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">{{ dayLabel(document.issued_on) }} · {{ monthLabel(document.issued_on) }}</p>
            <p class="truncate text-xs text-muted">
              {{ document.generated_by || 'Sistema' }}<span v-if="document.total !== null"> · {{ usd(document.total) }}</span>
            </p>
          </div>
          <UButton :to="document.url" target="_blank" rel="noopener" size="sm" color="neutral" variant="outline" icon="i-heroicons-arrow-down-tray">Descargar PDF</UButton>
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
const errorMessage = ref('')

watch(() => props.target, async (target) => {
  history.value = []
  errorMessage.value = ''
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

async function issue() {
  if (!props.target) return
  issuing.value = true
  errorMessage.value = ''
  try {
    const document = (await ChinaBillingService.issueDocument(props.target)).data
    history.value = [document, ...history.value]
    window.open(document.url, '_blank', 'noopener')
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo generar el documento.'
  } finally {
    issuing.value = false
  }
}
</script>
