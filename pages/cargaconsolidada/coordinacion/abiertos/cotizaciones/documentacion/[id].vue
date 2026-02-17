<template>
  <div class="md:p-6">
    <PageHeader
      :hide-back-button="false"
      @back="navigateBack"
    />

    <!-- Skeleton de carga -->
    <div v-if="loading" class="mt-6 space-y-6">
      <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UCard class="p-6">
          <template #header>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
          </template>
          <div class="space-y-4">
            <div v-for="i in 4" :key="i" class="space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </UCard>
        <UCard class="p-6">
          <template #header>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          </template>
          <div class="space-y-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div v-for="i in 3" :key="i" class="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </UCard>
      </div>
    </div>

    <UCard v-else-if="error" class="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
        <span>{{ error }}</span>
      </div>
    </UCard>

    <div v-else-if="hasData" class="md:mt-6">
      <div v-if="!soloVista" class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <span class="font-semibold text-gray-900 dark:text-white">{{ cotizacion?.nombre ?? 'Cotización' }}</span>
        <UButton
          label="Guardar todo"
          color="primary"
          variant="solid"
          icon="i-heroicons-check"
          size="md"
          :disabled="!tienePendientes"
          :loading="savingAll"
          @click="handleGuardarTodo"
        />
      </div>
      <div v-else class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <span class="font-semibold text-gray-900 dark:text-white">{{ cotizacion?.nombre ?? 'Cotización' }}</span>
        <UBadge color="neutral" variant="soft" size="sm">Solo lectura — Ver y descargar</UBadge>
      </div>

      <!-- Tabs proveedores -->
      <div v-if="hasProveedores" class="mb-6">
        <UTabs
          v-model="activeTab"
          :items="tabs"
          size="md"
          variant="pill"
          color="neutral"
          @update:model-value="cambiarProveedor"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Documentación (independiente por proveedor como las imágenes) -->
        <UCard v-if="proveedorActivo" class="p-6 rounded-lg shadow-md">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Documentación — {{ proveedorActivo?.code_supplier }}
              </h3>
              <UButton
                v-if="!soloVista"
                label="Nuevo documento"
                color="warning"
                variant="solid"
                icon="i-heroicons-plus"
                size="sm"
                @click="handleNuevoDocumento"
              />
            </div>
          </template>
          <div class="space-y-4">
            <p v-if="!soloVista" class="text-sm text-gray-500 dark:text-gray-400">
              Los cambios se aplican al hacer clic en «Guardar todo». Cada pestaña de proveedor tiene su propia documentación pendiente.
            </p>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              Solo puedes ver y descargar los documentos. No se pueden editar ni eliminar.
            </p>
            <div v-for="tipo in tiposDocumentoDefault" :key="tipo.key">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ tipo.label }}
              </label>
              <FileUploader
                :key="'doc-' + (proveedorActivo?.id ?? 0) + '-' + tipo.key + '-' + imagenUploaderKey"
                :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']"
                :immediate="false"
                :custom-message="'Selecciona o arrastra tu archivo aquí'"
                :show-remove-button="!soloVista"
                :read-only="soloVista"
                :initial-files="getInitialFilesForTipo(tipo.key)"
                :model-files="soloVista ? [] : (pendingDocByTipoCurrent[tipo.key] ? [pendingDocByTipoCurrent[tipo.key].file] : [])"
                @files-selected="(files: File[]) => agregarPendienteDoc(tipo.key, files)"
                @file-removed="quitarPendienteDocPorTipo(tipo.key)"
              />
            </div>
            <div v-for="doc in documentosCustomFiltrados" :key="doc.id">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ doc.folder_name || doc.tipo_documento }}
              </label>
              <FileUploader
                :key="'doc-custom-' + doc.id + '-' + (proveedorActivo?.id ?? 0) + '-' + imagenUploaderKey"
                :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']"
                :immediate="false"
                :show-remove-button="!soloVista"
                :read-only="soloVista"
                :initial-files="[fileToItem(doc)]"
                @file-removed="marcarEliminarDoc(doc.id)"
              />
            </div>
            <div v-if="!soloVista && pendingDocCustomCurrent.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Documentos nuevos (pendientes de guardar)</label>
              <FileUploader
                :key="'doc-pending-' + (proveedorActivo?.id ?? 0) + '-' + imagenUploaderKey"
                :model-files="pendingDocCustomCurrent.map(p => p.file)"
                :multiple="true"
                :accepted-types="['.xlsx', '.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']"
                :immediate="false"
                :show-remove-button="true"
                :read-only="false"
                @file-removed="(idx: number) => quitarPendienteDocCustom(idx)"
              />
            </div>
          </div>
        </UCard>

        <!-- Por proveedor: Imágenes (múltiple; se guarda solo con «Guardar todo») -->
        <UCard v-if="proveedorActivo" class="p-6 rounded-lg shadow-md">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Imágenes — {{ proveedorActivo?.code_supplier }}
            </h3>
          </template>
          <div class="space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <template v-if="soloVista">Solo puedes ver y descargar las imágenes.</template>
              <template v-else>Hasta 4 archivos por proveedor. Puedes seleccionar varios a la vez. Los cambios de cada pestaña se conservan al cambiar de proveedor; «Guardar todo» guarda documentos e imágenes de todos los proveedores.</template>
            </p>
            <!-- Ya guardados (no marcados para eliminar) -->
            <div v-for="doc in docsPorProveedorVisibles" :key="doc.id" class="flex items-center gap-2 w-full">
              <FileUploader
                class="w-full"
                :accepted-types="['.png', '.jpg', '.jpeg', '.pdf']"
                :immediate="false"
                :show-remove-button="!soloVista"
                :read-only="soloVista"
                :initial-files="[proveedorDocToFileItem(doc)]"
                @file-removed="marcarEliminarProveedorDoc(doc.id)"
              />
            </div>
            <!-- Agregar / pendientes de guardar: solo si no es solo lectura -->
            <div v-if="!soloVista && (totalArchivosProveedor < 4 || pendingProveedorFilesList.length > 0)" class="w-full">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agregar imágenes (múltiple)</label>
              <FileUploader
                class="w-full"
                :key="'imagenes-' + (proveedorActivo?.id ?? 0) + '-' + imagenUploaderKey"
                :multiple="true"
                :accepted-types="['.png', '.jpg', '.jpeg', '.pdf']"
                :immediate="false"
                :custom-message="'Seleccionar uno o más archivos'"
                :show-remove-button="true"
                :model-files="pendingProveedorFilesList.map(x => x.file)"
                @files-selected="(files: File[]) => agregarPendienteProveedor(files)"
                @file-removed="(idx: number) => quitarPendienteProveedor(idx)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCotizadorDocumentacion } from '~/composables/cargaconsolidada/useCotizadorDocumentacion'
