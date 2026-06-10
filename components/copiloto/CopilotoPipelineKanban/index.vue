<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <CopilotoPipelineKanbanSkeleton v-if="loading && !columns.length" />
    <div
      v-else
      class="relative flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden p-2"
      :class="loading ? 'opacity-60' : ''"
    >
      <div
        v-if="loading"
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-gray-950/40"
        aria-hidden="true"
      >
        <UIcon name="i-heroicons-arrow-path" class="size-6 animate-spin text-primary" />
      </div>
      <template v-for="(column, index) in columns" :key="column.stage.id">
        <div
          class="flex w-[220px] shrink-0 flex-col rounded-lg border border-default bg-elevated/30"
          @dragover.prevent="onColumnDragOver($event, column)"
          @drop="onColumnDrop($event, column, index)"
        >
          <header
            class="flex items-center justify-between gap-2 rounded-t-lg px-3 py-2 text-white"
            :class="canReorderColumn(column) ? 'cursor-grab active:cursor-grabbing' : ''"
            :draggable="canReorderColumn(column)"
            :style="{ background: stageHeaderColor(column.stage.major) }"
            @dragstart="onColumnDragStart($event, column.stage.id)"
            @dragend="draggingColumnId = null"
          >
            <span class="truncate text-xs font-bold">{{ column.stage.label }}</span>
            <UBadge color="neutral" variant="solid" size="xs">{{ column.count }}</UBadge>
          </header>
          <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
            <button
              v-for="card in column.cards"
              :key="card.conversation_id"
              type="button"
              draggable="true"
              class="w-full rounded-lg border border-default bg-white p-2.5 text-left shadow-sm transition hover:border-primary-400 dark:bg-gray-900"
              :class="selectedId === card.conversation_id ? 'ring-2 ring-primary-500' : ''"
              @click="emit('select', card.conversation_id)"
              @dragstart="onCardDragStart($event, card.conversation_id)"
              @dragend="draggingCardId = null"
            >
              <div class="flex items-start justify-between gap-1">
                <p class="truncate text-sm font-semibold text-highlighted">{{ card.contact_name }}</p>
                <UBadge v-if="card.unread_count > 0" color="primary" size="xs">{{ card.unread_count }}</UBadge>
              </div>
              <p class="mt-0.5 truncate text-[10px] text-muted">{{ card.phone_e164 }}</p>
              <p v-if="card.assigned_user_name" class="mt-1 truncate text-[10px] text-muted">
                {{ card.assigned_user_name }}
              </p>
              <p v-if="card.last_message_preview" class="mt-1 line-clamp-2 text-[10px] text-muted">
                {{ card.last_message_preview }}
              </p>
              <div v-if="card.temperatura != null" class="mt-1.5">
                <UBadge size="xs" variant="subtle" color="warning">IA {{ card.temperatura }}</UBadge>
              </div>
            </button>
            <p v-if="!column.cards.length" class="py-4 text-center text-[10px] text-muted">Sin leads</p>
          </div>
        </div>

        <div
          v-if="canManageStages && isLastProgressColumn(index)"
          class="flex w-[200px] shrink-0 flex-col rounded-lg border border-dashed border-primary-400/70 bg-primary-50/40 dark:bg-primary-950/20"
          @dragover.prevent
          @drop="onDropNewStage($event)"
        >
          <header class="rounded-t-lg bg-primary-500/90 px-3 py-2 text-center text-xs font-bold text-white">
            + Nueva etapa
          </header>
          <div class="flex flex-1 flex-col items-center justify-center gap-2 p-3 text-center">
            <p class="text-[10px] text-muted">Arrastra un lead aquí para crear una etapa en progreso</p>
            <UButton size="xs" variant="soft" color="primary" label="Crear etapa" @click="openCreateModal()" />
          </div>
        </div>
      </template>
    </div>

    <UModal v-model:open="createModalOpen" title="Nueva etapa en progreso">
      <template #body>
        <UFormField label="Nombre de la etapa">
          <UInput v-model="newStageLabel" placeholder="Ej. Seguimiento cotización" autofocus />
        </UFormField>
        <p v-if="pendingConversationId" class="mt-2 text-xs text-muted">
          El lead seleccionado se moverá a esta etapa.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="closeCreateModal" />
          <UButton color="primary" label="Crear" :loading="creatingStage" @click="submitCreateStage" />
        </div>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { WaCopilotoKanbanColumn } from '~/types/wa-copiloto'
