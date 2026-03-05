<template>
  <div class="md:p-6">
    <PageHeader
      :title="title"
      :subtitle="subtitle"
      icon="i-heroicons-folder-open"
      :hide-back-button="false"
      @back="navigateTo('/cotizaciones')"
    />

    <!-- Skeleton -->
    <div v-if="loading" class="mt-6 space-y-6">
      <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
      <UCard class="p-6">
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </UCard>
    </div>

    <!-- Error -->
    <UCard v-else-if="error" class="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
        <span>{{ error }}</span>
      </div>
    </UCard>

    <!-- Contenido -->
    <div v-else class="mt-6">
      <UCard class="p-6 rounded-lg shadow-md">
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Documentos asociados
            </h3>
            <UButton
              v-if="pendingFiles.length > 0"
              label="Guardar todo"
              color="primary"
              variant="solid"
              icon="i-heroicons-arrow-up-tray"
              :loading="savingAll"
              :disabled="savingAll"
              @click="handleGuardarTodo"
            />
          </div>
        </template>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Selecciona uno o más archivos y haz clic en «Guardar todo» para subirlos. También puedes subir cada archivo por separado con el botón de subir.
        </p>
        <FileUploader
          :key="uploaderKey"
          :multiple="true"
          :initial-files="initialFiles"
          :model-files="pendingFiles"
          :accepted-types="['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.xlsm', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']"
          :immediate="false"
          :show-save-button="true"
          :show-remove-button="true"
          custom-message="Arrastra archivos aquí o haz clic en «Subir archivo»"
          @save-file="handleSaveFile"
          @files-selected="handleFilesSelected"
          @file-removed="handleFileRemoved"
          @error="handleUploadError"
        />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '~/components/PageHeader.vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import { CalculadoraImportacionService } from '~/services/calculadora-importacion/calculadoraImportacionService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { FileItem } from '~/types/commons/file'

const route = useRoute()
const cotizacionId = computed(() => Number(route.params.id))

const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const loading = ref(true)
const error = ref<string | null>(null)
const documents = ref<Array<{ id: number; file_url: string; file_name: string; size: number }>>([])
const cotizacionInfo = ref<{ id: number; cod_cotizacion?: string; nombre_cliente?: string } | null>(null)
const uploaderKey = ref(0)
/** Archivos seleccionados pendientes de subir (batch) */
const pendingFiles = ref<File[]>([])
const savingAll = ref(false)

const title = computed(() => {
  const c = cotizacionInfo.value
  if (!c) return 'Documentos'
  return `Documentos — ${c.cod_cotizacion || `Cotización #${c.id}`}`
})
const subtitle = computed(() => cotizacionInfo.value?.nombre_cliente ?? '')

/** Archivos ya subidos en formato FileItem para FileUploader */
const initialFiles = computed<FileItem[]>(() =>
  documents.value.map((d) => ({
    id: d.id,
    file_name: d.file_name,
    file_url: d.file_url,
    type: 'document',
    size: d.size ?? 0,
    lastModified: 0,
    file_ext: (d.file_name?.split('.').pop() ?? '').toLowerCase(),
  }))
)

async function loadDocumentos() {
  loading.value = true
  error.value = null
  try {
    const res = await CalculadoraImportacionService.getDocumentosCotizacion(cotizacionId.value)
    if (res?.success && Array.isArray(res.data)) {
      documents.value = res.data
      cotizacionInfo.value = res.cotizacion ?? null
    } else {
      error.value = 'No se pudieron cargar los documentos.'
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Error al cargar documentos.'
  } finally {
    loading.value = false
  }
}

function handleFilesSelected(files: File[]) {
  pendingFiles.value = [...pendingFiles.value, ...files]
}

async function handleSaveFile(file: File) {
  try {
    await withSpinner(async () => {
      const res = await CalculadoraImportacionService.uploadDocumentoCotizacion(cotizacionId.value, file)
      if (res?.success && res?.data) {
        documents.value = [res.data, ...documents.value]
        pendingFiles.value = pendingFiles.value.filter((f) => f !== file)
        uploaderKey.value++
        showSuccess('Documento subido', 'El archivo se subió correctamente.', { duration: 3000 })
      } else {
        showError('Error al subir', res?.message ?? 'No se pudo subir el documento.')
      }
    }, 'Subiendo documento...')
  } catch (e: any) {
    showError('Error al subir', e?.message ?? 'No se pudo subir el documento.')
  }
}

async function handleGuardarTodo() {
  if (pendingFiles.value.length === 0) return
  savingAll.value = true
  const toUpload = [...pendingFiles.value]
  pendingFiles.value = []
  uploaderKey.value++
  let ok = 0
  let fail = 0
  try {
    await withSpinner(async () => {
      for (const file of toUpload) {
        try {
          const res = await CalculadoraImportacionService.uploadDocumentoCotizacion(cotizacionId.value, file)
          if (res?.success && res?.data) {
            documents.value = [res.data, ...documents.value]
            ok++
          } else {
            fail++
          }
        } catch {
          fail++
        }
      }
    }, `Subiendo ${toUpload.length} archivo(s)...`)
    if (fail === 0) {
      showSuccess('Guardado', `Se subieron ${ok} documento(s) correctamente.`, { duration: 3000 })
    } else if (ok > 0) {
      showSuccess('Guardado parcial', `Se subieron ${ok} de ${toUpload.length}. No se pudieron subir ${fail}.`, { duration: 4000 })
    } else {
      showError('Error', 'No se pudo subir ningún archivo.')
    }
  } catch (e: any) {
    showError('Error al guardar', e?.message ?? 'No se pudieron subir los archivos.')
  } finally {
    savingAll.value = false
  }
}

function handleFileRemoved(payload: number) {
  const isExistingId = documents.value.some((d) => d.id === payload)
  if (isExistingId) {
    withSpinner(async () => {
      try {
        await CalculadoraImportacionService.deleteDocumentoCotizacion(payload)
        documents.value = documents.value.filter((d) => d.id !== payload)
        showSuccess('Documento eliminado', 'El archivo se eliminó correctamente.', { duration: 3000 })
      } catch (e: any) {
        showError('Error al eliminar', e?.message ?? 'No se pudo eliminar el documento.')
      }
    })
  } else {
    const index = payload
    if (index >= 0 && index < pendingFiles.value.length) {
      pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index)
    }
  }
}

function handleUploadError(message: string) {
  showError('Archivo', message)
}

onMounted(() => {
  loadDocumentos()
})
</script>
