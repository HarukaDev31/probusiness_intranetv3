<template>
  <div class="content px-4 py-3">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex justify-center items-center h-64">
      <ErrorState :message="error" @retry="cargarDatos" />
    </div>

    <!-- Main content -->
    <div v-else-if="documentacion">
      <!-- Header con botones de navegación -->
      <div class="row mb-2">
        <div class="col-12 col-md-2 col-xl-1">
          <UButton @click="goBack" variant="outline" class="inline-flex items-center gap-3 px-3.5 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 hover:bg-gray-50 ring-0 focus:outline-none focus:ring-2 focus:ring-primary-200">
            <UIcon name="i-heroicons-arrow-left" class="mr-2" />
            Regresar
          </UButton>
        </div>
        <div class="col-xl-9 col-md-8"></div>
        <div v-if="edit" class="col-12 col-md-2">
          <UButton @click="guardarDocumentacion" class="btn-block btn-reporte bg-orange">
            <UIcon name="i-heroicons-document-arrow-down" class="mr-2" />
            Guardar
          </UButton>
        </div>
      </div>

      <!-- Información del cliente -->
      <div class="name_cliente col-12 p-6" style="border-bottom: #DFDFDF solid 2px;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white">{{ documentacion.nombre }}</h2>

          </div>

        </div>
      </div>

      <!-- Tabs de servicios dinámicos -->
      <div v-if="documentacion.providers.length > 0" class="documentos-clientes-tabs pt-6">
        <div v-for="provider in documentacion.providers" :key="provider.id" class="tab-cliente-documentacion tab"
          :class="{ active: servicioActivo === provider.id }" @click="cambiarServicio(provider.id)">
          {{ provider.code_supplier }}
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="container documentos-clientes-content mx-auto px-4 py-8 w-full flex justify-content-center">
        <div class="flex gap-8">
          <!-- Sección de Documentación -->
          <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" style="width:60%">
            <template #header>
              <div class="flex items-center gap-2 mb-6 justify-between">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg dark:text-white">Documentación</h2>
                  <UIcon name="i-heroicons-folder-open" />
                </div>
                <UButton v-if="edit" @click="crearNuevoDocumento" size="sm"
                  class="btn-crear-documentacion-cliente bg-orange" :data-id="servicioActivo">
                  Nuevo Documento
                </UButton>
              </div>
            </template>

            <form @submit.prevent="guardarDocumentacion" class="space-y-4">
              <!-- Campos de volumen y valor -->
              <div class="flex justify-between align-items-center gap-4">
                <div class="flex align-items-center justify-flex-start gap-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Volumen
                    documento</label>
                  <UInput v-model="documentoProveedor.volumen" type="number" :min="0" step="any" class="w-25"
                    :disabled="!edit"
                    @update:model-value="(valor) => servicioActivo && validarVolumen(servicioActivo, valor)" />
                </div>
                <div class="flex align-items-center justify-flex-start gap-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 w-full">Valor
                    documento</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 dark:text-gray-300">$</span>
                    <UInput v-model="documentoProveedor.valor" type="number" :min="0" step="any" class="w-75 pl-7 pr-3"
                      :disabled="!edit"
                      @update:model-value="(valor) => servicioActivo && validarValor(servicioActivo, valor)" />
                  </div>
                </div>
              </div>

              <!-- Documentos específicos -->
              <div class="space-y-4" id="documentos-clientes-documentacion">
                <!-- Factura Comercial -->
                <div class="documento-item">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Factura
                    Comercial</label>

                  <!-- Archivos existentes del proveedor -->
                  <div v-if="proveedorActivo?.factura_comercial" class="mb-4">
                    <div class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon name="vscode-icons:file-type-excel" class="w-10 h-10 mr-2 mt-2" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">Factura Comercial del Proveedor</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Documento cargado</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(proveedorActivo.factura_comercial)" color="primary"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="borrarDocumentoProveedor('factura_comercial')" color="error"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Archivos existentes del sistema -->
                  <div v-if="archivosPorTipo.factura && archivosPorTipo.factura.length > 0" class="mb-4">
                    <div v-for="archivo in archivosPorTipo.factura" :key="archivo.id" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivo.nombre)" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">{{ archivo.nombre }}</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{{ formatFileSize(archivo.tamaño) }}</span>
                            <span>{{ formatDate(archivo.fecha_subida) }}</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(archivo.url)" color="primary" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="eliminarArchivo(archivo.id)" color="error" variant="ghost"
                            size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Subir nuevo archivo - solo si no hay archivos y es editable -->
                  <div
                    v-if="edit && !proveedorActivo?.factura_comercial && (!archivosPorTipo.factura || archivosPorTipo.factura.length === 0)"
                    class="file-upload-box" @click="triggerFileInput('factura')">
                    <input ref="facturaInput" type="file" class="file-input"
                      accept=".xlsx, .xls, .xlsm, .csv, .xlsb, .xltx, .xlt, .png, .jpg, .jpeg,.pdf"
                      @change="handleFileSelect('factura', $event)" />
                    <div class="file-label d-flex">
                      <UIcon name="i-heroicons-cloud-arrow-up" class="text-2xl" />
                      <div class="file-group-text">
                        <span class="file-text">Selecciona o arrastra tu archivo aquí</span>
                        <span class="file-format">Formatos: .xlsx, .png, .jpg, .jpeg</span>
                      </div>
                      <UButton class="upload-button" size="sm">
                        Subir archivo
                      </UButton>
                    </div>

                    <!-- Información del archivo seleccionado -->
                    <div v-if="archivosSeleccionados.factura" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivosSeleccionados.factura.name)" />
                        </div>
                        <span class="file-name">{{ archivosSeleccionados.factura.name }}</span>
                        <span class="file-size">{{ formatFileSize(archivosSeleccionados.factura.size) }}</span>
                        <UButton @click="removeFile('factura')" color="error" variant="ghost" size="xs">
                          <UIcon name="i-heroicons-trash" />
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Packing List -->
                <div class="documento-item">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Packing List</label>

                  <!-- Archivos existentes del proveedor -->
                  <div v-if="proveedorActivo?.packing_list" class="mb-4">
                    <div class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon name="vscode-icons:file-type-excel" class="w-10 h-10 mr-2 mt-2" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">Packing List del Proveedor</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Documento cargado</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(proveedorActivo.packing_list)" color="primary"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="borrarDocumentoProveedor('packing_list')" color="error"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Archivos existentes del sistema -->
                  <div v-if="archivosPorTipo.packing && archivosPorTipo.packing.length > 0" class="mb-4">
                    <div v-for="archivo in archivosPorTipo.packing" :key="archivo.id" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivo.nombre)" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">{{ archivo.nombre }}</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{{ formatFileSize(archivo.tamaño) }}</span>
                            <span>{{ formatDate(archivo.fecha_subida) }}</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(archivo.url)" color="primary" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="eliminarArchivo(archivo.id)" color="error" variant="ghost"
                            size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Subir nuevo archivo - solo si no hay archivos y es editable -->
                  <div
                    v-if="edit && !proveedorActivo?.packing_list && (!archivosPorTipo.packing || archivosPorTipo.packing.length === 0)"
                    class="file-upload-box" @click="triggerFileInput('packing')">
                    <input ref="packingInput" type="file" class="file-input"
                      accept=".xlsx, .xls, .xlsm, .csv, .xlsb, .xltx, .xlt, .png, .jpg, .jpeg,.pdf"
                      @change="handleFileSelect('packing', $event)" />
                    <div class="file-label d-flex">
                      <UIcon name="i-heroicons-cloud-arrow-up" class="text-2xl" />
                      <div class="file-group-text">
                        <span class="file-text">Selecciona o arrastra tu archivo aquí</span>
                        <span class="file-format">Formatos: .xlsx, .png, .jpg, .jpeg</span>
                      </div>
                      <UButton class="upload-button" size="sm">
                        Subir archivo
                      </UButton>
                    </div>

                    <!-- Información del archivo seleccionado -->
                    <div v-if="archivosSeleccionados.packing" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivosSeleccionados.packing.name)" />
                        </div>
                        <span class="file-name">{{ archivosSeleccionados.packing.name }}</span>
                        <span class="file-size">{{ formatFileSize(archivosSeleccionados.packing.size) }}</span>
                        <UButton @click="removeFile('packing')" color="error" variant="ghost" size="xs">
                          <UIcon name="i-heroicons-trash" />
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Excel Confirmación -->
                <div class="documento-item">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Excel
                    Confirmación</label>

                  <!-- Archivos existentes del proveedor -->
                  <div v-if="proveedorActivo?.excel_confirmacion" class="mb-4">
                    <div class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon name="vscode-icons:file-type-excel" class="w-10 h-10 mr-2 mt-2" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">Excel Confirmación del Proveedor</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Documento cargado</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(proveedorActivo.excel_confirmacion)" color="primary"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="borrarDocumentoProveedor('excel_confirmacion')" color="error"
                            variant="ghost" size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Archivos existentes del sistema -->
                  <div v-if="archivosPorTipo.confirmacion && archivosPorTipo.confirmacion.length > 0" class="mb-4">
                    <div v-for="archivo in archivosPorTipo.confirmacion" :key="archivo.id" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivo.nombre)" />
                        </div>
                        <div class="flex-1">
                          <span class="file-name">{{ archivo.nombre }}</span>
                          <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{{ formatFileSize(archivo.tamaño) }}</span>
                            <span>{{ formatDate(archivo.fecha_subida) }}</span>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <UButton @click="descargarArchivo(archivo.url)" color="primary" variant="ghost" size="xs">
                            <UIcon name="i-heroicons-arrow-down-tray" />
                          </UButton>
                          <UButton v-if="edit" @click="eliminarArchivo(archivo.id)" color="error" variant="ghost"
                            size="xs">
                            <UIcon name="i-heroicons-trash" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Subir nuevo archivo - solo si no hay archivos y es editable -->
                  <div
                    v-if="edit && !proveedorActivo?.excel_confirmacion && (!archivosPorTipo.confirmacion || archivosPorTipo.confirmacion.length === 0)"
                    class="file-upload-box" @click="triggerFileInput('confirmacion')">
                    <input ref="confirmacionInput" type="file" class="file-input"
                      accept=".xlsx, .xls, .xlsm, .csv, .xlsb, .xltx, .xlt, .png, .jpg, .jpeg,.pdf"
                      @change="handleFileSelect('confirmacion', $event)" />
                    <div class="file-label d-flex">
                      <UIcon name="i-heroicons-cloud-arrow-up" class="text-2xl" />
                      <div class="file-group-text">
                        <span class="file-text">Selecciona o arrastra tu archivo aquí</span>
                        <span class="file-format">Formatos: .xlsx, .png, .jpg, .jpeg</span>
                      </div>
                      <UButton class="upload-button" size="sm">
                        Subir archivo
                      </UButton>
                    </div>

                    <!-- Información del archivo seleccionado -->
                    <div v-if="archivosSeleccionados.confirmacion" class="file-info-box">
                      <div class="file-info">
                        <div class="file-iconic">
                          <UIcon :name="getFileIcon(archivosSeleccionados.confirmacion.name)" />
                        </div>
                        <span class="file-name">{{ archivosSeleccionados.confirmacion.name }}</span>
                        <span class="file-size">{{ formatFileSize(archivosSeleccionados.confirmacion.size) }}</span>
                        <UButton @click="removeFile('confirmacion')" color="error" variant="ghost" size="xs">
                          <UIcon name="i-heroicons-trash" />
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </UCard>

          <!-- Sección de Cotizaciones -->
          <UCard class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" style="height: 40%;min-height: 300px;">
            <template #header>
              <div class="flex items-center gap-2 mb-6">
                <h2 class="text-lg dark:text-white">Cotizaciones</h2>
                <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
              </div>
            </template>

            <div class="space-y-4">
              <UButton
                class="w-full flex items-center justify-between px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                variant="ghost" @click="descargarCotizacion('inicial')" :disabled="!documentacion?.cotizacion_file_url">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5" />
                  Descargar cotización inicial
                </span>
              </UButton>

              <UButton
                class="w-full flex items-center justify-between px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                variant="ghost" @click="descargarCotizacion('final')" :disabled="!documentacion?.cotizacion_final_url">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5" />
                  Descargar cotización final
                </span>
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useClienteDocumentacion } from '../composables/useClienteDocumentacion'
import { useModal } from '../composables/commons/useModal'
import { useSpinner } from '../composables/commons/useSpinner'
// Props
interface Props {
  clienteId: string
  edit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  edit: false
})

