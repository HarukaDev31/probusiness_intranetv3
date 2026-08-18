<template>
  <UCard :class="depth > 0 ? 'border-l-4 border-l-primary-200 dark:border-l-primary-800' : ''">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 items-start gap-2">
          <button
            type="button"
            class="drag-handle mt-0.5 shrink-0 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title="Arrastrar para reordenar"
            aria-label="Arrastrar para reordenar"
          >
            <UIcon name="i-heroicons-bars-3" class="h-5 w-5" />
          </button>
          <button
            type="button"
            class="mt-0.5 shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            :title="collapsed ? 'Expandir' : 'Colapsar'"
            :aria-expanded="!collapsed"
            :aria-label="collapsed ? 'Expandir bloque' : 'Colapsar bloque'"
            @click="collapsed = !collapsed"
          >
            <UIcon
              :name="collapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-down'"
              class="h-5 w-5"
            />
          </button>
          <button
            type="button"
            class="min-w-0 flex-1 rounded text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 -m-1 p-1"
            @click="collapsed = !collapsed"
          >
            <p class="text-xs uppercase text-gray-500">
              {{ containerKindLabel }}
              · {{ block.tipo }}
              <span v-if="depth > 0" class="normal-case text-gray-400"> · nivel {{ depth }}</span>
              <span v-if="collapsed && childCount" class="normal-case text-gray-400"> · {{ childCount }} hijos</span>
            </p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ draft[block.id]?.titulo || '(sin título)' }}
              <span v-if="isGrupo && draft[block.id]?.clave" class="ml-2 font-mono text-xs font-normal text-gray-500">
                {{ draft[block.id].clave }}
              </span>
            </p>
          </button>
        </div>
        <div class="flex flex-wrap gap-1" @click.stop>
          <UButton size="xs" color="primary" variant="soft" :loading="savingBlockId === block.id" @click="emit('save', block.id)">Guardar</UButton>
          <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" :loading="deletingBlockId === block.id" @click="emit('remove', block.id)" />
        </div>
      </div>
    </template>

    <div v-if="draft[block.id] && !collapsed" class="space-y-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium">Título</label>
          <UInput v-model="draft[block.id].titulo" class="w-full" />
        </div>
        <div v-if="isGrupo">
          <label class="mb-1 block text-xs font-medium">Clave (ruta)</label>
          <UInput v-model="draft[block.id].clave" placeholder="modulo/ruta" class="w-full font-mono text-sm" />
        </div>
        <div v-else>
          <label class="mb-1 block text-xs font-medium">
            {{ block.tipo === 'media' ? 'Subtítulo (detalle, se muestra grande bajo el título)' : 'Subtítulo (opcional)' }}
          </label>
          <UInput
            v-model="draft[block.id].subtitulo"
            class="w-full"
            :placeholder="block.tipo === 'media' ? 'Qué muestra esta captura…' : 'Texto bajo el título del bloque'"
          />
        </div>
      </div>

      <div v-if="isGrupo" class="grid gap-3 sm:grid-cols-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
        <div>
          <label class="mb-1 block text-xs font-medium">Presentación</label>
          <USelect
            v-model="draft[block.id].payload.snapshot.variant"
            :items="[{ label: 'Sección', value: 'seccion' }, { label: 'Artículo (plantilla)', value: 'articulo' }]"
            class="w-full"
          />
        </div>
        <div class="flex items-end pb-1">
          <UCheckbox v-model="draft[block.id].payload.snapshot.colapsable" label="Colapsable (acordeón)" />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium">Etiquetas (separadas por coma)</label>
          <UInput
            :model-value="grupoTagsText"
            placeholder="Rol: Comercial, Módulo: Pedidos de Curso"
            class="w-full"
            @update:model-value="setGrupoTags"
          />
        </div>
      </div>

      <template v-if="!isGrupo">
        <div v-if="block.tipo === 'texto'" class="space-y-2">
          <UCheckbox v-model="draft[block.id].payload.snapshot.qa" label="Pregunta / respuesta (plantilla)" />
          <label class="mb-1 block text-xs font-medium">Cuerpo</label>
          <UTextarea v-model="draft[block.id].payload.snapshot.body" :rows="4" class="w-full" />
        </div>

        <div v-else-if="block.tipo === 'callout'" class="grid gap-3 sm:grid-cols-2">
          <USelect
            v-model="draft[block.id].payload.snapshot.tone"
            :items="[
              { label: 'Info', value: 'info' },
              { label: 'Nota', value: 'note' },
              { label: 'Warning', value: 'warning' },
              { label: 'Danger', value: 'danger' },
              { label: 'Resultado', value: 'success' },
            ]"
            class="w-full"
          />
          <UInput v-model="draft[block.id].payload.snapshot.title" placeholder="Título callout" class="w-full" />
          <UTextarea v-model="draft[block.id].payload.snapshot.body" :rows="3" class="sm:col-span-2 w-full" />
        </div>

        <div v-else-if="block.tipo === 'flow'" class="space-y-2">
          <UInput v-model="draft[block.id].payload.snapshot.hint" placeholder="Hint" class="w-full" />
          <div v-for="(step, si) in draft[block.id].payload.snapshot.steps" :key="si" class="space-y-1 rounded border border-gray-200 p-2 dark:border-gray-700">
            <div class="flex gap-2">
              <UInput v-model="step.title" class="flex-1" :placeholder="`Paso ${Number(si) + 1}`" />
              <UButton size="xs" color="error" variant="ghost" @click="draft[block.id].payload.snapshot.steps.splice(Number(si), 1)">Quitar</UButton>
            </div>
            <UTextarea v-model="step.body" :rows="2" class="w-full" />
          </div>
          <UButton size="xs" variant="soft" @click="draft[block.id].payload.snapshot.steps.push({ title: '', body: '' })">+ Paso</UButton>
        </div>

        <div v-else-if="block.tipo === 'media'" class="space-y-2">
          <UInput v-model="draft[block.id].payload.snapshot.caption" placeholder="Caption" class="w-full" />
          <div>
            <label class="mb-1 block text-xs font-medium">Imagen compartida</label>
            <p v-if="currentCaptureKey" class="mb-1 text-xs text-gray-500">
              Clave: <span class="font-mono">{{ currentCaptureKey }}</span>
              <span v-if="currentCaptureUsage > 1"> · {{ currentCaptureUsage }} hojas</span>
            </p>
            <USelectMenu
              :model-value="selectedCatalogMediaId"
              :items="catalogSelectItems"
              value-key="value"
              placeholder="Elegir una imagen del catálogo…"
              searchable
              searchable-placeholder="Buscar por clave…"
              class="w-full"
              @update:model-value="onCatalogSelect"
            />
            <p class="mt-1 text-xs text-gray-500">
              Al elegirla se coloca en todas las hojas con la misma clave.
            </p>
          </div>
          <label class="mb-1 block text-xs font-medium">Subir o reemplazar</label>
          <FileUploader
            :key="`media-${block.id}-${draft[block.id].payload.snapshot.media_id || 0}`"
            :multiple="false"
            :accepted-types="['.jpg', '.jpeg', '.png', '.gif', '.webp']"
            :max-file-size="10 * 1024 * 1024"
            :model-files="[]"
            :initial-files="mediaInitialFiles"
            :show-save-button="false"
            :show-remove-button="true"
            custom-message="Arrastra una imagen aquí o haz clic en «Subir»"
            @file-added="onMediaFileAdded"
            @file-removed="onMediaFileRemoved"
            @error="onMediaUploadError"
          />
        </div>

        <div v-else-if="block.tipo === 'tabs'" class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium">Tab activo (se guarda al Guardar)</label>
            <UTabs
              v-model="draft[block.id].payload.snapshot.active"
              :items="tabSelectItems"
              variant="pill"
              class="mb-1 w-80 h-15"
            />
          </div>
          <div v-if="(draft[block.id].payload.snapshot.tabs || []).length" class="space-y-2">
            <label class="mb-1 block text-xs font-medium">Etiquetas</label>
            <div
              v-for="(tab, ti) in draft[block.id].payload.snapshot.tabs"
              :key="tab.key || ti"
              class="flex items-center gap-2"
            >
              <UInput v-model="tab.label" class="flex-1" :placeholder="`Tab ${Number(ti) + 1}`" />
            </div>
          </div>
        </div>

        <div v-else-if="block.tipo === 'accion'" class="space-y-2">
          <UInput v-model="draft[block.id].payload.snapshot.label" placeholder="Etiqueta" class="w-full" />
          <UInput v-model="draft[block.id].payload.snapshot.icon" placeholder="Icono (i-heroicons-...)" class="w-full font-mono text-sm" />
          <div class="grid gap-2 sm:grid-cols-2">
            <USelect
              v-model="draft[block.id].payload.snapshot.color"
              :items="[
                { label: 'Primary', value: 'primary' },
                { label: 'Neutral', value: 'neutral' },
                { label: 'Error', value: 'error' },
                { label: 'Warning', value: 'warning' },
                { label: 'Success', value: 'success' },
              ]"
              class="w-full"
            />
            <USelect
              v-model="draft[block.id].payload.snapshot.variant"
              :items="[
                { label: 'Solid', value: 'solid' },
                { label: 'Outline', value: 'outline' },
                { label: 'Soft', value: 'soft' },
                { label: 'Ghost', value: 'ghost' },
              ]"
              class="w-full"
            />
          </div>
        </div>

        <div v-else-if="block.tipo === 'card'" class="space-y-2">
          <UInput v-model="draft[block.id].payload.snapshot.title" placeholder="Título card" class="w-full" />
          <UInput v-model="draft[block.id].payload.snapshot.icon" placeholder="Icono (i-heroicons-...)" class="w-full font-mono text-sm" />
          <UTextarea v-model="draft[block.id].payload.snapshot.body" :rows="2" placeholder="Descripción" class="w-full" />
        </div>

        <div v-else-if="['tabla', 'filtros', 'toolbar', 'modal'].includes(block.tipo)" class="space-y-2">
          <UCheckbox
            v-if="block.tipo === 'tabla'"
            :model-value="draft[block.id].payload.snapshot.variant === 'doc'"
            label="Tabla documental (campos / errores, sin DataTable)"
            @update:model-value="setDocTable"
          />
          <p v-if="draft[block.id].payload.source" class="text-xs text-gray-500">
            Snapshot de {{ draft[block.id].payload.source.page_key }} / {{ draft[block.id].payload.source.widget_key }}
          </p>
          <label class="mb-1 block text-xs font-medium">Snapshot JSON</label>
          <UTextarea v-model="draft[block.id].snapshotJson" :rows="8" class="w-full font-mono text-xs" />
        </div>

        <div v-else-if="block.tipo === 'embed'" class="space-y-2">
          <UTextarea v-model="draft[block.id].payload.snapshot.html" :rows="4" class="w-full font-mono text-xs" placeholder="HTML" />
          <UTextarea v-model="draft[block.id].payload.snapshot.css" :rows="3" class="w-full font-mono text-xs" placeholder="CSS" />
        </div>

        <div
          v-if="block.tipo !== 'tabs' && block.tipo !== 'timeline'"
          class="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
        >
          <p class="mb-2 text-xs font-semibold uppercase text-gray-500">Vista previa</p>
          <ManualBlockRenderer :block="previewFromDraft" />
        </div>
      </template>

      <div v-if="isContainer" class="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs font-semibold uppercase text-gray-500">
            {{ isTimeline ? 'Pasos del flujo (izquierda → derecha)' : 'Subbloques' }}
          </p>
          <UButton size="sm" icon="i-heroicons-plus" :loading="addingChild" @click="doAddChild">Agregar</UButton>
        </div>

        <div class="flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
          <div v-if="isArticuloGrupo" class="w-full border-b border-gray-200 pb-3 dark:border-gray-700">
            <label class="mb-1 block text-xs font-medium">Subsección plantilla</label>
            <USelectMenu
              v-model="selectedPlantillaSeccion"
              :items="plantillaSeccionItems"
              value-key="value"
              placeholder="Agregar subsección de la plantilla…"
              searchable
              searchable-placeholder="Buscar…"
              class="w-full max-w-md"
              :disabled="addingTemplateSection"
              @update:model-value="doAddTemplateSection"
            />
          </div>
          <div class="w-40">
            <label class="mb-1 block text-xs font-medium">Tipo</label>
            <USelect v-model="childTipo" :items="childTipoItems" class="w-full" />
          </div>
          <div v-if="childTipo === 'grupo'" class="w-40">
            <label class="mb-1 block text-xs font-medium">Título</label>
            <UInput v-model="childTitulo" class="w-full" />
          </div>
          <div v-if="childTipo === 'grupo'" class="w-48">
            <label class="mb-1 block text-xs font-medium">Clave</label>
            <UInput v-model="childClave" class="w-full font-mono text-sm" />
          </div>
          <div v-if="childTipo === 'timeline'" class="w-48">
            <label class="mb-1 block text-xs font-medium">Título</label>
            <UInput v-model="childTitulo" placeholder="Línea de tiempo" class="w-full" />
          </div>
        </div>

        <div class="grid gap-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-medium">Importar page</label>
            <USelectMenu
              v-model="importPageKey"
              :items="pageItems"
              value-key="value"
              placeholder="Buscar page…"
              searchable
              searchable-placeholder="Escribe para filtrar"
              class="w-full"
              :disabled="importBusy"
              @update:model-value="onImportPageChange"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium">Widget</label>
            <USelectMenu
              v-model="importWidgetKey"
              :items="widgetItems"
              value-key="value"
              placeholder="Buscar widget…"
              searchable
              searchable-placeholder="Escribe para filtrar"
              class="w-full"
              :disabled="importBusy || !importPageKey"
            />
          </div>
          <div class="flex items-end">
            <UButton
              block
              size="sm"
              color="primary"
              variant="soft"
              :loading="importBusy"
              :disabled="importBusy || !importPageKey || !importWidgetKey"
              @click="doImport"
            >
              Importar snapshot
            </UButton>
          </div>
        </div>

        <div v-if="!localChildren.length" class="text-center text-xs text-gray-400">
          {{ isTimeline ? 'Sin pasos. Agrega o importa widgets en orden.' : 'Sin subbloques. Agrega un widget o un subgrupo.' }}
        </div>

        <draggable
          v-else
          v-model="localChildren"
          item-key="id"
          handle=".drag-handle"
          class="space-y-3"
          :animation="180"
          @end="onChildrenReorder"
        >
          <template #item="{ element }">
            <ManualAdminBlockNode
              :block="element"
              :depth="depth + 1"
              :draft="draft"
              :meta="meta"
              :saving-block-id="savingBlockId"
              :deleting-block-id="deletingBlockId"
              :importing-block-id="importingBlockId"
              :role-slug="roleSlug"
              :catalog="catalog"
              @save="(id) => emit('save', id)"
              @remove="(id) => emit('remove', id)"
              @reorder="(ids) => emit('reorder', ids)"
              @add-child="(pid, p) => emit('add-child', pid, p)"
              @import-widget="(pid, pk, wk) => emit('import-widget', pid, pk, wk)"
              @upload="(id, f) => emit('upload', id, f)"
              @assign-captura="(id, payload) => emit('assign-captura', id, payload)"
              @add-template-section="(pid, key) => emit('add-template-section', pid, key)"
            />
          </template>
        </draggable>

        <div
          v-if="isTimeline && localChildren.length"
          class="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
        >
          <p class="mb-2 text-xs font-semibold uppercase text-gray-500">Vista previa del flujo</p>
          <ManualBlockRenderer :block="timelinePreviewBlock" />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import FileUploader from '~/components/commons/FileUploader.vue'