import type { DocItem } from '~/composables/cargaconsolidada/useCotizadorDocumentacion'
import FileUploader from '~/components/commons/FileUploader.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import SimpleUploadFile from '~/components/commons/SimpleUploadFile.vue'
import { useOverlay } from '#imports'
import { useUserRole } from '~/composables/auth/useUserRole'
const { isCoordinacion } = useUserRole()
const route = useRoute()
const idCotizacion = Number(route.params.id)
/** Modo solo lectura (coordinación): solo ver y descargar, sin editar/guardar/eliminar. */
const soloVista = computed(() => isCoordinacion.value)

const {
  cotizacion,
  loading,
  error,
  activeTab,
  tabs,
  proveedorActivo,
  hasData,
  hasProveedores,
  files,
  getDocumentacion,
  cambiarProveedor,
  docsPorProveedor,
  uploadDocumento,
  deleteDocumento,
  sync,
  uploadProveedorDocumento,
  deleteProveedorDocumento
} = useCotizadorDocumentacion()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const simpleUploadFile = overlay.create(SimpleUploadFile)

const savingAll = ref(false)
/** Fuerza remount de FileUploaders (documentos e imágenes) al cambiar de tab. */
const imagenUploaderKey = ref(0)

// —— Documentación por proveedor (independiente por tab como las imágenes) ——
const pendingDocByTipo = ref<Record<number, Record<string, { file: File }>>>({})
const pendingDocCustom = ref<Record<number, Array<{ tipo_documento: string; folder_name?: string; file: File }>>>({})
const pendingDocDeletes = ref<number[]>([])