// Composable
const {
  documentacion,
  loading,
  error,
  archivosSeleccionados,
  documentosPorProveedor,
  archivosPorTipo,
  tieneArchivos,
  proveedores,
  cargarDocumentacion,
  subirDocumento,
  eliminarDocumento,
  actualizarDocumentacion,
  actualizarDocumentacionProveedor,
  limpiarArchivosSeleccionados,
  getDocumentoProveedor,
  updateDocumentoProveedor,
  validarVolumen,
  validarValor
} = useClienteDocumentacion()
const { withSpinner } = useSpinner()
const servicioActivo = ref<number | null>(null)

// Computed para el proveedor activo
const proveedorActivo = computed(() => {
  if (!documentacion.value || !servicioActivo.value) return null
  return documentacion.value.providers.find(p => p.id === servicioActivo.value) || null
})

// Computed para los datos del documento del proveedor activo
const documentoProveedor = computed(() => {
  if (!servicioActivo.value) return { volumen: 0, valor: 0 }
  return getDocumentoProveedor(servicioActivo.value)
})

// File input refs
const facturaInput = ref<HTMLInputElement>()
const packingInput = ref<HTMLInputElement>()
const confirmacionInput = ref<HTMLInputElement>()

// Methods
const goBack = () => {
  window.history.back()
}

