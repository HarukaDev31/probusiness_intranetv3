<template>
  <div class="mx-auto max-w-5xl space-y-4 p-4 pb-16 md:p-6 md:pb-20">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-arrow-left" to="/manual-usuario/admin" class="mb-1">
          Volver al listado
        </UButton>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ page?.titulo || 'Editar página' }}
        </h1>
        <p v-if="page?.role_slug" class="mt-0.5 text-sm text-gray-500">
          Rol: <span class="font-medium text-gray-700 dark:text-gray-300">{{ roleLabel }}</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton variant="outline" color="neutral" to="/manual-usuario">Ver manual</UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-heroicons-document-duplicate"
          :disabled="!page"
          @click="openCopy"
        >
          Copiar a rol
        </UButton>
        <UButton color="primary" icon="i-heroicons-check" :loading="savingPage" @click="savePage">
          Guardar página
        </UButton>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" />

    <div v-if="loading" class="space-y-4">
      <UCard><div class="space-y-3"><USkeleton class="h-9 w-full" /><USkeleton class="h-20 w-full" /></div></UCard>
      <UCard v-for="i in 2" :key="i"><USkeleton class="h-32 w-full" /></UCard>
    </div>

    <template v-else-if="page">
      <UCard>
        <template #header>
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Datos de la página</h2>
        </template>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium">Título</label>
            <UInput v-model="pageForm.titulo" class="w-full" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium">Clave módulo</label>
            <UInput v-model="pageForm.modulo_key" class="w-full" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium">Descripción</label>
            <UTextarea v-model="pageForm.descripcion" :rows="2" class="w-full" />
          </div>
          <div class="flex items-center gap-2">
            <UCheckbox v-model="pageForm.publicado" />
            <span class="text-sm">Publicado</span>
          </div>
        </div>
      </UCard>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">Bloques</h2>
          <p class="text-xs text-gray-500">
            Cada bloque es un grupo (título + clave/ruta). Arrastra ☰ para reordenar · clic en el título o ⌄ para colapsar.
            <span v-if="!articuloRootId" class="block mt-1 text-amber-700 dark:text-amber-400">
              Genera la plantilla completa para habilitar «Agregar subsección».
            </span>
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UButton
            size="sm"
            variant="soft"
            color="primary"
            icon="i-heroicons-document-text"
            :loading="applyingPlantilla"
            @click="openPlantillaModal"
          >
            Generar plantilla completa
          </UButton>
          <USelectMenu
            v-model="selectedPlantillaSeccion"
            :items="plantillaSeccionItems"
            value-key="value"
            placeholder="Agregar subsección…"
            searchable
            searchable-placeholder="Buscar sección…"
            class="w-56"
            :disabled="!articuloRootId || applyingPlantilla"
            @update:model-value="onAddPlantillaSeccion"
          />
          <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-chevron-up-down" @click="collapseAllBlocks">
            Colapsar todo
          </UButton>
          <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-arrows-pointing-out" @click="expandAllBlocks">
            Expandir todo
          </UButton>
          <div class="w-44">
            <label class="mb-1 block text-xs font-medium">Título</label>
            <UInput v-model="newGrupoTitulo" placeholder="Ej. Abiertos" class="w-full" />
          </div>
          <div class="w-56">
            <label class="mb-1 block text-xs font-medium">Clave (ruta)</label>
            <UInput v-model="newGrupoClave" placeholder="cargaconsolidada/abiertos" class="w-full" />
          </div>
          <UButton icon="i-heroicons-plus" :loading="addingBlock" @click="addGrupo">Agregar bloque</UButton>
        </div>
      </div>

      <div v-if="!rootBlocks.length" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
        Sin bloques. Agrega un grupo (título + clave) y luego subbloques / widgets dentro.
      </div>

      <draggable
        v-else
        v-model="rootBlocks"
        item-key="id"
        handle=".drag-handle"
        class="space-y-4"
        :animation="180"
        @end="onRootReorder"
      >
        <template #item="{ element }">
          <ManualAdminBlockNode
            :block="element"
            :depth="0"
            :draft="draft"
            :meta="meta"
            :saving-block-id="savingBlockId"
            :deleting-block-id="deletingBlockId"
            :importing-block-id="importingBlockId"
            :role-slug="pageRoleSlug"
            :catalog="catalog"
            @save="saveBlock"
            @remove="removeBlock"
            @reorder="reorderByIds"
            @add-child="addChild"
            @import-widget="importWidgetUnder"
            @upload="onUpload"
            @assign-captura="onAssignCaptura"
            @update-captura="onUpdateCaptura"
            @add-template-section="onAddTemplateSectionFromNode"
          />
        </template>
      </draggable>
    </template>

    <UModal v-model:open="copyOpen">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold">Copiar página a otro rol</h2>
          </template>
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Crea registros nuevos e independientes. Después puedes editar la copia sin afectar el origen.
          </p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium">Rol destino</label>
              <USelect v-model="copyForm.role_slug" :items="roleItems" placeholder="Seleccionar rol" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Título</label>
              <UInput v-model="copyForm.titulo" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Clave módulo</label>
              <UInput v-model="copyForm.modulo_key" class="w-full" />
            </div>
            <div class="flex items-center gap-2">
              <UCheckbox v-model="copyForm.publicado" />
              <span class="text-sm">Publicar al copiar</span>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" @click="copyOpen = false">Cancelar</UButton>
              <UButton color="primary" icon="i-heroicons-document-duplicate" :loading="copying" @click="submitCopy">
                Copiar
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="plantillaOpen">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold">Generar plantilla completa</h2>
          </template>
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Crea un artículo con todas las subsecciones estándar (preguntas, pasos, acordeones, resultado). Puedes editar el texto después.
          </p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium">Título del artículo</label>
              <UInput v-model="plantillaForm.articuloTitulo" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Clave / ruta (enlace)</label>
              <UInput v-model="plantillaForm.articuloClave" placeholder="/curso?tab=alumnos" class="w-full font-mono text-sm" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Etiquetas (separadas por coma)</label>
              <UInput v-model="plantillaTagsText" placeholder="Rol: Comercial, Módulo: Pedidos de Curso" class="w-full" />
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" @click="plantillaOpen = false">Cancelar</UButton>
              <UButton
                color="primary"
                icon="i-heroicons-document-text"
                :loading="applyingPlantilla"
                @click="submitPlantillaCompleta"
              >
                Generar hoja
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { ManualUsuarioService } from '~/services/manualUsuarioService'
import ManualAdminBlockNode from '~/components/manual/ManualAdminBlockNode.vue'
import type { ManualAdminMeta, ManualBlock, ManualPage } from '~/types/manualUsuario'
import {
  MANUAL_PLANTILLA_SECCIONES,
  defaultPlantillaConfig,
  type ManualPlantillaSeccionKey,
} from '~/composables/manual-usuario/useManualPlantilla'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useManualPlantilla } from '~/composables/manual-usuario/useManualPlantilla'
import { useManualCapturas } from '~/composables/manual-usuario/useManualCapturas'
import { nombreCapturaDesdeSnapshot } from '~/utils/manualCapturaNombre'

