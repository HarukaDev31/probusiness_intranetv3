<template>
  <div class="space-y-4">
    <!-- Siempre: nombre de la categoría -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="iconBg">
          <UIcon :name="icon" class="w-6 h-6" :class="iconColor" />
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
      </div>
      <UButton
        v-if="showAddButton"
        label="Nueva categoría"
        icon="i-heroicons-document-plus"
        variant="soft"
        color="primary"
        size="sm"
        @click="$emit('add')"
      />
    </div>

    <!-- FileUploaders: mínimo 2 o uno por archivo existente; botón agrega más -->
    <div class="space-y-3">
      <div v-for="slotIndex in totalSlots" :key="slotIndex" class="flex items-center gap-2">
        <div class="flex-1">
          <FileUploader
            :multiple="false"
            :initial-files="initialFilesForSlot(slotIndex - 1)"
            :show-remove-button="!readonly"
            :model-files="getSlotFiles(slotIndex - 1)"
            @file-added="(file: File) => !readonly && setSlotFile(slotIndex - 1, file)"
            @file-removed="(idOrIndex: number) => !readonly && handleFileRemoved(slotIndex - 1, idOrIndex)"
            @save-file="(file: File) => !readonly && handleSlotSave(slotIndex - 1, file)"
          />
        </div>
      </div>
      <UButton
        v-if="!readonly"
        label="Agregar archivo"
        icon="i-heroicons-plus"
        variant="soft"
        color="neutral"
        size="sm"
        @click="addSlot"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { TramiteDocumento } from '~/types/basedatos/tramiteAduana'
import type { FileItem } from '~/types/commons/file'

interface Props {
  title: string
  icon: string
  iconBg?: string
  iconColor?: string
  documentos: TramiteDocumento[]
  defaultSlots?: number
  showAddButton?: boolean
  /** Nombre de la categoría (para reportar pendientes al padre). */
  categoria?: string
  /** Id de la categoría (se envía al guardar para asociar el archivo). */
  idCategoria?: number
  /** Cuando cambia, se limpian los archivos pendientes (tras Guardar global). */
  clearTrigger?: number
  /** Si true, oculta controles de subida/eliminación (solo lectura). */
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconBg: 'bg-gray-100 dark:bg-gray-800',
  iconColor: 'text-gray-600 dark:text-gray-400',
  defaultSlots: 2,
  showAddButton: false,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'upload-file', payload: { nombre_documento: string; archivo: File; id_categoria?: number }): void
  (e: 'upload-files', payload: { items: Array<{ nombre_documento: string; archivo: File; id_categoria?: number }> }): void
  (e: 'update:pending', payload: { items: Array<{ nombre_documento: string; archivo: File; id_categoria?: number }> }): void
  (e: 'delete', id: number): void
}>()

/** Slots base: mínimo 2; si hay más de 2 archivos, uno por archivo */
const baseSlots = computed(() => Math.max(2, props.documentos.length))
/** Slots extra que el usuario agrega con "Agregar archivo" */
const extraSlotsCount = ref(0)
/** Total de FileUploaders */
const totalSlots = computed(() => baseSlots.value + extraSlotsCount.value)

function addSlot() {
  extraSlotsCount.value += 1
}

/** Documentos convertidos a FileItem para mostrar en los uploaders */
const fileItemsFromDocumentos = computed<FileItem[]>(() =>
  props.documentos.map(d => ({
    id: d.id,
    file_name: d.nombre_original,
    file_url: d.url,
    type: d.extension,
    size: d.peso,
    lastModified: 0,
    file_ext: d.extension,
  }))
)

/** Un archivo por slot: slot 0 = doc 0, slot 1 = doc 1, …; slots extra quedan vacíos */
function initialFilesForSlot(slotIndex: number): FileItem[] {
  const items = fileItemsFromDocumentos.value
  if (slotIndex >= items.length) return []
  return [items[slotIndex]]
}

/** Ids de documentos que pertenecen a cada slot (para distinguir delete vs limpiar pendiente) */
function initialDocIdsForSlot(slotIndex: number): number[] {
  const items = initialFilesForSlot(slotIndex)
  return items.map(f => f.id as number)
}

/** Archivo pendiente de subir por id de slot */
const pendingBySlot = ref<Map<number, File>>(new Map())

function getSlotFiles(slotId: number): File[] {
  const file = pendingBySlot.value.get(slotId)
  return file ? [file] : []
}

function setSlotFile(slotId: number, file: File) {
  const next = new Map(pendingBySlot.value)
  next.set(slotId, file)
  pendingBySlot.value = next
  emit('update:pending', { items: pendingItemsWithCategoria.value })
}

function clearSlotFile(slotId: number) {
  const next = new Map(pendingBySlot.value)
  next.delete(slotId)
  pendingBySlot.value = next
  emit('update:pending', { items: pendingItemsWithCategoria.value })
}

/** Todos los archivos pendientes; con id_categoria si la sección tiene idCategoria */
const pendingItemsWithCategoria = computed(() => {
  const items: Array<{ nombre_documento: string; archivo: File; id_categoria?: number }> = []
  pendingBySlot.value.forEach((file) => {
    items.push({
      nombre_documento: file.name.replace(/\.[^/.]+$/, ''),
      archivo: file,
      ...(props.idCategoria != null && { id_categoria: props.idCategoria }),
    })
  })
  return items
})

/** Limpia pendientes (llamado por el padre tras Guardar global vía clearTrigger). */
function clearPending() {
  pendingBySlot.value = new Map()
  emit('update:pending', { items: [] })
}

watch(() => props.clearTrigger, () => {
  clearPending()
})

onMounted(() => {
  emit('update:pending', { items: [] })
})

/** Al quitar un archivo: si es un doc existente (id en initialFiles del slot), eliminar doc; si no, limpiar pendiente del slot */
function handleFileRemoved(slotIndex: number, idOrIndex: number) {
  const docIds = initialDocIdsForSlot(slotIndex)
  if (docIds.includes(idOrIndex)) {
    emit('delete', idOrIndex)
  } else {
    clearSlotFile(slotIndex)
  }
}

function handleSlotSave(slotId: number, file: File) {
  const nombreSinExt = file.name.replace(/\.[^/.]+$/, '')
  emit('upload-file', {
    nombre_documento: nombreSinExt,
    archivo: file,
    ...(props.idCategoria != null && { id_categoria: props.idCategoria }),
  })
  clearSlotFile(slotId)
}
</script>