const cargarDatos = async () => {
  try {
    await cargarDocumentacion(props.clienteId)
    if (documentacion.value && documentacion.value.providers && documentacion.value.providers.length > 0) {
      servicioActivo.value = documentacion.value.providers[0].id
    }
  } catch (err) {
    showError(`Error al cargar datos ${err}`)
  }
}

const cambiarServicio = (id: number) => {
  servicioActivo.value = id
}

const crearNuevoDocumento = () => {
}

const guardarDocumentacion = async () => {
  if (!servicioActivo.value || !props.edit) return

  try {
    const datos = documentoProveedor.value
    await actualizarDocumentacionProveedor(props.clienteId, servicioActivo.value, datos)

    // Mostrar notificación de éxito
  } catch (err) {
    showError(`Error al guardar documentación ${err}`)

  }
}

const triggerFileInput = (type: string) => {
  if (!props.edit) return

  switch (type) {
    case 'factura':
      facturaInput.value?.click()
      break
    case 'packing':
      packingInput.value?.click()
      break
    case 'confirmacion':
      confirmacionInput.value?.click()
      break
  }
}

const handleFileSelect = async (type: string, event: Event) => {
  if (!props.edit) return

  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const archivo = target.files[0]
    archivosSeleccionados.value[type as keyof typeof archivosSeleccionados.value] = archivo

    try {
      // Subir archivo inmediatamente
      await subirDocumento(props.clienteId, type, archivo)

      // Limpiar archivo seleccionado después de subir
      archivosSeleccionados.value[type as keyof typeof archivosSeleccionados.value] = null

      // Resetear input
      target.value = ''
    } catch (err) {
      showError(`Error al subir archivo ${err}`)
    }
  }
}


