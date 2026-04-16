<template>
  <div class="md:p-6">
    <PageHeader
      :title="title"
      :subtitle="subtitle"
      :hide-back-button="false"
      @back="navigateTo(returnUrl)"
    >
      <template #actions>
        <UButton
          v-if="showTopSaveButton && isCoordinacion && showDocumentacionPeru && !readOnly"
          label="Guardar cambios"
          color="primary"
          variant="solid"
          icon="i-heroicons-arrow-down-tray"
          size="sm"
          @click="handleSaveChanges"
        />
      </template>
    </PageHeader>

    <div v-if="loading" class="mt-6">
      <UCard>
        <div class="space-y-3">
          <div class="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div class="h-4 w-72 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </UCard>
    </div>

    <div v-else-if="error" class="mt-6">
      <UCard class="bg-red-50 border-red-200">
        <div class="flex items-center gap-2 text-red-800">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </UCard>
    </div>

    <div v-else-if="hasData" class="md:mt-6">
      <div class="md:mb-6 mb-3 border-gray-200 rounded-lg p-3 md:p-6 border-b-2 border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="group inline-flex items-center">
              <span class="font-semibold">{{ cliente?.nombre }}</span>
              <button
                v-if="cliente && showClipboardButtons"
                @click="copyName"
                class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-600"
                aria-label="Copiar nombre"
                title="Copiar nombre"
              >
                <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
              <span v-if="copied" class="ml-2 text-sm text-green-400">Copiado</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasProveedores" class="md:mb-6 mb-3">
        <div :class="tabs.length >= 5 ? '-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto whitespace-nowrap' : ''">
          <UTabs
            v-model="activeTab"
            :items="tabs"
            size="md"
            variant="pill"
            :class="[{ 'md:w-200': tabs.length >= 3, 'md:w-50': tabs.length < 3, 'md:w-300': tabs.length >= 5 }, 'inline-flex']"
            color="neutral"
            @update:model-value="handleTabChange"
          >
            <template #default="{ item, index }">
              <div class="inline-flex items-center group">
                <span>{{ item.label }}</span>
                <button
                  v-if="showClipboardButtons"
                  @click.prevent="copyTab(item, index)"
                  class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-600"
                  title="Copiar proveedor"
                >
                  <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4" />
                </button>
                <span v-if="copiedTabIndex === index" class="ml-2 text-sm text-green-400">Copiado</span>
              </div>
            </template>
          </UTabs>
        </div>
      </div>

      <div v-if="proveedorActivo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UCard
          v-if="showDocumentacionPeru"
          class="bg-white dark:bg-gray-800 md:p-6 rounded-lg shadow-md"
          :class="{ 'col-span-2': currentRole === ROLES.COORDINACION }"
        >
          <template #header>
            <div class="flex items-center justify-between flex-col md:flex-row gap-2 md:gap-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" v-if="currentRole !== ROLES.DOCUMENTACION && currentRole !== ROLES.JEFE_IMPORTACIONES" />
                <h3 class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">
                  {{ peruvianTitle }} - {{ proveedorActivo?.products }}
                </h3>
                <img
                  v-if="currentRole === ROLES.DOCUMENTACION || currentRole === ROLES.JEFE_IMPORTACIONES"
                  :src="CUSTOMIZED_ICONS_URL['PERU']"
                  alt="Flag"
                  class="w-5 h-5"
                />
                <UBadge v-if="hasUnsavedChanges && !readOnly" color="warning" variant="subtle" size="sm">
                  Cambios sin guardar
                </UBadge>
              </div>
              <div class="flex gap-2">
                <UButton
                  label="Nuevo Documento"
                  color="warning"
                  variant="solid"
                  icon="i-heroicons-plus"
                  size="sm"
                  v-if="currentRole === ROLES.COORDINACION && !readOnly"
                  @click="handleNuevoDocumento"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Volumen documento</label>
                <UInput
                  v-model="proveedorActivo.volumen_doc"
                  type="number"
                  placeholder="0"
                  class="w-full"
                  @update:model-value="handleVolumenChange"
                  :disabled="!isCoordinacion || readOnly"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor documento</label>
                <UInput
                  v-model="proveedorActivo.valor_doc"
                  type="number"
                  placeholder="$ 0"
                  class="w-full"
                  @update:model-value="handleValorChange"
                  :disabled="!isCoordinacion || readOnly"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factura Comercial</label>
              <FileUploader
                :accepted-types="acceptedTypes"
                :immediate="false"
                :disabled="!isCoordinacion || readOnly"
                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                :show-remove-button="currentRole === ROLES.COORDINACION && !readOnly"
                :initial-files="proveedorActivo.factura_comercial ? [{
                  id: proveedorActivo.id,
                  file_name: 'Factura Comercial',
                  file_url: proveedorActivo.factura_comercial,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  size: 0,
                  lastModified: 0,
                  file_ext: 'xlsx'
                }] : []"
                @files-selected="handleFacturaComercial"
                @file-removed="handleRemoveFacturaComercial"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Packing List</label>
              <FileUploader
                :accepted-types="acceptedTypes"
                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                :immediate="false"
                :disabled="!isCoordinacion || readOnly"
                :show-remove-button="currentRole === ROLES.COORDINACION && !readOnly"
                :initial-files="proveedorActivo.packing_list ? [{
                  id: proveedorActivo.id,
                  file_name: 'Packing List',
                  file_url: proveedorActivo.packing_list,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  size: 0,
                  lastModified: 0,
                  file_ext: 'xlsx'
                }] : []"
                @files-selected="handlePackingList"
                @file-removed="handleRemovePackingList"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Excel Confirmación</label>
              <FileUploader
                :accepted-types="acceptedTypes"
                :immediate="false"
                :disabled="!isCoordinacion || readOnly"
                :show-remove-button="currentRole === ROLES.COORDINACION && !readOnly"
                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                :initial-files="proveedorActivo.excel_confirmacion ? [{
                  id: proveedorActivo.id,
                  file_name: 'Excel Confirmación',
                  file_url: proveedorActivo.excel_confirmacion,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  size: 0,
                  lastModified: 0,
                  file_ext: 'xlsx'
                }] : []"
                @files-selected="handleExcelConfirmacion"
                @file-removed="handleRemoveExcelConfirmacion"
              />
            </div>

            <div v-for="file in files.filter(f => f.id_proveedor === proveedorActivo.id)" :key="file.id">
              <span>{{ file.folder_name || file.file_name }}</span>
              <FileUploader
                :accepted-types="acceptedTypes"
                :immediate="false"
                :show-remove-button="currentRole === ROLES.COORDINACION && !readOnly"
                :initial-files="[{
                  id: file.id,
                  file_name: file.folder_name || file.file_name,
                  file_url: file.file_url,
                  type: file.file_ext,
                  size: 0,
                  lastModified: 0,
                  file_ext: file.file_ext
                }]"
                @file-removed="handleRemoveFile(proveedorActivo.id, file.id)"
              />
            </div>
          </div>
        </UCard>

        <UCard
          class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
          v-if="showDocumentacionChina && canViewChinaInspection"
        >
          <template #header>
            <div class="flex items-center justify-between flex-col md:flex-row gap-2 md:gap-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                <h3 class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">{{ chinaTitle }}</h3>
                <img
                  v-if="currentRole === ROLES.DOCUMENTACION || currentRole === ROLES.JEFE_IMPORTACIONES"
                  :src="CUSTOMIZED_ICONS_URL['CHINA']"
                  alt="Flag"
                  class="w-5 h-5"
                />
                <UBadge v-if="hasUnsavedChanges && !readOnly" color="warning" variant="subtle" size="sm">Cambios sin guardar</UBadge>
              </div>
              <div class="flex gap-2">
                <UButton
                  v-if="hasUnsavedChanges && !readOnly"
                  label="Guardar cambios"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-check"
                  size="sm"
                  @click="handleSaveChanges"
                />
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <div v-for="file in filesAlmacenDocumentacion.filter(f => f.id_proveedor === proveedorActivo.id)" :key="file.id">
              <FileUploader
                :accepted-types="acceptedTypes"
                :immediate="false"
                :show-remove-button="false"
                :initial-files="[{
                  id: file.id,
                  file_name: file.file_name,
                  file_url: file.file_url,
                  type: file.file_ext,
                  size: 0,
                  lastModified: 0,
                  file_ext: file.file_ext
                }]"
              />
            </div>
          </div>
        </UCard>

        <UCard
          class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
          v-if="showInspeccion && canViewChinaInspection"
        >
          <template #header>
            <div class="flex items-center justify-between flex-col md:flex-row gap-2 md:gap-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-folder" class="w-5 h-5 text-gray-500" />
                <h3 class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">{{ inspeccionTitle }}</h3>
                <UBadge v-if="hasUnsavedChanges && !readOnly" color="warning" variant="subtle" size="sm">Cambios sin guardar</UBadge>
              </div>
              <div class="flex gap-2">
                <UButton
                  v-if="hasUnsavedChanges && !readOnly"
                  label="Guardar cambios"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-check"
                  size="sm"
                  @click="handleSaveChanges"
                />
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <div v-for="file in filesAlmacenInspection.filter(f => f.id_proveedor === proveedorActivo.id)" :key="file.id">
              <FileUploader
                :accepted-types="acceptedTypes"
                :immediate="false"
                :show-remove-button="false"
                :initial-files="[{
                  id: file.id,
                  file_name: file.file_name,
                  file_url: file.file_url,
                  type: file.file_ext,
                  size: 0,
                  lastModified: 0,
                  file_ext: file.file_ext
                }]"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useVariacionCliente } from '~/composables/cargaconsolidada/useVariacionCliente'