import ManualBlockRenderer from '~/components/manual/ManualBlockRenderer.vue'
import type { FileItem } from '~/types/commons/file'
import type { ManualAdminMeta, ManualBlock, ManualCapturaCatalogItem } from '~/types/manualUsuario'
import type { ManualPlantillaSeccionKey } from '~/composables/manual-usuario/useManualPlantilla'
import { MANUAL_PLANTILLA_SECCIONES } from '~/composables/manual-usuario/useManualPlantilla'

const props = defineProps<{
  block: ManualBlock
  depth: number
  draft: Record<number, any>
  meta: ManualAdminMeta | null
  savingBlockId: number | null
  deletingBlockId: number | null
  importingBlockId?: number | null
  roleSlug: string
  catalog?: ManualCapturaCatalogItem[]
}>()

const emit = defineEmits<{
  save: [id: number]
  remove: [id: number]
  reorder: [ids: number[]]
  'add-child': [parentId: number, payload: { tipo: string; titulo?: string; clave?: string }]
  'import-widget': [parentId: number, pageKey: string, widgetKey: string]
  upload: [blockId: number, file: File]
  'add-template-section': [parentId: number, key: ManualPlantillaSeccionKey]
  'assign-captura': [blockId: number, payload: { media_id?: number | null; capture_key?: string | null }]
}>()