/** Pendientes del proveedor activo (documentación). */
const pendingDocByTipoCurrent = computed(() => {
  const id = proveedorActivo.value?.id
  if (id == null) return {}
  return pendingDocByTipo.value[id] ?? {}
})

const pendingDocCustomCurrent = computed(() => {
  const id = proveedorActivo.value?.id
  if (id == null) return []
  return pendingDocCustom.value[id] ?? []
})

/** Documentos de la API que corresponden al proveedor activo (id_proveedor coincide o es null por compatibilidad). */
const filesForCurrentProveedor = computed(() => {
  const idProv = proveedorActivo.value?.id
  const list = files.value ?? []
  if (idProv == null) return list
  return list.filter((f: DocItem) => f.id_proveedor == null || f.id_proveedor === idProv)
})

// —— Imágenes por proveedor: pendientes y eliminaciones ——
const pendingProveedorFiles = ref<Record<number, File[]>>({})
const pendingProveedorDeletes = ref<number[]>([])

const pendingProveedorFilesList = computed(() => {
  if (!proveedorActivo.value) return []
  const list = pendingProveedorFiles.value[proveedorActivo.value.id] ?? []
  return list.map(f => ({ name: f.name, file: f }))
})

const docsPorProveedorVisibles = computed(() => {
  if (!proveedorActivo.value) return []
  return docsPorProveedor(proveedorActivo.value.id).filter((d: { id: number }) => !pendingProveedorDeletes.value.includes(d.id))
})

const totalArchivosProveedor = computed(() => {
  if (!proveedorActivo.value) return 0
  const guardados = docsPorProveedor(proveedorActivo.value.id).filter((d: { id: number }) => !pendingProveedorDeletes.value.includes(d.id)).length
  const pendientes = (pendingProveedorFiles.value[proveedorActivo.value.id] ?? []).length
  return guardados + pendientes
})

const tienePendientes = computed(() => {
  const docPendByProv = Object.values(pendingDocByTipo.value).some(m => Object.keys(m).length > 0)
  const docCustomPend = Object.values(pendingDocCustom.value).some(arr => arr.length > 0)
  const docPend = docPendByProv || docCustomPend || pendingDocDeletes.value.length > 0
  const imgPend = Object.values(pendingProveedorFiles.value).some(arr => arr.length > 0) || pendingProveedorDeletes.value.length > 0
  return docPend || imgPend
})

function getInitialFilesForTipo(tipo: string) {
  const existente = getFileForTipo(tipo)
  if (existente && pendingDocDeletes.value.includes(existente.id)) return []
  const current = pendingDocByTipoCurrent.value
  if (current[tipo]) return []
  return existente ? [fileToItem(existente)] : []
}

const documentosCustomFiltrados = computed(() => {
  const defKeys = tiposDocumentoDefault.map(t => t.key)
  const list = filesForCurrentProveedor.value.filter((f: DocItem) => !defKeys.includes(f.tipo_documento))
  return list.filter((d: DocItem) => !pendingDocDeletes.value.includes(d.id))
})

function agregarPendienteDoc(tipoDocumento: string, filesSelected: File[]) {
  if (!filesSelected.length || !proveedorActivo.value) return
  const idProv = proveedorActivo.value.id
  const byTipo = { ...(pendingDocByTipo.value[idProv] ?? {}), [tipoDocumento]: { file: filesSelected[0] } }
  pendingDocByTipo.value = { ...pendingDocByTipo.value, [idProv]: byTipo }
}

function quitarPendienteDocPorTipo(tipo: string) {
  if (!proveedorActivo.value) return
  const idProv = proveedorActivo.value.id
  const byTipo = pendingDocByTipo.value[idProv] ?? {}
  if (byTipo[tipo]) {
    const next = { ...byTipo }
    delete next[tipo]
    pendingDocByTipo.value = { ...pendingDocByTipo.value, [idProv]: Object.keys(next).length ? next : {} }
  } else {
    const existente = getFileForTipo(tipo)
    if (existente && !pendingDocDeletes.value.includes(existente.id)) {
      pendingDocDeletes.value = [...pendingDocDeletes.value, existente.id]
    }
  }
}

function marcarEliminarDoc(id: number) {
  if (!pendingDocDeletes.value.includes(id)) pendingDocDeletes.value = [...pendingDocDeletes.value, id]
}

