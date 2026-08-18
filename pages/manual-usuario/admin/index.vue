<template>
  <div class="mx-auto max-w-6xl space-y-4 p-4 pb-16 md:p-6 md:pb-20">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          Mantenedor del manual
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          CRUD de páginas y bloques. Solo root. Orden de bloques con drag & drop.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton variant="outline" color="neutral" icon="i-heroicons-book-open" to="/manual-usuario">
          Ver manual
        </UButton>
        <UButton icon="i-heroicons-plus" color="primary" @click="openCreate">
          Nueva página
        </UButton>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" />

    <UCard>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="w-full max-w-xs">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Rol</label>
          <USkeleton v-if="loadingMeta" class="h-9 w-full rounded-md" />
          <USelect
            v-else
            v-model="filterRole"
            :items="roleItems"
            placeholder="Todos los roles"
            class="w-full"
            @update:model-value="onFilterRole"
          />
        </div>
        <UButton variant="soft" color="neutral" :loading="loading" icon="i-heroicons-arrow-path" @click="loadPages">
          Actualizar
        </UButton>
      </div>

      <div v-if="loading" class="space-y-3 py-2">
        <div v-for="i in 6" :key="i" class="grid grid-cols-7 gap-2">
          <USkeleton class="h-8 w-full rounded-md" />
          <USkeleton class="col-span-2 h-8 w-full rounded-md" />
          <USkeleton class="h-8 w-full rounded-md" />
          <USkeleton class="h-8 w-full rounded-md" />
          <USkeleton class="h-8 w-full rounded-md" />
          <USkeleton class="h-8 w-full rounded-md" />
        </div>
      </div>
      <div v-else-if="!pages.length" class="py-10 text-center text-sm text-gray-500">
        No hay páginas CMS para este filtro.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700">
            <tr>
              <th class="px-2 py-2">Orden</th>
              <th class="px-2 py-2">Título</th>
              <th class="px-2 py-2">Rol</th>
              <th class="px-2 py-2">Módulo</th>
              <th class="px-2 py-2">Bloques</th>
              <th class="px-2 py-2">Estado</th>
              <th class="px-2 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pages"
              :key="p.id"
              class="border-b border-gray-100 dark:border-gray-800"
            >
              <td class="px-2 py-2">{{ p.orden }}</td>
              <td class="px-2 py-2 font-medium text-gray-900 dark:text-white">{{ p.titulo }}</td>
              <td class="px-2 py-2">{{ p.role_slug }}</td>
              <td class="px-2 py-2 font-mono text-xs">{{ p.modulo_key }}</td>
              <td class="px-2 py-2">{{ p.bloques_count }}</td>
              <td class="px-2 py-2">
                <span
                  class="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  :class="p.publicado
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                >
                  {{ p.publicado ? 'Publicado' : 'Borrador' }}
                </span>
              </td>
              <td class="px-2 py-2">
                <div class="flex justify-end gap-1">
                  <UButton
                    size="xs"
                    variant="soft"
                    color="neutral"
                    icon="i-heroicons-document-duplicate"
                    title="Copiar a otro rol"
                    @click="openCopy(p)"
                  />
                  <UButton size="xs" variant="soft" icon="i-heroicons-pencil-square" :to="`/manual-usuario/admin/${p.id}`" />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    :loading="deletingId === p.id"
                    @click="confirmDelete(p)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Imágenes del manual</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Una foto, un nombre. Si se repite en varios roles, se comparte sola. Edítala aquí o desde la hoja.
            </p>
          </div>
          <UButton variant="soft" color="neutral" :loading="loadingCatalog" icon="i-heroicons-arrow-path" @click="loadCatalog">
            Actualizar
          </UButton>
        </div>
      </template>
      <div v-if="loadingCatalog" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 6" :key="i" class="h-28 w-full rounded-lg" />
      </div>
      <div v-else-if="!catalog.length" class="py-8 text-center text-sm text-gray-500">
        Aún no hay imágenes. Súbelas en cada hoja; las de la misma pantalla se reúnen aquí.
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in catalog"
          :key="String(item.id)"
          class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div class="flex h-28 items-center justify-center bg-gray-50 dark:bg-gray-900">
            <img
              v-if="item.url"
              :src="item.url"
              :alt="item.nombre || item.alt || 'Imagen del manual'"
              class="h-full w-full object-contain"
            >
            <span v-else class="text-xs text-gray-400">Sin archivo</span>
          </div>
          <div class="space-y-1 p-2">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white" :title="item.nombre">
              {{ item.nombre }}
            </p>
            <p class="text-xs text-gray-500">
              {{ item.usage === 1 ? '1 hoja' : `${item.usage} hojas` }}
              <span v-if="item.roles.length"> · {{ item.roles.length }} roles</span>
            </p>
            <UButton
              size="xs"
              variant="soft"
              icon="i-heroicons-pencil-square"
              @click="openCapturaEdit(item)"
            >
              Editar
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UModal v-model:open="createOpen">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold">Nueva página</h2>
          </template>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium">Rol</label>
              <USelect v-model="form.role_slug" :items="roleItems" placeholder="Seleccionar rol" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Título</label>
              <UInput v-model="form.titulo" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Clave módulo</label>
              <UInput v-model="form.modulo_key" placeholder="cargaconsolidada/abiertos" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Descripción</label>
              <UTextarea v-model="form.descripcion" :rows="2" class="w-full" />
            </div>
            <div class="flex items-center gap-2">
              <UCheckbox v-model="form.publicado" />
              <span class="text-sm">Publicado</span>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" @click="createOpen = false">Cancelar</UButton>
              <UButton color="primary" :loading="saving" @click="createPage">Crear</UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="copyOpen">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold">Copiar página a otro rol</h2>
          </template>
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Se crea una copia independiente (nuevos registros). Luego puedes quitar o agregar bloques en el destino.
          </p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium">Origen</label>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ copySource?.titulo }}
                <span class="ml-1 font-normal text-gray-500">({{ copySource?.role_slug }})</span>
              </p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Rol destino</label>
              <USelect v-model="copyForm.role_slug" :items="roleItems" placeholder="Seleccionar rol" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Título (opcional)</label>
              <UInput v-model="copyForm.titulo" class="w-full" placeholder="Igual que el origen" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium">Clave módulo (opcional)</label>
              <UInput v-model="copyForm.modulo_key" class="w-full" placeholder="Se ajusta sola si ya existe en el destino" />
            </div>
            <div class="flex items-center gap-2">
              <UCheckbox v-model="copyForm.publicado" />
              <span class="text-sm">Publicar al copiar (si no, queda borrador)</span>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" @click="copyOpen = false">Cancelar</UButton>
              <UButton
                color="primary"
                icon="i-heroicons-document-duplicate"
                :loading="copying"
                @click="submitCopy"
              >
                Copiar
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <ManualCapturaEditModal
      v-model:open="capturaEditOpen"
      :item="capturaEditItem"
      :saving="savingCaptura"
      @save="saveCapturaEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ManualUsuarioService } from '~/services/manualUsuarioService'