const toast = useToast()
const isGrupo = computed(() => props.block.tipo === 'grupo')
const isArticuloGrupo = computed(() =>
  isGrupo.value && String(props.draft[props.block.id]?.payload?.snapshot?.variant || '') === 'articulo'
)
const isTimeline = computed(() => props.block.tipo === 'timeline')
const isContainer = computed(() => isGrupo.value || isTimeline.value || props.block.tipo === 'flow')
const containerKindLabel = computed(() => {
  if (isGrupo.value) return props.depth === 0 ? 'Bloque' : 'Subgrupo'
  if (isTimeline.value) return 'Línea de tiempo'
  if (props.block.tipo === 'flow') return 'Pasos (fotos por acción)'
  return 'Widget'
})

const grupoTagsText = computed(() => {
  const tags = props.draft[props.block.id]?.payload?.snapshot?.tags
  return Array.isArray(tags) ? tags.join(', ') : String(tags || '')
})
const setGrupoTags = (value: string) => {
  const d = props.draft[props.block.id]
  if (!d?.payload) return
  if (!d.payload.snapshot) d.payload.snapshot = {}
  d.payload.snapshot.tags = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
const syncTablaSnapshotJson = () => {
  const d = props.draft[props.block.id]
  if (!d) return
  d.snapshotJson = JSON.stringify(d.payload?.snapshot || {}, null, 2)
}
const setDocTable = (value: boolean | string | number) => {
  const d = props.draft[props.block.id]
  if (!d?.payload) return
  if (!d.payload.snapshot) d.payload.snapshot = {}
  if (value) d.payload.snapshot.variant = 'doc'
  else delete d.payload.snapshot.variant
  syncTablaSnapshotJson()
}
/** Widgets/subbloques empiezan colapsados; grupos raíz abiertos. */
const collapsed = ref(props.depth > 0)
const childCount = computed(() => (props.block.children || []).length)

type CollapseBus = { token: number; collapsed: boolean | null }
const collapseBus = inject<CollapseBus | null>('manualCollapseBus', null)
if (collapseBus) {
  watch(
    () => collapseBus.token,
    () => {
      if (collapseBus.collapsed === true) collapsed.value = true
      if (collapseBus.collapsed === false) collapsed.value = false
    }
  )
}

const localChildren = ref<ManualBlock[]>([])
const importBusy = computed(() => props.importingBlockId === props.block.id)

watch(
  () => props.block.children,
  (children) => {
    localChildren.value = [...(children || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
  },
  { immediate: true, deep: true }
)

const childTipo = ref('texto')
const childTitulo = ref('')
const childClave = ref('')
const addingChild = ref(false)
const addingTemplateSection = ref(false)
const selectedPlantillaSeccion = ref<ManualPlantillaSeccionKey | undefined>(undefined)
const plantillaSeccionItems = MANUAL_PLANTILLA_SECCIONES.map((s) => ({
  label: s.label,
  value: s.key,
  description: s.description,
}))
const importPageKey = ref<string | undefined>()
const importWidgetKey = ref<string | undefined>()

const widgetTipos = computed(() => props.meta?.widget_tipos || [
  'texto', 'callout', 'media', 'flow', 'embed', 'tabla', 'filtros', 'tabs', 'toolbar', 'modal', 'card', 'accion', 'timeline',
])
const childTipoItems = computed(() => {
  if (isTimeline.value) {
    // En timeline solo pasos (widgets hoja), no contenedores
    return widgetTipos.value
      .filter((t) => t !== 'timeline')
      .map((t) => ({ label: `Paso: ${t}`, value: t }))
  }
  return [
    { label: 'Subgrupo', value: 'grupo' },
    ...widgetTipos.value.map((t) => ({ label: `Widget: ${t}`, value: t })),
  ]
})
const pageItems = computed(() =>
  (props.meta?.page_widgets || []).map((p) => ({ label: p.label, value: p.key }))
)
const widgetItems = computed(() => {
  const pageEntry = (props.meta?.page_widgets || []).find((p) => p.key === importPageKey.value)
  return (pageEntry?.widgets || []).map((w) => ({ label: `${w.label} (${w.tipo})`, value: w.key }))
})

const onImportPageChange = () => {
  importWidgetKey.value = undefined
}

const previewFromDraft = computed((): ManualBlock => {
  const d = props.draft[props.block.id]
  if (!d) return props.block
  const payload = JSON.parse(JSON.stringify(d.payload || {}))
  if (['tabla', 'filtros', 'toolbar', 'modal'].includes(props.block.tipo)) {
    try {
      payload.snapshot = JSON.parse(d.snapshotJson || '{}')
    } catch { /* keep */ }
  }
  return {
    ...props.block,
    titulo: d.titulo,
    clave: d.clave,
    payload,
  }
})

const timelinePreviewBlock = computed((): ManualBlock => {
  const base = previewFromDraft.value
  return {
    ...base,
    children: localChildren.value.map((child) => {
      const d = props.draft[child.id]
      if (!d) return child
      const payload = JSON.parse(JSON.stringify(d.payload || {}))
      if (['tabla', 'filtros', 'toolbar', 'modal'].includes(child.tipo)) {
        try {
          payload.snapshot = JSON.parse(d.snapshotJson || '{}')
        } catch { /* keep */ }
      }
      return {
        ...child,
        titulo: d.titulo || child.titulo,
        payload,
      }
    }),
  }
})

const tabSelectItems = computed(() =>
  (props.draft[props.block.id]?.payload?.snapshot?.tabs || []).map((t: any) => ({
    label: String(t.label ?? t.key ?? ''),
    value: String(t.key ?? t.value ?? ''),
  })).filter((t: { label: string; value: string }) => t.value !== '')
)

const onChildrenReorder = () => {
  emit('reorder', localChildren.value.map((b) => b.id))
}

const doAddChild = () => {
  addingChild.value = true
  try {
    if (childTipo.value === 'grupo') {
      if (!childTitulo.value.trim() || !childClave.value.trim()) {
        toast.add({ title: 'Subgrupo requiere título y clave', color: 'warning' })
        return
      }
      emit('add-child', props.block.id, {
        tipo: 'grupo',
        titulo: childTitulo.value.trim(),
        clave: childClave.value.trim(),
      })
      childTitulo.value = ''
      childClave.value = ''
    } else if (childTipo.value === 'timeline') {
      emit('add-child', props.block.id, {
        tipo: 'timeline',
        titulo: childTitulo.value.trim() || 'Línea de tiempo',
      })
      childTitulo.value = ''
    } else {
      emit('add-child', props.block.id, { tipo: childTipo.value })
    }
  } finally {
    addingChild.value = false
  }
}

const doAddTemplateSection = (key: ManualPlantillaSeccionKey | undefined) => {
  if (!key) return
  selectedPlantillaSeccion.value = undefined
  addingTemplateSection.value = true
  try {
    emit('add-template-section', props.block.id, key)
  } finally {
    addingTemplateSection.value = false
  }
}

const doImport = () => {
  if (importBusy.value || !importPageKey.value || !importWidgetKey.value) return
  emit('import-widget', props.block.id, importPageKey.value, importWidgetKey.value)
}

const mediaInitialFiles = computed((): FileItem[] => {
  const snap = props.draft[props.block.id]?.payload?.snapshot
  if (!snap?.media_id) return []
  const url = String(snap.url || '')
  const ext = (url.split('.').pop() || 'png').split('?')[0].toLowerCase()
  return [{
    id: Number(snap.media_id),
    file_name: String(snap.alt || snap.caption || `imagen-${snap.media_id}.${ext}`),
    file_url: url || null,
    type: 'image',
    size: 0,
    lastModified: 0,
    file_ext: ext,
  }]
})

const onMediaFileAdded = (file: File) => {
  emit('upload', props.block.id, file)
}

const onMediaFileRemoved = () => {
  const d = props.draft[props.block.id]
  if (!d?.payload?.snapshot) return
  d.payload.snapshot.media_id = null
  d.payload.snapshot.url = null
}

const onMediaUploadError = (message: string) => {
  toast.add({ title: 'Archivo no válido', description: message, color: 'error' })
}

const currentCaptureKey = computed(() => {
  const snap = props.draft[props.block.id]?.payload?.snapshot
  return String(snap?.capture_alias_of || snap?.capture_key || '').trim()
})

const currentCaptureUsage = computed(() => {
  const key = currentCaptureKey.value
  if (!key) return 0
  const item = (props.catalog || []).find((entry) => entry.capture_key === key)
  return item?.usage || 0
})

const catalogSelectItems = computed(() =>
  (props.catalog || [])
    .filter((item) => item.media_id)
    .map((item) => ({
      label: item.label,
      value: Number(item.media_id),
    }))
)

const selectedCatalogMediaId = computed(() => {
  const id = Number(props.draft[props.block.id]?.payload?.snapshot?.media_id || 0)
  return id > 0 ? id : undefined
})

const onCatalogSelect = (selected: number | { value?: number } | undefined) => {
  const mediaId = typeof selected === 'number' ? selected : Number(selected?.value || 0)
  if (!mediaId) return
  emit('assign-captura', props.block.id, { media_id: mediaId })
}
</script>

<script lang="ts">
export default { name: 'ManualAdminBlockNode' }
</script>