import FileUploader from '~/components/commons/FileUploader.vue'
import { ROLES } from '~/constants/roles'
import { CUSTOMIZED_ICONS_URL } from '~/constants/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
import SimpleUploadFile from '~/components/commons/SimpleUploadFile.vue'

const props = withDefaults(defineProps<{
  clienteId: number
  returnUrl: string
  title?: string
  subtitle?: string
  showDocumentacionPeru?: boolean
  showDocumentacionChina?: boolean
  showInspeccion?: boolean
  showTopSaveButton?: boolean
  showClipboardButtons?: boolean
  readOnly?: boolean
  forceShowChinaInspection?: boolean
  peruvianTitle?: string
  chinaTitle?: string
  inspeccionTitle?: string
}>(), {
  title: '',
  subtitle: '',
  showDocumentacionPeru: true,
  showDocumentacionChina: true,
  showInspeccion: true,
  showTopSaveButton: true,
  showClipboardButtons: true,
  readOnly: false,
  forceShowChinaInspection: false,
  peruvianTitle: 'Documentación Perú',
  chinaTitle: 'Documentación China',
  inspeccionTitle: 'Inspección'
})

const { currentRole, isCoordinacion } = useUserRole()
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const {
  cliente,
  loading,
  error,
  activeTab,
  tabs,
  proveedores,
  proveedorActivo,
  hasData,
  hasProveedores,
  filesAlmacenDocumentacion,
  filesAlmacenInspection,
  files,
  getClienteDocumentacion,
  cambiarProveedor,
  updateProveedorDocumentacion,
  deleteArchivo,
  deleteFacturaComercial,
  deletePackingList,
  deleteExcelConfirmacion,
  createProveedorDocumentacion
} = useVariacionCliente()