const removeFile = (type: string) => {
  if (!props.edit) return

  archivosSeleccionados.value[type as keyof typeof archivosSeleccionados.value] = null
  // Resetear el input
  switch (type) {
    case 'factura':
      if (facturaInput.value) facturaInput.value.value = ''
      break
    case 'packing':
      if (packingInput.value) packingInput.value.value = ''
      break
    case 'confirmacion':
      if (confirmacionInput.value) confirmacionInput.value.value = ''
      break
  }
}

const eliminarArchivo = async (fileId: number) => {
  if (!props.edit) return

  try {
    await eliminarDocumento(props.clienteId, fileId)
  } catch (err) {
    showError(`Error al eliminar archivo ${err}`)
  }
}

const borrarDocumentoProveedor = async (campo: string) => {
  if (!proveedorActivo.value || !props.edit) return

  try {
    // Aquí deberías llamar al servicio para borrar el documento del proveedor

    // Por ahora solo recargamos los datos
    await cargarDatos()
  } catch (err) {
    showError(`Error al borrar documento del proveedor ${err}`)
  }
}

const descargarArchivo = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}

const descargarCotizacion = (tipo: string) => {
  let url = ''
  if (tipo === 'inicial' && documentacion.value?.cotizacion_file_url) {
    url = documentacion.value.cotizacion_file_url
  } else if (tipo === 'final' && documentacion.value?.cotizacion_final_url) {
    url = documentacion.value.cotizacion_final_url
  }

  if (url) {
    window.open(url, '_blank')
  }
}