function quitarPendienteDocCustom(idx: number) {
  if (!proveedorActivo.value) return
  const idProv = proveedorActivo.value.id
  const list = (pendingDocCustom.value[idProv] ?? []).filter((_, i) => i !== idx)
  pendingDocCustom.value = { ...pendingDocCustom.value, [idProv]: list }
}

function agregarPendienteProveedor(filesSelected: File[]) {
  if (!filesSelected.length || !proveedorActivo.value) return
  const idProv = proveedorActivo.value.id
  const guardados = docsPorProveedor(idProv).filter((d: { id: number }) => !pendingProveedorDeletes.value.includes(d.id)).length
  const actual = pendingProveedorFiles.value[idProv] ?? []
  const espacio = 4 - guardados - actual.length
  if (espacio <= 0) return
  const aAgregar = filesSelected.slice(0, espacio)
  const next = [...actual, ...aAgregar]
  pendingProveedorFiles.value = { ...pendingProveedorFiles.value, [idProv]: next }
}

function quitarPendienteProveedor(idx: number) {
  if (!proveedorActivo.value) return
  const idProv = proveedorActivo.value.id
  const actual = [...(pendingProveedorFiles.value[idProv] ?? [])]
  actual.splice(idx, 1)
  pendingProveedorFiles.value = { ...pendingProveedorFiles.value, [idProv]: actual }
}

function marcarEliminarProveedorDoc(id: number) {
  if (!pendingProveedorDeletes.value.includes(id)) pendingProveedorDeletes.value = [...pendingProveedorDeletes.value, id]
}

async function handleGuardarTodo() {
  if (!idCotizacion || !tienePendientes.value || soloVista.value) return
  savingAll.value = true
  try {
    await withSpinner(async () => {
      // IDs de BD a eliminar: documentos marcados para eliminar + los que se reemplazan por tipo (por proveedor)
      const docIdsToDelete = new Set<number>(pendingDocDeletes.value)
      const idsProvDoc = Object.keys(pendingDocByTipo.value).map(Number).sort((a, b) => a - b)
      for (const idProv of idsProvDoc) {
        const byTipo = pendingDocByTipo.value[idProv] ?? {}
        for (const tipo of Object.keys(byTipo)) {
          const existente = getFileForTipoAndProveedor(tipo, idProv)
          if (existente) docIdsToDelete.add(existente.id)
        }
      }
      const formData = new FormData()
      formData.append('id_cotizacion', String(idCotizacion))
      formData.append('document_ids_to_delete', JSON.stringify([...docIdsToDelete]))
      formData.append('proveedor_document_ids_to_delete', JSON.stringify([...pendingProveedorDeletes.value]))

      // Meta y archivos nuevos de documentación: recoger de todos los proveedores (por tipo + custom), cada uno con id_proveedor
      const documentMeta: { tipo_documento: string; folder_name?: string; id_proveedor: number }[] = []
      let idx = 0
      for (const idProv of idsProvDoc) {
        const byTipo = pendingDocByTipo.value[idProv] ?? {}
        for (const tipo of Object.keys(byTipo)) {
          documentMeta.push({ tipo_documento: tipo, id_proveedor: idProv })
          formData.append('document_file_' + idx, byTipo[tipo].file)
          idx++
        }
      }
      for (const idProv of idsProvDoc) {
        const list = pendingDocCustom.value[idProv] ?? []
        for (const p of list) {
          documentMeta.push({
            tipo_documento: p.tipo_documento,
            folder_name: p.folder_name ?? undefined,
            id_proveedor: idProv
          })
          formData.append('document_file_' + idx, p.file)
          idx++
        }
      }
      formData.append('document_meta', JSON.stringify(documentMeta))

      // Meta y archivos nuevos de imágenes por proveedor (todos los tabs; orden estable por id)
      const proveedorMeta: { id_proveedor: number }[] = []
      let pidx = 0
      const idsProveedores = Object.keys(pendingProveedorFiles.value).map(Number).sort((a, b) => a - b)
      for (const idProv of idsProveedores) {
        const list = pendingProveedorFiles.value[idProv] ?? []
        for (const file of list) {
          proveedorMeta.push({ id_proveedor: idProv })
          formData.append('proveedor_file_' + pidx, file)
          pidx++
        }
      }
      formData.append('proveedor_meta', JSON.stringify(proveedorMeta))

      const res = await sync(formData)
      if (!res?.success) {
        showError('Error', (res as any)?.message ?? 'Error al guardar')
        return
      }
      pendingDocByTipo.value = {}
      pendingDocCustom.value = []
      pendingDocDeletes.value = []
      pendingProveedorFiles.value = {}
      pendingProveedorDeletes.value = []
      await getDocumentacion(idCotizacion)
      showSuccess('Éxito', 'Cambios guardados correctamente')
    }, 'Guardando todo...')
  } catch (e: any) {
    showError('Error', e.message ?? 'Error al guardar')
  } finally {
    savingAll.value = false
  }
}

