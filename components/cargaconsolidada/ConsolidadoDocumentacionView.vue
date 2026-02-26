<template>
  <div class="">
    <div class="flex flex-col md:flex-row justify-between mb-2 p-2 md:mb-6 md:p-6 border-b border-gray-200 dark:border-gray-700">
      <PageHeader :title="''" :subtitle="''" :icon="''" :hide-back-button="false" @back="goBack" />
      <div class="hidden md:flex items-center gap-3 flex-row flex-wrap w-full md:justify-end" v-if="role === ROLES.COORDINACION || role === ROLES.DOCUMENTACION || role === ROLES.JEFE_IMPORTACIONES">
        <UButton v-if="role === ROLES.COORDINACION || role === ROLES.JEFE_IMPORTACIONES || role === ROLES.DOCUMENTACION" label="Factura General" variant="solid" icon="i-heroicons-arrow-down-tray" color="primary" size="sm"
          :loading="downloadingFactura" @click="handleDownloadFactura" class="whitespace-nowrap" />
        <UButton v-if="role === ROLES.COORDINACION" label="Descargar plantillas" variant="solid" icon="i-heroicons-arrow-down-tray" color="primary" size="sm"
          @click="handleDownloadAll" class="whitespace-nowrap" />
        <UButton v-if="role === ROLES.DOCUMENTACION || role === ROLES.JEFE_IMPORTACIONES || role === ROLES.COORDINACION" label="Nuevo documento" variant="solid" icon="i-heroicons-plus" color="warning" size="sm"
          @click="handleNuevoDocumento" class="whitespace-nowrap" />
      </div>
      <div class="flex items-center gap-3 flex-wrap" v-if="role === ROLES.ADMINISTRACION || role === ROLES.CONTABILIDAD">
        <UButton label="Descargar plantillas"
          variant="solid" icon="i-heroicons-arrow-down-tray" color="primary" size="sm"
          @click="handleDownloadAllAdministracion" />
      </div>
    </div>

    <div v-if="loading" class="mt-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="i in 6" :key="i" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse">
          <div class="flex items-center justify-between mb-4">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div class="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <div class="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2" />
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto" />
            </div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="mt-6">
      <UCard class="bg-red-50 border-red-200">
        <div class="flex items-center gap-2 text-red-800">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </UCard>
    </div>
    <div v-else-if="hasData" class="flex flex-col gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <span class="text-lg font-semibold text-gray-900 dark:text-white px-3 py-1 rounded">Documentación</span>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="folder in foldersByCategoria" :key="folder.id" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white px-3 py-1 rounded">
              {{ folder.folder_name }}
            </h3>
          </div>
          <FileUploader
            :disabled="role !== ROLES.DOCUMENTACION && role !== ROLES.JEFE_IMPORTACIONES"
            :accepted-types="acceptedFileTypes"
            :custom-message="uploadMessage"
            :immediate="false"
            :show-remove-button="folder.id != 1 && role == ROLES.DOCUMENTACION"
            :showSaveButton="true"
            :initial-files="folder.file_url ? [{
              id: typeof folder.id === 'number' ? folder.id : 0,
              file_name: folder.folder_name,
              file_url: folder.file_url,
              type: folder.type || '',
              size: 0,
              lastModified: 0,
              file_ext: folder.type || ''
            }] : []"
            :loading="isFolderLoading(folder.id)"
            @file-removed="() => handleFileRemove(folder.id_file)"
            @save-file="(file) => handleSaveFile(file, folder.id)"
          />
        </div>
      </div>
    </div>

    <div v-else class="mt-6">
      <UCard class="bg-gray-50 dark:bg-gray-800">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-folder" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay folders de documentación
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            No se encontraron folders de documentación para mostrar.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useDocumentacion } from '~/composables/cargaconsolidada/useDocumentacion'
import FileUploader from '~/components/commons/FileUploader.vue'
import CreateDocumentModal from '~/components/CreateDocumentModal.vue'
import { ROLES } from '~/constants/roles'

const props = withDefaults(
  defineProps<{
    role: string
    /** Base path (ej. /cargaconsolidada/abiertos). Back va a basePath/pasos/id */
    basePath: string
  }>(),
  {}
)

