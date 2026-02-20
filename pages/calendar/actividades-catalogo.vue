<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-2xl mx-auto flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          label="Regresar"
          @click="navigateTo('/calendar/config')"
        />
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Catálogo de Actividades</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Ordena y edita las actividades del calendario</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <!-- Nueva actividad -->
      <UCard>
        <div class="flex gap-2">
          <UInput
            v-model="newName"
            placeholder="Nombre de la nueva actividad..."
            class="flex-1"
            @keydown.enter="handleCreate"
          />
          <UButton
            label="Agregar"
            color="primary"
            icon="i-heroicons-plus"
            :loading="creating"
            :disabled="!newName.trim()"
            @click="handleCreate"
          />
        </div>
      </UCard>

      <!-- Lista drag-and-drop -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-bars-3" class="w-5 h-5 text-primary-500" />
              <h2 class="text-base font-semibold">Actividades</h2>
            </div>
            <UButton
              v-if="orderChanged"
              label="Guardar orden"
              color="primary"
              size="sm"
              :loading="reordering"
              @click="handleReorder"
            />
          </div>
        </template>

        <!-- Loading -->
        <div v-if="loading" class="space-y-2 animate-pulse">
          <div v-for="i in 5" :key="i" class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>

        <!-- Empty -->
        <div v-else-if="localItems.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay actividades. Crea una arriba.
        </div>

        <!-- Items drag-and-drop -->
        <div
          v-else
          class="space-y-2"
          @dragover.prevent
        >
          <div
            v-for="(item, index) in localItems"
            :key="item.id"
            draggable="true"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 transition-colors cursor-grab active:cursor-grabbing select-none"
            :class="{
              'border-primary-500 opacity-50': dragIndex === index,
              'border-transparent': dragIndex !== index,
              'border-dashed border-primary-300 dark:border-primary-700': dragOverIndex === index && dragIndex !== index
            }"
            @dragstart="onDragStart(index)"
            @dragover.prevent="onDragOver(index)"
            @drop="onDrop(index)"
            @dragend="onDragEnd"
          >
            <!-- Grip -->
            <UIcon name="i-heroicons-bars-2" class="w-5 h-5 text-gray-400 shrink-0" />

            <!-- Nombre / Edición inline -->
            <div class="flex-1 min-w-0">
              <template v-if="editingId === item.id">
                <UInput
                  v-model="editingName"
                  size="sm"
                  autofocus
                  @keydown.enter="confirmEdit(item.id)"
                  @keydown.escape="cancelEdit"
                />
              </template>
              <template v-else>
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ item.name }}</p>
              </template>
            </div>

            <!-- Color (solo si no está editando nombre): popover con predeterminados + confirmar -->
            <div v-if="editingId !== item.id" class="flex items-center shrink-0">
              <UPopover :open="editingColorId === item.id" @update:open="(open: boolean) => !open && cancelColorEdit()">
                <UButton
                  variant="outline"
                  size="xs"
                  class="!p-1.5 min-w-0"
                  :disabled="updatingColorId === item.id"
                  title="Cambiar color de la actividad"
                  @click="openColorEdit(item)"
                >
                  <span
                    class="block w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    :style="{ backgroundColor: (editingColorId === item.id ? pendingColorValue : item.color_code) || '#9ca3af' }"
                  />
                </UButton>
                <template #content>
                  <div class="p-3 w-64 space-y-3">
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Color en el calendario</p>
                    <!-- Predeterminados -->
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        v-for="c in PREDEFINED_COLORS"
                        :key="c"
                        type="button"
                        class="w-7 h-7 rounded border-2 transition-transform hover:scale-110"
                        :class="(pendingColorValue || item.color_code) === c ? 'border-gray-900 dark:border-white ring-1 ring-offset-1' : 'border-gray-300 dark:border-gray-600'"
                        :style="{ backgroundColor: c }"
                        :title="c"
                        @click="setPendingColor(c)"
                      />
                    </div>
                    <!-- Personalizado -->
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        :value="pendingColorValue || item.color_code || '#9ca3af'"
                        class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
                        @input="setPendingColor(($event.target as HTMLInputElement).value)"
                      />
                      <span class="text-xs text-gray-500 dark:text-gray-400">Personalizado</span>
                    </div>
                    <!-- Quitar color (usar default) -->
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="w-8 h-8 rounded border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center"
                        title="Sin color (usar predeterminado del calendario)"
                        @click="setPendingColor(null)"
                      >
                        <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-gray-500" />
                      </button>
                      <span class="text-xs text-gray-500 dark:text-gray-400">Sin color</span>
                    </div>
                    <!-- Botones -->
                    <div class="flex gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                      <UButton
                        size="xs"
                        label="Cancelar"
                        variant="ghost"
                        color="neutral"
                        block
                        @click="cancelColorEdit"
                      />
                      <UButton
                        size="xs"
                        label="Aplicar"
                        color="primary"
                        block
                        :loading="updatingColorId === item.id"
                        :disabled="pendingColorValue === (item.color_code ?? null)"
                        @click="confirmColorChange(item)"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-1 shrink-0">
              <template v-if="editingId === item.id">
                <UButton
                  icon="i-heroicons-check"
                  size="xs"
                  color="primary"
                  variant="ghost"
                  :loading="updatingId === item.id"
                  @click="confirmEdit(item.id)"
                />
                <UButton
                  icon="i-heroicons-x-mark"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="cancelEdit"
                />
              </template>
              <template v-else>
                <UTooltip text="Editar nombre">
                  <UButton
                    icon="i-heroicons-pencil-square"
                    size="xs"
                    color="primary"
                    variant="ghost"
                    @click="startEdit(item)"
                  />
                </UTooltip>
                <UTooltip text="Eliminar actividad">
                  <UButton
                    icon="i-heroicons-trash"
                    size="xs"
                    color="error"
                    variant="ghost"
                    :loading="deletingId === item.id"
                    @click="handleDelete(item.id)"
                  />
                </UTooltip>
              </template>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarActivityCatalogItem } from '~/types/calendar'