import type { ManualAdminMeta, ManualAdminPageSummary, ManualCapturaCatalogItem } from '~/types/manualUsuario'
import { useManualCapturas } from '~/composables/manual-usuario/useManualCapturas'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import ManualCapturaEditModal from '~/components/manual/ManualCapturaEditModal.vue'

definePageMeta({
  name: 'manual-usuario-admin',
  layout: 'default',
})

useHead({ title: 'Mantenedor manual' })

const toast = useToast()
const router = useRouter()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()
const { catalog, loading: loadingCatalog, loadCatalog, updateCaptura } = useManualCapturas()

const loading = ref(true)
const loadingMeta = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const pages = ref<ManualAdminPageSummary[]>([])
const meta = ref<ManualAdminMeta | null>(null)
const filterRole = ref<string | undefined>(undefined)
const createOpen = ref(false)
const deletingId = ref<number | null>(null)
const copyOpen = ref(false)
const copying = ref(false)
const copySource = ref<ManualAdminPageSummary | null>(null)
const capturaEditOpen = ref(false)
const savingCaptura = ref(false)
const capturaEditItem = ref<ManualCapturaCatalogItem | null>(null)

const form = reactive({
  role_slug: '',
  titulo: '',
  modulo_key: '',
  descripcion: '',
  publicado: true,
})

const copyForm = reactive({
  role_slug: '',
  titulo: '',
  modulo_key: '',
  publicado: false,
})

const roleItems = computed(() =>
  (meta.value?.roles || []).map((r) => ({ label: r.nombre, value: r.slug }))
)