const downloadingFactura = ref(false)
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const {
  loading,
  error,
  hasData,
  foldersByCategoria,
  getFolders,
  isFolderLoading,
  uploadFileDocumentation,
  downloadFacturaComercial,
  deleteFileDocumentation,
  downloadAllFiles,
  createNewFolder,
  downloadAllFilesAdministracion,
} = useDocumentacion()

const route = useRoute()
const contenedorId = route.params.id as string

const pasosUrl = computed(() => `${props.basePath}/pasos/${contenedorId}`)

const acceptedFileTypes = ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.xlsm', '.csv', '.xlsb', '.xltx', '.xlt']
const uploadMessage = 'Selecciona o arrastra tu archivo aquí'

const handleSaveFile = async (file: File, folderId: string) => {
  await withSpinner(async () => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('idFolder', folderId)
      formData.append('idContenedor', contenedorId)
      const result = await uploadFileDocumentation(formData)
      if (result.success) {
        showSuccess('Éxito', 'Archivo subido correctamente')
      } else {
        showError('Error', result.error || 'Error al subir el archivo')
      }
    } catch (err) {
      showError('Error', 'Error al subir el archivo')
    }
  })
}

const handleFileRemove = (idFile: number) => {
  if (!idFile) {
    showError('Error', 'ID de archivo no válido')
    return
  }
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const result = await deleteFileDocumentation(idFile)
          if (result.success) {
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
            await getFolders(contenedorId)
          }
        }, 'Eliminando archivo...')
      } catch (err) {
        showError('Error de Eliminación', 'Error al eliminar el archivo')
      }
    }
  )
}

const handleDownloadAll = async () => {
  try {
    await withSpinner(async () => {
      const result = await downloadAllFiles(contenedorId)
      if (result.success) {
        showSuccess('Éxito', 'Descarga iniciada correctamente')
      } else {
        showError('Error', 'Error al preparar la descarga')
      }
    }, 'Preparando descarga de todos los archivos...')
  } catch (err) {
    showError('Error', 'Error al preparar la descarga')
  }
}

const handleDownloadAllAdministracion = async () => {
  try {
    await withSpinner(async () => {
      await downloadAllFilesAdministracion(contenedorId)
    }, 'Preparando descarga de todos los archivos...')
  } catch (err) {
    showError('Error', 'Error al preparar la descarga')
  }
}

const overlay = useOverlay()
const createDocumentModal = overlay.create(CreateDocumentModal)

const handleNuevoDocumento = () => {
  createDocumentModal.open({
    onClose: () => createDocumentModal.close(),
    onSave: async ({ name, file }: { name: string; file: File }) => {
      try {
        const formData = new FormData()
        formData.append('idContenedor', contenedorId)
        formData.append('file', file)
        formData.append('folder_name', name)
        await withSpinner(async () => {
          const result = await createNewFolder(formData)
          if (result.success) {
            showSuccess('Éxito', 'Folder creado correctamente')
            await getFolders(contenedorId)
            createDocumentModal.close()
          } else {
            showError('Error', result.error || 'Error al crear el folder')
          }
        }, 'Creando folder...')
      } catch (err: any) {
        showError('Error', err.message || 'Error al crear el folder')
      }
    },
  })
}

const handleDownloadFactura = async () => {
  if (!contenedorId) {
    showError('Error', 'ID de contenedor no válido')
    return
  }
  downloadingFactura.value = true
  try {
    await withSpinner(async () => {
      const response = await downloadFacturaComercial(contenedorId)
      if (response.success) {
        showSuccess('Éxito', 'Factura comercial descargada correctamente')
      } else {
        showError('Error', 'Error al descargar la factura comercial')
      }
    }, 'Descargando factura comercial...')
  } catch (err: any) {
    showError('Error', err.message || 'Error al descargar la factura comercial')
  } finally {
    downloadingFactura.value = false
  }
}

const goBack = () => {
  navigateTo(pasosUrl.value)
}

onMounted(() => {
  if (contenedorId) {
    getFolders(contenedorId)
  }
})
</script>