const {
  activityCatalog,
  loading,
  loadActivityCatalog,
  createActivityInCatalog,
  updateActivityInCatalog,
  reorderActivityCatalog,
  deleteActivityFromCatalog,
} = useCalendarStore()

const { showConfirmation, showSuccess, showError } = useModal()

// Estado local (copia mutable para drag-and-drop)
const localItems = ref<CalendarActivityCatalogItem[]>([])

watch(activityCatalog, (items) => {
  localItems.value = [...items]
}, { immediate: true })

// ─── Nueva actividad ───
const newName = ref('')
const creating = ref(false)

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const created = await createActivityInCatalog(newName.value.trim())
    if (created) {
      newName.value = ''
    } else {
      showError('Error', 'No se pudo crear la actividad.')
    }
  } finally {
    creating.value = false
  }
}

// ─── Edición inline ───
const editingId = ref<number | null>(null)
const editingName = ref('')
const updatingId = ref<number | null>(null)

function startEdit(item: CalendarActivityCatalogItem) {
  editingId.value = item.id
  editingName.value = item.name
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function confirmEdit(id: number) {
  if (!editingName.value.trim()) return
  updatingId.value = id
  try {
    const ok = await updateActivityInCatalog(id, editingName.value.trim())
    if (ok) {
      cancelEdit()
    } else {
      showError('Error', 'No se pudo actualizar la actividad.')
    }
  } finally {
    updatingId.value = null
  }
}

// ─── Color: predeterminados + confirmación ───
const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937'
]

const editingColorId = ref<number | null>(null)
const pendingColorValue = ref<string | null>(null)
const updatingColorId = ref<number | null>(null)

function openColorEdit(item: CalendarActivityCatalogItem) {
  editingColorId.value = item.id
  pendingColorValue.value = item.color_code ?? null
}

function setPendingColor(hex: string | null) {
  pendingColorValue.value = hex
}

function cancelColorEdit() {
  editingColorId.value = null
  pendingColorValue.value = null
}

async function confirmColorChange(item: CalendarActivityCatalogItem) {
  const hex = pendingColorValue.value != null && pendingColorValue.value.trim() ? pendingColorValue.value.trim() : null
  updatingColorId.value = item.id
  try {
    const ok = await updateActivityInCatalog(item.id, item.name, hex)
    if (ok) {
      const idx = localItems.value.findIndex(i => i.id === item.id)
      if (idx !== -1) localItems.value[idx] = { ...localItems.value[idx], color_code: hex || undefined }
      cancelColorEdit()
    } else {
      showError('Error', 'No se pudo actualizar el color.')
    }
  } finally {
    updatingColorId.value = null
  }
}

// ─── Eliminación ───
const deletingId = ref<number | null>(null)

function handleDelete(id: number) {
  showConfirmation(
    'Eliminar actividad',
    '¿Estás seguro de que deseas eliminar esta actividad del catálogo? Los eventos ya creados no se modificarán.',
    async () => {
      deletingId.value = id
      try {
        await deleteActivityFromCatalog(id)
      } finally {
        deletingId.value = null
      }
    }
  )
}

// ─── Drag-and-drop ───
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(index: number) {
  dragOverIndex.value = index
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const items = [...localItems.value]
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(targetIndex, 0, moved)
  localItems.value = items
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

// Detectar si el orden cambió respecto al catálogo original
const orderChanged = computed(() => {
  const original = activityCatalog.value
  if (localItems.value.length !== original.length) return false
  return localItems.value.some((item, i) => item.id !== original[i]?.id)
})

// ─── Guardar orden ───
const reordering = ref(false)

async function handleReorder() {
  reordering.value = true
  try {
    const ids = localItems.value.map(i => i.id)
    const ok = await reorderActivityCatalog(ids)
    if (ok) {
      showSuccess('Orden guardado', 'El orden de las actividades se ha actualizado.')
    } else {
      showError('Error', 'No se pudo guardar el orden.')
    }
  } finally {
    reordering.value = false
  }
}

onMounted(() => {
  loadActivityCatalog(true)
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