const acceptedTypes = ['.xlsx', '.xls', '.xlsm', '.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']
const copied = ref(false)
const copiedTabIndex = ref<number | null>(null)

const pendingChanges = ref({
  volumen_doc: null as number | null,
  valor_doc: null as number | null,
  factura_comercial: null as File | null,
  packing_list: null as File | null,
  excel_confirmacion: null as File | null
})

const hasUnsavedChanges = computed(() =>
  pendingChanges.value.volumen_doc !== null ||
  pendingChanges.value.valor_doc !== null ||
  pendingChanges.value.factura_comercial !== null ||
  pendingChanges.value.packing_list !== null ||
  pendingChanges.value.excel_confirmacion !== null
)

const canViewChinaInspection = computed(() => {
  if (props.forceShowChinaInspection || props.readOnly) return true
  return currentRole.value === ROLES.DOCUMENTACION || currentRole.value === ROLES.JEFE_IMPORTACIONES
})

const overlay = useOverlay()
const simpleUploadFile = overlay.create(SimpleUploadFile)

const copyName = async () => {
  try {
    const name = cliente?.value?.nombre ?? ''
    if (!name) return
    await navigator.clipboard.writeText(name)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // no-op
  }
}

const copyTab = async (item: any, index: number) => {
  try {
    const text = item?.label ?? item?.value ?? ''
    if (!text) return
    await navigator.clipboard.writeText(text)
    copiedTabIndex.value = index
    setTimeout(() => (copiedTabIndex.value = null), 2000)
  } catch {
    // no-op
  }
}

const handleTabChange = async (tabId: string) => {
  await cambiarProveedor(tabId)
}

const handleVolumenChange = (value: number) => {
  pendingChanges.value.volumen_doc = value
}

const handleValorChange = (value: number) => {
  pendingChanges.value.valor_doc = value
}

const handleFacturaComercial = (fileList: File[]) => {
  if (fileList.length > 0) pendingChanges.value.factura_comercial = fileList[0]
}

const handlePackingList = (fileList: File[]) => {
  if (fileList.length > 0) pendingChanges.value.packing_list = fileList[0]
}