definePageMeta({ name: 'manual-usuario-admin-edit', layout: 'default' })
useHead({ title: 'Editar página manual' })

const route = useRoute()
const toast = useToast()
const router = useRouter()
const pageId = computed(() => Number(route.params.id))

const loading = ref(true)
const error = ref<string | null>(null)
const page = ref<ManualPage | null>(null)
const meta = ref<ManualAdminMeta | null>(null)
const savingPage = ref(false)
const addingBlock = ref(false)
const savingBlockId = ref<number | null>(null)
const deletingBlockId = ref<number | null>(null)
const importingBlockId = ref<number | null>(null)
const newGrupoTitulo = ref('')
const newGrupoClave = ref('')
const draft = reactive<Record<number, any>>({})
const rootBlocks = ref<ManualBlock[]>([])
const reordering = ref(false)
const copyOpen = ref(false)
const copying = ref(false)
const copyForm = reactive({
  role_slug: '',
  titulo: '',
  modulo_key: '',
  publicado: false,
})

const roleItems = computed(() =>
  (meta.value?.roles || []).map((r) => ({ label: r.nombre, value: r.slug }))
)

const collapseBus = reactive<{ token: number; collapsed: boolean | null }>({
  token: 0,
  collapsed: null,
})
provide('manualCollapseBus', collapseBus)