const tiposDocumentoDefault = [
  { key: 'proforma_invoice', label: 'Proforma Invoice' },
  { key: 'packing_list', label: 'Packing List' },
  { key: 'ficha_tecnica', label: 'Ficha Técnica' }
]

const documentosCustom = computed(() => {
  const defKeys = tiposDocumentoDefault.map(t => t.key)
  return (files.value ?? []).filter((f: DocItem) => !defKeys.includes(f.tipo_documento))
})

function getFileForTipo(tipo: string): DocItem | undefined {
  return filesForCurrentProveedor.value.find((f: DocItem) => f.tipo_documento === tipo)
}

/** Documento existente para un tipo y proveedor (para construir IDs a borrar al guardar). */
function getFileForTipoAndProveedor(tipo: string, idProveedor: number): DocItem | undefined {
  return (files.value ?? []).find(
    (f: DocItem) => f.tipo_documento === tipo && (f.id_proveedor == null ? false : f.id_proveedor === idProveedor)
  )
}

function fileToItem(doc: DocItem) {
  return {
    id: doc.id,
    file_name: doc.folder_name || doc.tipo_documento,
    file_url: doc.file_url,
    type: '',
    size: 0,
    lastModified: 0,
    file_ext: ''
  }
}

/** Convierte un doc de proveedor (orden, file_url) en FileItem con file_name que incluye extensión para que ModalPreview detecte imagen/PDF. */
function proveedorDocToFileItem(doc: { id: number; orden: number; file_url: string | null; id_proveedor: number }) {
  const ext = doc.file_url ? (doc.file_url.split('.').pop()?.split(/[#?]/)[0] ?? '') : ''
  const base = ext ? `Imagen ${doc.orden}.${ext}` : `Imagen ${doc.orden}`
  return {
    id: doc.id,
    file_name: base,
    file_url: doc.file_url,
    type: '',
    size: 0,
    lastModified: 0,
    file_ext: ext
  }
}

function navigateBack() {
  const idContenedor = cotizacion.value?.id_contenedor
  if (idContenedor) {
    navigateTo(`/cargaconsolidada/coordinacion/abiertos/cotizaciones/${idContenedor}`)
  } else {
    navigateTo('/cargaconsolidada/coordinacion/abiertos/cotizaciones')
  }
}

function handleNuevoDocumento() {
  if (!proveedorActivo.value || soloVista.value) return
  const idProv = proveedorActivo.value.id
  simpleUploadFile.open({
    title: 'Nuevo documento',
    withNameField: true,
    onSave: (data: { file: File; name?: string | null }) => {
      const tipo = (data.name || 'custom').replace(/\s+/g, '_').toLowerCase()
      const list = [...(pendingDocCustom.value[idProv] ?? []), { tipo_documento: tipo, folder_name: data.name ?? undefined, file: data.file }]
      pendingDocCustom.value = { ...pendingDocCustom.value, [idProv]: list }
    }
  })
}

// Al cambiar de tab de proveedor, forzar remount del uploader de imágenes para que no muestre la selección de otro tab
let prevProveedorId: number | undefined
watch(
  () => proveedorActivo.value?.id,
  (id) => {
    if (prevProveedorId !== undefined && prevProveedorId !== id) {
      imagenUploaderKey.value += 1
    }
    prevProveedorId = id
  }
)

onMounted(() => {
  if (idCotizacion) {
    getDocumentacion(idCotizacion)
  }
})
</script>
