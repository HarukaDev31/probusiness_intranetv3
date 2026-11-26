<template>
  <!-- #2037: la factura se ve en una ventana emergente, con «Descargar factura» arriba. -->
  <UModal
    :open="!!target"
    title="Factura"
    :ui="{ content: 'w-full max-w-4xl sm:max-w-4xl bg-transparent shadow-none ring-0 divide-y-0', header: 'hidden', body: 'p-0 sm:p-0', footer: 'hidden' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-end gap-2">
          <UButton v-if="document" color="primary" icon="i-heroicons-arrow-down-tray" :loading="downloading" @click="download">Descargar factura</UButton>
          <UButton color="neutral" variant="solid" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
        </div>
        <div class="h-[75vh] overflow-hidden rounded-xl bg-default shadow-lg">
          <USkeleton v-if="loading" class="h-full w-full" />
          <iframe v-else-if="document" :src="document.url" :title="target?.title || 'Factura'" class="size-full border-0" />
          <p v-else class="p-6 text-sm text-error">{{ errorMessage || 'No se pudo cargar la factura.' }}</p>
        </div>
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

const document = ref<ChinaDocument | null>(null)
const loading = ref(false)
const downloading = ref(false)
const errorMessage = ref('')

async function download() {
  if (!document.value || !props.target) return
  downloading.value = true
  try {
    await ChinaBillingService.downloadDocument(document.value, props.target.mode)
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo descargar la factura.'
  } finally {
    downloading.value = false
  }
}

// Muestra la factura vigente; si aún no hay ninguna, se emite la primera.
watch(() => props.target, async (target) => {
  document.value = null
  errorMessage.value = ''
  if (!target) return
  loading.value = true
  try {
    // El backend devuelve la factura vigente del socio (o emite la primera si aún no hay).
    document.value = (await ChinaBillingService.issueDocument(target)).data
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo cargar la factura.'
  } finally {
    loading.value = false
  }
})
</script>