const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'vscode-icons:file-type-pdf2'
    case 'xlsx':
    case 'xls':
    case 'xlsm':
    case 'csv':
    case 'xlsb':
    case 'xltx':
    case 'xlt':
      return 'vscode-icons:file-type-excel'
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'i-heroicons-photo'
    default:
      return 'i-heroicons-document'
  }
}
onMounted(async () => {
  await cargarDatos()
})

</script>
<style scoped>
/* Estilos específicos del componente */
.content {
  font-family: Epilogue;
}

.btn-block {
  font-size: 14px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.bg-orange {
  background-color: #FF500B !important;
  color: #fff !important;
}

.name_cliente {
  font-weight: 600;
  font-size: 1.2em;
  color: #272A30;
}

/* Dark mode styles for name_cliente */
.dark .name_cliente {
  color: #f9fafb;
}

.documentos-clientes-tabs {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1em;
  margin: 1em 2em;
}

.tab-cliente-documentacion {
  padding: 0.5em;
  border-radius: 0.5em;
  width: 100%;
  border-width: 2px;
  border-color: #CDCDCD;
  color: #7E7E7E;
  text-align: center;
  cursor: pointer;
  background-color: transparent;
  transition: background-color 0.5s ease;
}

/* Dark mode styles for tabs */
.dark .tab-cliente-documentacion {
  border-color: #4b5563;
  color: #9ca3af;
}

.tab-cliente-documentacion.active {
  background-color: #FFFFFF;
  color: black;
}

/* Dark mode styles for active tab */
.dark .tab-cliente-documentacion.active {
  background-color: #374151;
  color: white;
}

.tab-cliente-documentacion:hover {
  background-color: #FFFFFF;
  color: black;
}

/* Dark mode styles for tab hover */
.dark .tab-cliente-documentacion:hover {
  background-color: #374151;
  color: white;
}

.file-upload-box {
  border: 2px dashed #cccccc;
  padding: 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

/* Dark mode styles for file upload box */
.dark .file-upload-box {
  border-color: #6b7280;
}

.file-upload-box:hover {
  border-color: #cccccc;
}

/* Dark mode styles for file upload box hover */
.dark .file-upload-box:hover {
  border-color: #9ca3af;
}

.file-input {
  display: none;
}

.file-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.file-text {
  font-size: 1rem;
  color: #333333;
}

/* Dark mode styles for file text */
.dark .file-text {
  color: #f3f4f6;
}

.file-format {
  font-size: 0.9rem;
  color: #666666;
  margin-bottom: 1rem;
}

/* Dark mode styles for file format */
.dark .file-format {
  color: #9ca3af;
}

.upload-button {
  width: 60%;
  padding: 0.75rem .5rem;
  background-color: #F0F4F9;
  color: #272A30;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: .75rem;
  transition: background-color 0.3s ease;
}

/* Dark mode styles for upload button */
.dark .upload-button {
  background-color: #374151;
  color: #f9fafb;
}

.upload-button:hover {
  background-color: #F0F4F9;
}

/* Dark mode styles for upload button hover */
.dark .upload-button:hover {
  background-color: #4b5563;
}

.file-info-box {
  border: 1px solid #cccccc;
  padding: 1rem;
  border-radius: 10px;
  background-color: #f9f9f9;
  margin-top: 1rem;
  text-align: left;
}

/* Dark mode styles for file info box */
.dark .file-info-box {
  border-color: #4b5563;
  background-color: #1f2937;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.file-name {
  font-size: 1rem;
  color: #333333;
}

/* Dark mode styles for file name */
.dark .file-name {
  color: #f3f4f6;
}

.file-size {
  font-size: 0.9rem;
  color: #666666;
}

/* Dark mode styles for file size */
.dark .file-size {
  color: #9ca3af;
}

.documento-item {
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .file-upload-box {
    padding: 0;
    height: 200px;
  }

  .file-label {
    flex-direction: column;
    justify-content: center;
    gap: 0px;
    height: 100%;
    font-size: 11px;
  }

  .file-group-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .file-group-text>span {
    font-size: 12px;
  }

  .file-format {
    margin-bottom: 0;
  }
}
</style>