const collapseAllBlocks = () => {
  collapseBus.collapsed = true
  collapseBus.token += 1
}
const expandAllBlocks = () => {
  collapseBus.collapsed = false
  collapseBus.token += 1
}

const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()
const { catalog, loadCatalog, assignCaptura, updateCaptura } = useManualCapturas()
const {
  applying: applyingPlantilla,
  applyPlantillaCompleta,
  applySeccion,
} = useManualPlantilla()

const plantillaOpen = ref(false)
const selectedPlantillaSeccion = ref<ManualPlantillaSeccionKey | undefined>(undefined)
const plantillaForm = reactive({
  articuloTitulo: '',
  articuloClave: '',
  tags: [] as string[],
})
const plantillaTagsText = computed({
  get: () => plantillaForm.tags.join(', '),
  set: (v: string) => {
    plantillaForm.tags = String(v || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  },
})

const plantillaSeccionItems = computed(() =>
  MANUAL_PLANTILLA_SECCIONES.map((s) => ({
    label: s.label,
    value: s.key,
    description: s.description,
  }))
)

const isArticuloBlock = (block: ManualBlock) =>
  block.tipo === 'grupo' && String(block.payload?.snapshot?.variant || '') === 'articulo'

const articuloRootId = computed(() => {
  const root = (page.value?.blocks || []).find(isArticuloBlock)
  return root?.id ?? null
})

const pageForm = reactive({
  titulo: '',
  modulo_key: '',
  descripcion: '' as string | null,
  publicado: true,
})

const pageRoleSlug = computed(() => page.value?.role_slug || '')
const roleLabel = computed(() => {
  const slug = pageRoleSlug.value
  const role = meta.value?.roles?.find((r) => r.slug === slug)
  return role?.nombre || slug
})

const syncRootBlocks = () => {
  rootBlocks.value = [...(page.value?.blocks || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
}

const walkBlocks = (blocks: ManualBlock[], fn: (b: ManualBlock) => void) => {
  for (const b of blocks) {
    fn(b)
    if (b.children?.length) walkBlocks(b.children, fn)
  }
}

const findBlock = (id: number, blocks?: ManualBlock[]): ManualBlock | null => {
  for (const b of blocks || page.value?.blocks || []) {
    if (b.id === id) return b
    const found = findBlock(id, b.children || [])
    if (found) return found
  }
  return null
}

const hydrateDraft = (block: ManualBlock) => {
  const payload = JSON.parse(JSON.stringify(block.payload || {}))
  if (!payload.snapshot) payload.snapshot = {}
  if (block.tipo === 'tabs') {
    const tabs = Array.isArray(payload.snapshot.tabs) ? payload.snapshot.tabs : []
    if (!payload.snapshot.active && tabs[0]?.key) {
      payload.snapshot.active = tabs[0].key
    }
  }
  if (block.tipo === 'media') {
    if (payload.snapshot.nombre == null) payload.snapshot.nombre = ''
    if (!String(payload.snapshot.nombre).trim()) {
      payload.snapshot.nombre = nombreCapturaDesdeSnapshot(
        { ...payload.snapshot, nombre: '' },
        block.titulo,
        page.value?.titulo,
      )
    }
  }
  draft[block.id] = {
    titulo: block.titulo || '',
    clave: block.clave || '',
    subtitulo: payload.subtitulo ?? '',
    payload,
    snapshotJson: JSON.stringify(payload.snapshot || {}, null, 2),
  }
  for (const child of block.children || []) hydrateDraft(child)
}

const buildPayload = (block: ManualBlock) => {
  const d = draft[block.id]
  const payload = JSON.parse(JSON.stringify(d.payload || {}))
  const sub = String(d.subtitulo ?? '').trim()
  payload.subtitulo = sub !== '' ? sub : null
  if (['tabla', 'filtros', 'toolbar', 'modal'].includes(block.tipo)) {
    try {
      payload.snapshot = JSON.parse(d.snapshotJson || '{}')
    } catch {
      throw new Error('Snapshot JSON inválido')
    }
  }
  return payload
}

const reloadPage = async () => {
  page.value = await ManualUsuarioService.adminGetPage(pageId.value)
  Object.keys(draft).forEach((k) => delete draft[Number(k)])
  walkBlocks(page.value.blocks || [], hydrateDraft)
  syncRootBlocks()
}

const load = async () => {
  loading.value = true
  error.value = null
  try {
    meta.value = await ManualUsuarioService.adminMeta()
    try {
      await loadCatalog()
    } catch {
      catalog.value = []
    }
    page.value = await ManualUsuarioService.adminGetPage(pageId.value)
    pageForm.titulo = page.value.titulo
    pageForm.modulo_key = page.value.modulo_key
    pageForm.descripcion = page.value.descripcion || ''
    pageForm.publicado = page.value.publicado !== false
    walkBlocks(page.value.blocks || [], hydrateDraft)
    syncRootBlocks()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar la página'
    page.value = null
  } finally {
    loading.value = false
  }
}

const savePage = async () => {
  savingPage.value = true
  try {
    page.value = await ManualUsuarioService.adminUpdatePage(pageId.value, { ...pageForm })
    toast.add({ title: 'Página guardada', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message, color: 'error' })
  } finally {
    savingPage.value = false
  }
}

const addGrupo = async () => {
  if (!newGrupoTitulo.value.trim() || !newGrupoClave.value.trim()) {
    toast.add({ title: 'Título y clave son obligatorios', color: 'warning' })
    return
  }
  addingBlock.value = true
  try {
    await ManualUsuarioService.adminCreateBlock(pageId.value, {
      titulo: newGrupoTitulo.value.trim(),
      clave: newGrupoClave.value.trim(),
    })
    newGrupoTitulo.value = ''
    newGrupoClave.value = ''
    await reloadPage()
    toast.add({ title: 'Bloque (grupo) agregado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message, color: 'error' })
  } finally {
    addingBlock.value = false
  }
}

const addChild = async (parentId: number, payload: { tipo: string; titulo?: string; clave?: string }) => {
  try {
    await ManualUsuarioService.adminCreateBlock(pageId.value, {
      parent_id: parentId,
      ...payload,
    })
    await reloadPage()
    toast.add({ title: 'Subbloque agregado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message, color: 'error' })
  }
}

const importWidgetUnder = async (parentId: number, pageKey: string, widgetKey: string) => {
  if (importingBlockId.value != null) return
  importingBlockId.value = parentId
  try {
    await withSpinner(async () => {
      await ManualUsuarioService.adminCreateBlockFromPageWidget(pageId.value, {
        parent_id: parentId,
        page_key: pageKey,
        widget_key: widgetKey,
      })
      await reloadPage()
    }, 'Importando widget…')
    toast.add({ title: 'Widget importado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error al importar', description: e?.message, color: 'error' })
  } finally {
    importingBlockId.value = null
  }
}

const saveBlock = async (id: number) => {
  const block = findBlock(id)
  if (!block) return
  savingBlockId.value = id
  try {
    const body: Record<string, unknown> = {
      titulo: draft[id].titulo,
      payload: buildPayload(block),
    }
    if (block.tipo === 'grupo') {
      body.clave = draft[id].clave
    }
    await withSpinner(async () => {
      await ManualUsuarioService.adminUpdateBlock(id, body)
      if (block.tipo === 'media') {
        const snap = draft[id]?.payload?.snapshot || {}
const nombre = String(snap.nombre || '').trim()
        if (nombre) {
          await updateCaptura({
            block_id: id,
            media_id: snap.media_id || undefined,
            capture_key: snap.capture_alias_of || snap.capture_key || undefined,
            nombre,
            role_slug: pageRoleSlug.value || undefined,
          })
        }
      }
      await reloadPage()
    }, 'Guardando…')
    showSuccess('Guardado', block.tipo === 'media' ? 'El nombre se aplicó a las hojas que comparten esta imagen.' : 'Bloque actualizado.')
  } catch (e: any) {
    showError('No se pudo guardar', e?.message || 'Inténtalo de nuevo.')
  } finally {
    savingBlockId.value = null
  }
}

const removeBlock = async (id: number) => {
  if (!confirm('¿Eliminar este bloque y sus subbloques?')) return
  deletingBlockId.value = id
  try {
    await ManualUsuarioService.adminDeleteBlock(id)
    delete draft[id]
    await reloadPage()
    toast.add({ title: 'Eliminado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message, color: 'error' })
  } finally {
    deletingBlockId.value = null
  }
}

const reorderByIds = async (ids: number[]) => {
  if (reordering.value || ids.length < 2) return
  reordering.value = true
  try {
    await ManualUsuarioService.adminReorderBlocks(ids.map((id, i) => ({ id, orden: i + 1 })))
    await reloadPage()
  } catch (e: any) {
    toast.add({ title: 'Error al reordenar', description: e?.message, color: 'error' })
    await reloadPage()
  } finally {
    reordering.value = false
  }
}

const onRootReorder = async () => {
  await reorderByIds(rootBlocks.value.map((b) => b.id))
}

const onUpload = async (blockId: number, file: File) => {
  await onUpdateCaptura(blockId, { file })
}

const onUpdateCaptura = async (blockId: number, payload: { nombre?: string | null; file?: File | null }) => {
  const snap = draft[blockId]?.payload?.snapshot || {}
  try {
    const result = await withSpinner(async () => {
      const updated = await updateCaptura({
        block_id: blockId,
        media_id: snap.media_id || undefined,
        capture_key: snap.capture_alias_of || snap.capture_key || undefined,
        nombre: payload.nombre ?? (String(snap.nombre || '').trim() || undefined),
        file: payload.file || undefined,
        role_slug: pageRoleSlug.value || undefined,
      })
      await reloadPage()
      await loadCatalog()
      return updated
    }, payload.file ? 'Reemplazando imagen…' : 'Guardando imagen…')
    const extra = Math.max(0, (result.updated || 1) - 1)
    showSuccess(
      'Imagen actualizada',
      extra > 0
        ? `Se actualizó también en ${extra} hoja${extra === 1 ? '' : 's'} con la misma clave.`
        : 'La imagen quedó guardada.'
    )
  } catch (e: any) {
    showError('No se pudo actualizar', e?.message || 'Inténtalo de nuevo.')
  }
}

const onAssignCaptura = async (blockId: number, payload: { media_id?: number | null; capture_key?: string | null }) => {
  try {
    const result = await withSpinner(async () => {
      const assigned = await assignCaptura(blockId, payload)
      await reloadPage()
      await loadCatalog()
      return assigned
    }, 'Aplicando imagen…')
    const extra = Math.max(0, (result.updated || 1) - 1)
    showSuccess(
      'Imagen aplicada',
      extra > 0
        ? `Se actualizó también en ${extra} hoja${extra === 1 ? '' : 's'} con la misma clave.`
        : 'La imagen quedó en esta hoja.'
    )
  } catch (e: any) {
    showError('No se pudo aplicar', e?.message || 'Inténtalo de nuevo.')
  }
}

const openCopy = () => {
  if (!page.value) return
  const other = (meta.value?.roles || []).find((r) => r.slug !== page.value?.role_slug)
  copyForm.role_slug = other?.slug || page.value.role_slug
  copyForm.titulo = pageForm.titulo || page.value.titulo
  copyForm.modulo_key = pageForm.modulo_key || page.value.modulo_key
  copyForm.publicado = false
  copyOpen.value = true
}

const openPlantillaModal = () => {
  if (!page.value) return
  const defaults = defaultPlantillaConfig({
    titulo: pageForm.titulo || page.value.titulo,
    modulo_key: pageForm.modulo_key || page.value.modulo_key,
    role_slug: pageRoleSlug.value,
  })
  plantillaForm.articuloTitulo = defaults.articuloTitulo
  plantillaForm.articuloClave = defaults.articuloClave
  plantillaForm.tags = [...defaults.tags]
  plantillaOpen.value = true
}

const submitPlantillaCompleta = async () => {
  if (!plantillaForm.articuloTitulo.trim() || !plantillaForm.articuloClave.trim()) {
    toast.add({ title: 'Título y clave del artículo son obligatorios', color: 'warning' })
    return
  }
  if (articuloRootId.value && !confirm('Ya hay un artículo plantilla. ¿Generar otro bloque raíz adicional?')) {
    return
  }
  try {
    await withSpinner(async () => {
      await applyPlantillaCompleta(pageId.value, {
        articuloTitulo: plantillaForm.articuloTitulo.trim(),
        articuloClave: plantillaForm.articuloClave.trim(),
        tags: plantillaForm.tags,
      })
      await reloadPage()
    }, 'Generando plantilla…')
    plantillaOpen.value = false
    toast.add({ title: 'Plantilla generada', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error al generar plantilla', description: e?.message, color: 'error' })
  }
}

const onAddPlantillaSeccion = async (key: ManualPlantillaSeccionKey | undefined) => {
  if (!key || !articuloRootId.value) return
  selectedPlantillaSeccion.value = undefined
  try {
    await withSpinner(async () => {
      await applySeccion(pageId.value, articuloRootId.value!, key)
      await reloadPage()
    }, 'Agregando subsección…')
    const label = MANUAL_PLANTILLA_SECCIONES.find((s) => s.key === key)?.label || key
    toast.add({ title: `Subsección agregada: ${label}`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error al agregar subsección', description: e?.message, color: 'error' })
  }
}

const onAddTemplateSectionFromNode = async (parentId: number, key: ManualPlantillaSeccionKey) => {
  try {
    await withSpinner(async () => {
      await applySeccion(pageId.value, parentId, key)
      await reloadPage()
    }, 'Agregando subsección…')
    const label = MANUAL_PLANTILLA_SECCIONES.find((s) => s.key === key)?.label || key
    toast.add({ title: `Subsección agregada: ${label}`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error al agregar subsección', description: e?.message, color: 'error' })
  }
}

const submitCopy = async () => {
  if (!page.value?.id || !copyForm.role_slug) {
    toast.add({ title: 'Elige el rol destino', color: 'warning' })
    return
  }
  copying.value = true
  try {
    const created = await ManualUsuarioService.adminCopyPage(page.value.id, {
      role_slug: copyForm.role_slug,
      titulo: copyForm.titulo || undefined,
      modulo_key: copyForm.modulo_key || undefined,
      publicado: copyForm.publicado,
    })
    copyOpen.value = false
    toast.add({
      title: 'Página copiada',
      description: `Nueva página #${created.id} en ${created.role_slug}`,
      color: 'success',
    })
    await router.push(`/manual-usuario/admin/${created.id}`)
  } catch (e: any) {
    toast.add({ title: 'No se pudo copiar', description: e?.message, color: 'error' })
  } finally {
    copying.value = false
  }
}

onMounted(load)
</script>