const handleExcelConfirmacion = (fileList: File[]) => {
  if (fileList.length > 0) pendingChanges.value.excel_confirmacion = fileList[0]
}

const handleRemoveFacturaComercial = (idProveedor: number) => {
  if (props.readOnly) return
  pendingChanges.value.factura_comercial = null
  showConfirmation('Confirmar eliminación', '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.', async () => {
    await withSpinner(async () => {
      const result = await deleteFacturaComercial(idProveedor)
      if (result.success) {
        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
        await getClienteDocumentacion(props.clienteId)
      }
    }, 'Eliminando archivo...')
  })
}

const handleRemovePackingList = (idProveedor: number) => {
  if (props.readOnly) return
  pendingChanges.value.packing_list = null
  showConfirmation('Confirmar eliminación', '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.', async () => {
    await withSpinner(async () => {
      const result = await deletePackingList(idProveedor)
      if (result.success) {
        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
        await getClienteDocumentacion(props.clienteId)
      }
    }, 'Eliminando archivo...')
  })
}

const handleRemoveExcelConfirmacion = (idProveedor: number) => {
  if (props.readOnly) return
  pendingChanges.value.excel_confirmacion = null
  showConfirmation('Confirmar eliminación', '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.', async () => {
    await withSpinner(async () => {
      const result = await deleteExcelConfirmacion(idProveedor)
      if (result.success) {
        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
        await getClienteDocumentacion(props.clienteId)
      }
    }, 'Eliminando archivo...')
  })
}

const handleRemoveFile = (idProveedor: number, idFile: number) => {
  if (props.readOnly) return
  showConfirmation('Confirmar eliminación', '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.', async () => {
    await withSpinner(async () => {
      const result = await deleteArchivo(idProveedor, idFile)
      if (result.success) {
        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
        await getClienteDocumentacion(props.clienteId)
      }
    }, 'Eliminando archivo...')
  })
}

const handleSaveChanges = async () => {
  if (props.readOnly || !proveedorActivo.value || !hasUnsavedChanges.value) return
  try {
    await withSpinner(async () => {
      const formData = new FormData()
      if (pendingChanges.value.volumen_doc !== null) formData.append('volumen_doc', pendingChanges.value.volumen_doc.toString())
      if (pendingChanges.value.valor_doc !== null) formData.append('valor_doc', pendingChanges.value.valor_doc.toString())
      if (pendingChanges.value.factura_comercial) formData.append('file_comercial', pendingChanges.value.factura_comercial)
      if (pendingChanges.value.packing_list) formData.append('packing_list', pendingChanges.value.packing_list)
      if (pendingChanges.value.excel_confirmacion) formData.append('excel_confirmacion', pendingChanges.value.excel_confirmacion)

      formData.append('id', props.clienteId.toString())
      formData.append('idProveedor', proveedorActivo.value.id.toString())

      const result = await updateProveedorDocumentacion(proveedorActivo.value.id, formData)
      if (!result.success) throw new Error(result.error || 'Error al guardar los cambios')

      pendingChanges.value = {
        volumen_doc: null,
        valor_doc: null,
        factura_comercial: null,
        packing_list: null,
        excel_confirmacion: null
      }
      await getClienteDocumentacion(props.clienteId)
      showSuccess('Éxito', 'Todos los cambios se han guardado correctamente')
    }, 'Guardando cambios...')
  } catch (error: any) {
    showError('Error', error.message || 'Error al guardar los cambios')
  }
}

const handleNuevoDocumento = () => {
  if (props.readOnly || !proveedorActivo.value) return
  simpleUploadFile.open({
    title: 'Nuevo Documento',
    withNameField: true,
    onSave: (data: { file: File, name?: string | null }) => {
      const formData = new FormData()
      formData.append('name', data.name || '')
      formData.append('file', data.file)
      formData.append('id_cotizacion', props.clienteId.toString())
      formData.append('id_proveedor', proveedorActivo.value!.id.toString())
      withSpinner(async () => {
        const result = await createProveedorDocumentacion(formData)
        if (result.success) {
          showSuccess('Éxito', 'Documento subido correctamente')
          await getClienteDocumentacion(props.clienteId)
        } else {
          showError('Error', 'Error al subir el documento')
        }
      }, 'Subiendo documento...')
    }
  })
}

onMounted(async () => {
  if (!props.clienteId) return
  await getClienteDocumentacion(props.clienteId)
  if (proveedores.value && proveedores.value.length > 0) {
    const firstSupplier = proveedores.value[0]
    activeTab.value = firstSupplier.code_supplier
    await cambiarProveedor(firstSupplier.code_supplier)
  }
})
</script>
