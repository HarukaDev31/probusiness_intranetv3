<template>
  <UCard class="p-6 space-y-8">
    <!-- Header: volver, título, Guardar todo, Nueva categoría -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="navigateTo('/basedatos/permisos')"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Documentos del trámite
          </h1>
          <p v-if="tramiteInfo" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ tramiteInfo.entidad || '' }} {{ tramiteInfo.tipo_permiso ? `- ${tramiteInfo.tipo_permiso}` : '' }}
            {{ tramiteInfo.consolidado ? `| ${tramiteInfo.consolidado}` : '' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          label="Guardar"
          icon="i-heroicons-arrow-up-tray"
          color="primary"
          size="sm"
          :disabled="totalPendingCount === 0"
          :loading="uploading"
          @click="guardarTodo"
        />
        <UButton
          label="Nueva categoría"
          icon="i-heroicons-folder-plus"
          variant="soft"
          color="primary"
          size="sm"
          @click="openNuevaCategoriaModal"
        />
      </div>
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div v-for="i in 3" :key="i" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <USkeleton class="w-12 h-12 rounded-lg" />
            <USkeleton class="h-6 w-48" />
          </div>
          <USkeleton class="h-8 w-28 rounded-md" />
        </div>
        <div class="space-y-3">
          <div v-for="j in 2" :key="j">
            <USkeleton class="h-4 w-32 mb-2" />
            <USkeleton class="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <UButton label="Reintentar" variant="soft" color="red" size="sm" class="mt-2" @click="loadDocumentos(tramiteId)" />
    </div>

    <template v-else>
      <!-- Una sección (carpeta) por categoría; se envía id_categoria al guardar -->
      <DocumentSection
        v-for="categoria in categorias"
        :key="categoria.id"
        :title="categoria.nombre"
        :categoria="categoria.nombre"
        :id-categoria="categoria.id"
        :clear-trigger="clearTrigger"
        icon="i-heroicons-folder"
        icon-bg="bg-gray-100 dark:bg-gray-800"
        icon-color="text-gray-600 dark:text-gray-400"
        :documentos="getDocumentosByCategoria(categoria.nombre)"
        @upload-file="(payload) => handleUploadFile(categoria.nombre, payload.nombre_documento, payload.archivo, payload.id_categoria)"
        @update:pending="(e) => setPendingForCategoria(categoria.nombre, e.items)"
        @delete="handleDelete"
      />
    </template>

    <!-- Modal nueva categoría (solo escribir nombre) -->
    <NuevaCategoriaModal
      :open="showNuevaCategoriaModal"
      @close="showNuevaCategoriaModal = false"
      @create="handleCreateCategoria"
    />
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NuevaCategoriaModal from '~/components/basedatos/NuevaCategoriaModal.vue'
import DocumentSection from '~/components/basedatos/DocumentSection.vue'
import { useTramiteDocumentos } from '~/composables/basedatos/useTramiteDocumentos'
import { useModal } from '~/composables/commons/useModal'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const tramiteId = parseInt(route.params.id as string)

const {
  documentos,
  categorias,
  loading,
  uploading,
  error,
  tramiteInfo,
  getDocumentosByCategoria,
  loadDocumentos,
  loadCategorias,
  createCategoria,
  uploadDocumento,
  uploadDocumentos,
  deleteDocumento,
} = useTramiteDocumentos()

const { showSuccess, showError, showConfirmation } = useModal()

const showNuevaCategoriaModal = ref(false)

/** Pendientes por categoría (reportados por cada DocumentSection). Incluye id_categoria para el guardado. */
const pendingByCategoria = ref<
  Record<string, Array<{ nombre_documento: string; archivo: File; id_categoria?: number }>>
>({})
/** Incrementar tras Guardar para que las secciones limpien sus pendientes */
const clearTrigger = ref(0)

/** Categorías a mostrar: desde la API (backend crea las 3 por defecto al crear el trámite) */
const categoriasParaMostrar = computed(() => categorias.value.map(c => c.nombre))

const totalPendingCount = computed(() => {
  return Object.values(pendingByCategoria.value).reduce((sum, items) => sum + items.length, 0)
})

function setPendingForCategoria(
  categoria: string,
  items: Array<{ nombre_documento: string; archivo: File; id_categoria?: number }>
) {
  pendingByCategoria.value = { ...pendingByCategoria.value, [categoria]: items }
}

async function guardarTodo() {
  if (totalPendingCount.value === 0) return
  let ok = 0
  let fail = 0
  // Cada archivo se envía con su id_categoria para que el backend sepa a qué categoría pertenece
  for (const [categoria, items] of Object.entries(pendingByCategoria.value)) {
    if (!items.length) continue
    for (const item of items) {
      const success = await uploadDocumento(
        tramiteId,
        categoria,
        item.nombre_documento,
        item.archivo,
        item.id_categoria
      )
      if (success) ok += 1
      else fail += 1
    }
  }
  if (fail === 0) {
    showSuccess(ok === 1 ? 'Archivo guardado' : `${ok} archivos guardados`)
    clearTrigger.value += 1
    pendingByCategoria.value = {}
    loadDocumentos(tramiteId)
  } else {
    showError(fail === 1 ? (error.value || 'Error al guardar') : `${fail} archivos no se pudieron guardar`)
  }
}

function openNuevaCategoriaModal() {
  showNuevaCategoriaModal.value = true
}

async function handleCreateCategoria(nombreCategoria: string, archivo: File) {
  const nombre = nombreCategoria.trim()
  if (!nombre) return
  if (categoriasParaMostrar.value.includes(nombre)) {
    showError('Ya existe una categoría con ese nombre')
    return
  }
  const creada = await createCategoria(tramiteId, nombre)
  showNuevaCategoriaModal.value = false
  if (!creada) {
    showError(error.value || 'Error al crear la categoría')
    return
  }
  // Enviar el archivo con id_categoria para que el backend sepa a qué categoría pertenece
  const uploadOk = await uploadDocumento(
    tramiteId,
    nombre,
    archivo.name,
    archivo,
    creada.id
  )
  if (uploadOk) {
    showSuccess('Categoría creada y archivo subido correctamente')
    loadDocumentos(tramiteId)
  } else {
    showSuccess('Categoría creada.')
    showError(error.value || 'Error al subir el archivo')
  }
}

async function handleUploadFile(
  categoria: string,
  nombreDocumento: string,
  archivo: File,
  idCategoria?: number
) {
  const success = await uploadDocumento(tramiteId, categoria, nombreDocumento, archivo, idCategoria)
  if (success) {
    showSuccess('Archivo subido correctamente')
  } else {
    showError(error.value || 'Error al subir el archivo')
  }
}

async function handleUploadFiles(
  categoria: string,
  items: Array<{ nombre_documento: string; archivo: File }>
) {
  if (items.length === 0) return
  let ok = 0
  let fail = 0
  for (const item of items) {
    const success = await uploadDocumento(tramiteId, categoria, item.nombre_documento, item.archivo)
    if (success) ok += 1
    else fail += 1
  }
  if (fail === 0) {
    showSuccess(ok === 1 ? 'Archivo subido correctamente' : `${ok} archivos subidos correctamente`)
  } else {
    showError(fail === 1 ? (error.value || 'Error al subir un archivo') : `${fail} archivos no se pudieron subir`)
  }
}

async function handleDelete(id: number) {
  const confirmed = await showConfirmation(
    '¿Estás seguro de eliminar este documento?',
    'Esta acción no se puede deshacer.'
  )
  if (!confirmed) return

  const success = await deleteDocumento(id)
  if (success) {
    showSuccess('Documento eliminado correctamente')
  } else {
    showError(error.value || 'Error al eliminar el documento')
  }
}

onMounted(() => {
  loadDocumentos(tramiteId)
  loadCategorias(tramiteId)
})
</script>