import { stageHeaderColor } from '~/composables/copiloto/useCopilotoPipeline'
import CopilotoPipelineKanbanSkeleton from '~/components/copiloto/CopilotoPipelineKanbanSkeleton/index.vue'

const CARD_MIME = 'application/x-copiloto-card'
const COLUMN_MIME = 'application/x-copiloto-column'

const props = withDefaults(
  defineProps<{
    columns: WaCopilotoKanbanColumn[]
    loading?: boolean
    canManageStages?: boolean
    selectedId?: number | null
    onCreateStage?: (label: string, conversationId?: number) => Promise<void>
    onReorderStages?: (orderedStageIds: number[]) => Promise<void>
  }>(),
  {
    loading: false,
    canManageStages: false,
    selectedId: null,
    onCreateStage: undefined,
    onReorderStages: undefined
  }
)

const emit = defineEmits<{
  select: [conversationId: number]
  move: [conversationId: number, stageId: number]
}>()

const draggingCardId = ref<number | null>(null)
const draggingColumnId = ref<number | null>(null)
const createModalOpen = ref(false)
const newStageLabel = ref('')
const pendingConversationId = ref<number | null>(null)
const creatingStage = ref(false)

function progressStageIds(): number[] {
  return props.columns
    .filter((c) => c.stage.major === 'en_progreso')
    .map((c) => c.stage.id)
}

function canReorderColumn(column: WaCopilotoKanbanColumn): boolean {
  return props.canManageStages && column.stage.major === 'en_progreso'
}

function isLastProgressColumn(index: number): boolean {
  const col = props.columns[index]
  if (!col || col.stage.major !== 'en_progreso') return false
  const next = props.columns[index + 1]
  return !next || next.stage.major !== 'en_progreso'
}

function onCardDragStart(event: DragEvent, conversationId: number) {
  draggingCardId.value = conversationId
  event.dataTransfer?.setData(CARD_MIME, String(conversationId))
  event.dataTransfer?.setData('text/plain', String(conversationId))
}

function onColumnDragStart(event: DragEvent, stageId: number) {
  draggingColumnId.value = stageId
  event.dataTransfer?.setData(COLUMN_MIME, String(stageId))
  event.dataTransfer?.setData('text/plain', `col-${stageId}`)
}

function onColumnDragOver(event: DragEvent, column: WaCopilotoKanbanColumn) {
  const types = event.dataTransfer?.types ?? []
  if (types.includes(COLUMN_MIME) && canReorderColumn(column)) {
    event.dataTransfer!.dropEffect = 'move'
  }
}

function onColumnDrop(event: DragEvent, column: WaCopilotoKanbanColumn, index: number) {
  const columnId = Number(event.dataTransfer?.getData(COLUMN_MIME) || draggingColumnId.value || 0)
  const cardId = Number(event.dataTransfer?.getData(CARD_MIME) || draggingCardId.value || 0)

  draggingColumnId.value = null
  draggingCardId.value = null

  if (columnId > 0 && canReorderColumn(column)) {
    const ids = progressStageIds()
    const fromIdx = ids.indexOf(columnId)
    const toIdx = ids.indexOf(column.stage.id)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
    const next = [...ids]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, columnId)
    void props.onReorderStages?.(next)
    return
  }

  if (cardId > 0) {
    emit('move', cardId, column.stage.id)
  }
}

function onDropNewStage(event: DragEvent) {
  const cardId = Number(event.dataTransfer?.getData(CARD_MIME) || draggingCardId.value || 0)
  draggingCardId.value = null
  pendingConversationId.value = cardId > 0 ? cardId : null
  newStageLabel.value = ''
  createModalOpen.value = true
}

function openCreateModal() {
  pendingConversationId.value = null
  newStageLabel.value = ''
  createModalOpen.value = true
}

function closeCreateModal() {
  createModalOpen.value = false
  pendingConversationId.value = null
  newStageLabel.value = ''
}

async function submitCreateStage() {
  const label = newStageLabel.value.trim()
  if (label.length < 2 || !props.onCreateStage) return
  creatingStage.value = true
  try {
    await props.onCreateStage(label, pendingConversationId.value ?? undefined)
    closeCreateModal()
  } finally {
    creatingStage.value = false
  }
}
</script>