const onFilterRole = async () => {
  await loadPages()
}

const loadMeta = async () => {
  loadingMeta.value = true
  try {
    meta.value = await ManualUsuarioService.adminMeta()
  } finally {
    loadingMeta.value = false
  }
}

const loadPages = async () => {
  loading.value = true
  error.value = null
  try {
    pages.value = await ManualUsuarioService.adminListPages({
      role_slug: filterRole.value || undefined,
    })
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar las páginas'
    pages.value = []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.role_slug = filterRole.value || meta.value?.roles?.[0]?.slug || ''
  form.titulo = ''
  form.modulo_key = ''
  form.descripcion = ''
  form.publicado = true
  createOpen.value = true
}

const createPage = async () => {
  if (!form.role_slug || !form.titulo || !form.modulo_key) {
    toast.add({ title: 'Completa rol, título y módulo', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const page = await ManualUsuarioService.adminCreatePage({ ...form })
    createOpen.value = false
    toast.add({ title: 'Página creada', color: 'success' })
    await router.push(`/manual-usuario/admin/${page.id}`)
  } catch (e: any) {
    toast.add({ title: 'Error al crear', description: e?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const openCopy = (p: ManualAdminPageSummary) => {
  copySource.value = p
  const other = (meta.value?.roles || []).find((r) => r.slug !== p.role_slug)
  copyForm.role_slug = other?.slug || p.role_slug
  copyForm.titulo = p.titulo
  copyForm.modulo_key = p.modulo_key
  copyForm.publicado = false
  copyOpen.value = true
}

const submitCopy = async () => {
  if (!copySource.value?.id || !copyForm.role_slug) {
    toast.add({ title: 'Elige el rol destino', color: 'warning' })
    return
  }
  copying.value = true
  try {
    const page = await ManualUsuarioService.adminCopyPage(copySource.value.id, {
      role_slug: copyForm.role_slug,
      titulo: copyForm.titulo || undefined,
      modulo_key: copyForm.modulo_key || undefined,
      publicado: copyForm.publicado,
    })
    copyOpen.value = false
    toast.add({
      title: 'Página copiada',
      description: `Nueva página #${page.id} en ${page.role_slug}`,
      color: 'success',
    })
    await router.push(`/manual-usuario/admin/${page.id}`)
  } catch (e: any) {
    toast.add({ title: 'No se pudo copiar', description: e?.message, color: 'error' })
  } finally {
    copying.value = false
  }
}

const confirmDelete = async (p: ManualAdminPageSummary) => {
  if (!confirm(`¿Eliminar la página "${p.titulo}" y todos sus bloques?`)) return
  deletingId.value = p.id
  try {
    await ManualUsuarioService.adminDeletePage(p.id)
    toast.add({ title: 'Página eliminada', color: 'success' })
    await loadPages()
  } catch (e: any) {
    toast.add({ title: 'No se pudo eliminar', description: e?.message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const openCapturaEdit = (item: ManualCapturaCatalogItem) => {
  capturaEditItem.value = item
  capturaEditOpen.value = true
}

const saveCapturaEdit = async (payload: { nombre: string; file: File | null }) => {
  const item = capturaEditItem.value
  if (!item) return
  savingCaptura.value = true
  try {
    const result = await withSpinner(async () => {
      const updated = await updateCaptura({
        media_id: item.media_id || undefined,
        capture_key: item.capture_key || undefined,
        nombre: payload.nombre,
        file: payload.file || undefined,
      })
      await loadCatalog()
      return updated
    }, payload.file ? 'Reemplazando imagen…' : 'Guardando nombre…')
    capturaEditOpen.value = false
    const extra = Math.max(0, (result.updated || 1) - 1)
    showSuccess(
      'Imagen actualizada',
      extra > 0
        ? `Se actualizó también en ${extra} hoja${extra === 1 ? '' : 's'}.`
        : 'Los cambios quedaron guardados.'
    )
  } catch (e: any) {
    showError('No se pudo guardar', e?.message || 'Inténtalo de nuevo.')
  } finally {
    savingCaptura.value = false
  }
}

onMounted(async () => {
  try {
    await loadMeta()
    await Promise.all([loadPages(), loadCatalog()])
  } catch (e: any) {
    error.value = e?.message || 'Sin permiso (solo root) o error de API'
    loading.value = false
  }
})
</script>
