<template>
  <div class="p-6">
    <DataTable
      title="Gestión de Menús"
      icon="i-heroicons-squares-2x2"
      :show-title="true"
      :data="sortedMenus"
      :columns="columns"
      :loading="loading"
      :show-primary-search="true"
      primary-search-placeholder="Buscar menú, ruta..."
      :primary-search-value="search"
      :show-pagination="false"
      :show-export="false"
      empty-state-message="No hay menús registrados"
      @update:primary-search="search = $event"
    >
      <template #actions>
        <UButton icon="i-heroicons-plus" label="Agregar Menú" @click="openModal()" />
      </template>
    </DataTable>

    <!-- ===== Modal Crear/Editar ===== -->
    <UModal v-model:open="showModal" :ui="{ width: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingMenu ? 'Editar Menú' : 'Nuevo Menú' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
            </div>
          </template>

          <form @submit.prevent="submitForm" class="space-y-4">

            <!-- Tipo de menú: Principal vs Submenú -->
            <UFormField label="Tipo de menú" required>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 text-sm font-medium transition-colors"
                  :class="form.tipo === 'principal'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
                  @click="form.tipo = 'principal'; form.id_padre = 0"
                >
                  <UIcon name="i-heroicons-home" class="w-4 h-4" />
                  Menú Principal
                </button>
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 text-sm font-medium transition-colors"
                  :class="form.tipo === 'sub'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
                  @click="form.tipo = 'sub'"
                >
                  <UIcon name="i-heroicons-arrow-right-circle" class="w-4 h-4" />
                  Submenú de...
                </button>
              </div>
            </UFormField>

            <!-- Selector de padre (solo si es submenú) -->
            <UFormField v-if="form.tipo === 'sub'" label="Menú Padre" required>
              <USelect
                v-model="form.id_padre"
                :items="padreOptions"
                placeholder="Seleccionar menú padre"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Nombre" required>
                <UInput v-model="form.nombre" placeholder="Nombre del menú" maxlength="100" class="w-full" />
              </UFormField>
              <UFormField label="Orden" required>
                <UInput v-model.number="form.orden" type="number" min="0" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Ruta Nuxt">
              <UInput v-model="form.ruta" placeholder="/panel-acceso/cargos" class="w-full" />
            </UFormField>

            <!-- Ícono -->
            <UFormField label="Ícono">
              <div class="flex gap-2 items-center">
                <div class="flex-shrink-0 w-9 h-9 border rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <img v-if="isIconUrl(form.icono)" :src="form.icono" class="w-6 h-6 object-contain" />
                  <UIcon v-else-if="form.icono" :name="form.icono" class="w-6 h-6 text-gray-500" />
                  <UIcon v-else name="i-heroicons-photo" class="w-5 h-5 text-gray-300" />
                </div>
                <UInput v-model="form.icono" placeholder="heroicons:home  o  mdi:account  o  URL" class="flex-1" />
                <UButton size="sm" icon="i-heroicons-magnifying-glass" variant="outline" title="Buscar ícono" @click="showIconPicker = true" />
                <label class="cursor-pointer">
                  <UButton size="sm" icon="i-heroicons-arrow-up-tray" variant="outline" title="Subir imagen" :loading="uploadingIcon" as="span" />
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml" class="hidden" @change="handleIconUpload" />
                </label>
              </div>
              <p class="text-xs text-gray-400 mt-1">Ej: <code>heroicons:home</code>, <code>mdi:account</code>, <code>tabler:truck</code></p>
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="URL de Video">
                <UInput v-model="form.url_video" placeholder="https://youtube.com/..." class="w-full" />
              </UFormField>
              <UFormField label="Estado" required>
                <USelect
                  v-model="form.activo"
                  :items="[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex items-center gap-2">
              <UCheckbox v-model="form.show_father" />
              <span class="text-sm text-gray-600 dark:text-gray-300">Mostrar padre en sidebar</span>
            </div>

            <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>
          </form>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showModal = false" />
              <UButton label="Guardar" icon="i-heroicons-check" :loading="saving" @click="submitForm" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- ===== Modal Ver Roles ===== -->
    <UModal v-model:open="showRolesModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                Roles con acceso a: <em>{{ viewingMenu?.nombre }}</em>
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showRolesModal = false" />
            </div>
          </template>
          <div v-if="loadingRoles" class="text-center py-6">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
          </div>
          <div v-else-if="rolesConAcceso.length === 0" class="text-center py-6 text-gray-500">
            Ningún cargo tiene asignado este menú.
          </div>
          <ul v-else class="space-y-2">
            <li v-for="g in rolesConAcceso" :key="g.id" class="flex items-center justify-between rounded border px-3 py-2">
              <span class="font-medium">{{ g.cargo }}</span>
              <UBadge variant="soft" color="primary">{{ g.privilegio_nombre }}</UBadge>
            </li>
          </ul>
          <p class="mt-4 text-xs text-amber-600 dark:text-amber-400">
            Al eliminar este menú se desasignará automáticamente de todos los roles listados.
          </p>
          <template #footer>
            <div class="flex justify-end">
              <UButton variant="outline" label="Cerrar" @click="showRolesModal = false" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- ===== Modal Eliminar ===== -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Eliminación</h3>
          </template>
          <p>¿Eliminar el menú <strong>{{ deletingMenu?.nombre }}</strong>?</p>
          <p class="mt-2 text-sm text-amber-600">Se desasignará de todos los roles que lo tengan asignado.</p>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showDeleteModal = false" />
              <UButton color="error" label="Eliminar" icon="i-heroicons-trash" :loading="deleting" @click="deleteMenu" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- ===== Modal Icon Picker ===== -->
    <UModal v-model:open="showIconPicker" :ui="{ width: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Seleccionar Ícono</h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showIconPicker = false" />
            </div>
          </template>
          <div class="flex gap-1 mb-3 border-b">
            <button
              v-for="lib in iconLibraries" :key="lib.prefix"
              class="px-4 py-2 text-sm font-medium transition-colors"
              :class="pickerTab === lib.prefix ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'"
              @click="pickerTab = lib.prefix; searchIcons()"
            >{{ lib.label }}</button>
          </div>
          <UInput v-model="iconSearch" placeholder="Buscar ícono..." icon="i-heroicons-magnifying-glass" class="mb-3" @input="debouncedSearch" />
          <div v-if="loadingIcons" class="text-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
          </div>
          <div v-else-if="pickerIcons.length === 0" class="text-center py-8 text-gray-400">Sin resultados.</div>
          <div v-else class="grid grid-cols-8 gap-1 max-h-72 overflow-y-auto">
            <button
              v-for="icon in pickerIcons" :key="icon"
              class="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :title="icon"
              @click="selectIcon(icon)"
            >
              <UIcon :name="icon" class="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span class="text-[9px] text-gray-400 truncate w-full text-center">{{ icon.split(':')[1] }}</span>
            </button>
          </div>
          <template #footer>
            <div class="flex justify-between items-center">
              <p class="text-xs text-gray-400">Resultados de <a href="https://iconify.design" target="_blank" class="underline">Iconify API</a></p>
              <UButton variant="outline" label="Cancelar" @click="showIconPicker = false" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { MenuCatalogoService } from '~/services/panelAcceso/menuCatalogoService'
import type { MenuCatalogo, GrupoConAcceso } from '~/services/panelAcceso/menuCatalogoService'

// ─── Data ──────────────────────────────────────────────────────────────────
const menus   = ref<MenuCatalogo[]>([])
const loading = ref(false)
const search  = ref('')

// ─── Jerarquía: ordenar parent → hijos → nietos ───────────────────────────
interface MenuWithLevel extends MenuCatalogo { nivel: number }

function buildSortedTree(list: MenuCatalogo[]): MenuWithLevel[] {
  const result: MenuWithLevel[] = []

  function addChildren(parentId: number, nivel: number) {
    const children = list
      .filter(m => m.id_padre === parentId)
      .sort((a, b) => a.orden - b.orden)
    for (const child of children) {
      result.push({ ...child, nivel })
      addChildren(child.id, nivel + 1)
    }
  }

  const roots = list
    .filter(m => m.id_padre === 0)
    .sort((a, b) => a.orden - b.orden)

  for (const root of roots) {
    result.push({ ...root, nivel: 0 })
    addChildren(root.id, 1)
  }

  // Items huérfanos (padre no existe): agregar al final
  const inTree = new Set(result.map(m => m.id))
  for (const m of list) {
    if (!inTree.has(m.id)) result.push({ ...m, nivel: 0 })
  }

  return result
}

const sortedMenus = computed(() => {
  const tree = buildSortedTree(menus.value)
  if (!search.value) return tree
  const q = search.value.toLowerCase()
  return tree.filter(m =>
    m.nombre.toLowerCase().includes(q) ||
    (m.ruta ?? '').toLowerCase().includes(q) ||
    (m.padre_nombre ?? '').toLowerCase().includes(q)
  )
})

// ─── Columnas DataTable ───────────────────────────────────────────────────
const columns = computed(() => [
  {
    header: 'Nombre',
    accessorKey: 'nombre',
    cell: ({ row }: any) => {
      const m: MenuWithLevel = row.original
      const indent = m.nivel * 16
      const prefixes = ['', '└ ', '  └ ']
      const prefix = prefixes[m.nivel] ?? '    └ '
      return h('div', { style: { paddingLeft: `${indent}px` }, class: 'flex items-center gap-1' }, [
        m.nivel > 0 ? h('span', { class: 'text-gray-400 text-xs select-none' }, prefix) : null,
        h('span', { class: m.nivel === 0 ? 'font-semibold' : m.nivel === 1 ? 'font-medium' : 'text-gray-600 dark:text-gray-400' }, m.nombre),
      ])
    }
  },
  {
    header: 'Ícono',
    accessorKey: 'icono',
    cell: ({ row }: any) => {
      const icono: string | null = row.original.icono
      if (!icono) return h('span', { class: 'text-gray-300 text-xs' }, '—')
      if (icono.startsWith('/') || icono.startsWith('http')) {
        return h('img', { src: icono, class: 'w-5 h-5 mx-auto object-contain' })
      }
      return h(resolveComponent('UIcon'), { name: icono, class: 'w-5 h-5 mx-auto text-gray-500' })
    }
  },
  {
    header: 'Ruta Nuxt',
    accessorKey: 'ruta',
    cell: ({ row }: any) =>
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.original.ruta || '—')
  },
  {
    header: 'Estado',
    accessorKey: 'activo',
    cell: ({ row }: any) =>
      h(resolveComponent('UBadge'), {
        color: row.original.activo === 1 ? 'success' : 'neutral',
      }, () => row.original.activo === 1 ? 'Activo' : 'Inactivo')
  },
  {
    header: 'Roles asignados',
    accessorKey: 'total_roles',
    cell: ({ row }: any) => {
      const count: number = row.original.total_roles ?? 0
      return h(resolveComponent('UBadge'), {
        color: count > 0 ? 'info' : 'neutral',
        variant: count > 0 ? 'soft' : 'outline',
      }, () => count > 0 ? `Sí (${count})` : 'No')
    }
  },
  {
    header: 'Acciones',
    accessorKey: 'acciones',
    cell: ({ row }: any) => {
      const menu: MenuWithLevel = row.original
      return h('div', { class: 'flex justify-center gap-1' }, [
        h(resolveComponent('UButton'), {
          size: 'xs', icon: 'i-heroicons-user-group', color: 'info', variant: 'ghost',
          title: 'Ver roles con acceso',
          onClick: () => openRolesModal(menu)
        }),
        h(resolveComponent('UButton'), {
          size: 'xs', icon: 'i-heroicons-pencil', color: 'primary', variant: 'ghost',
          onClick: () => openModal(menu)
        }),
        h(resolveComponent('UButton'), {
          size: 'xs', icon: 'i-heroicons-trash', color: 'error', variant: 'ghost',
          onClick: () => confirmDelete(menu)
        }),
      ])
    }
  },
])

// ─── Options para select de padre (excluye el menú que se edita) ──────────
const padreOptions = computed(() => {
  const exclude = editingMenu.value?.id
  return menus.value
    .filter(m => m.id !== exclude)
    .map(m => ({ label: m.nombre, value: m.id }))
})

// ─── Modal Crear/Editar ────────────────────────────────────────────────────
const showModal    = ref(false)
const editingMenu  = ref<MenuCatalogo | null>(null)
const saving       = ref(false)
const formError    = ref('')
const uploadingIcon = ref(false)

const form = reactive({
  tipo:        'principal' as 'principal' | 'sub',
  nombre:      '',
  id_padre:    0,
  orden:       0,
  icono:       '',
  ruta:        '',
  activo:      true,
  url_video:   '',
  show_father: false,
})

function openModal(menu?: MenuWithLevel) {
  formError.value = ''
  if (menu) {
    editingMenu.value = menu
    form.tipo        = menu.id_padre === 0 ? 'principal' : 'sub'
    form.nombre      = menu.nombre
    form.id_padre    = menu.id_padre
    form.orden       = menu.orden
    form.icono       = menu.icono ?? ''
    form.ruta        = menu.ruta ?? ''
    form.activo      = menu.activo === 1
    form.url_video   = menu.url_video ?? ''
    form.show_father = menu.show_father === 1
  } else {
    editingMenu.value = null
    form.tipo        = 'principal'
    form.nombre      = ''
    form.id_padre    = 0
    form.orden       = 0
    form.icono       = ''
    form.ruta        = ''
    form.activo      = true
    form.url_video   = ''
    form.show_father = false
  }
  showModal.value = true
}

async function submitForm() {
  if (!form.nombre.trim()) { formError.value = 'El nombre es requerido'; return }
  if (form.tipo === 'sub' && !form.id_padre) { formError.value = 'Selecciona el menú padre'; return }
  formError.value = ''
  saving.value = true

  const payload = {
    nombre:      form.nombre.trim(),
    id_padre:    form.tipo === 'principal' ? 0 : Number(form.id_padre),
    orden:       Number(form.orden),
    icono:       form.icono || undefined,
    ruta:        form.ruta || undefined,
    activo:      form.activo,
    url_video:   form.url_video || undefined,
    show_father: form.show_father,
  }

  const res = editingMenu.value
    ? await MenuCatalogoService.updateMenu(editingMenu.value.id, payload)
    : await MenuCatalogoService.createMenu(payload)

  saving.value = false
  if (res.success) { showModal.value = false; await loadMenus() }
  else formError.value = typeof res.message === 'string' ? res.message : 'Error al guardar'
}

async function handleIconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingIcon.value = true
  const res = await MenuCatalogoService.uploadIcon(file)
  uploadingIcon.value = false
  if (res.success && res.url) form.icono = res.url
  else alert(res.message ?? 'Error al subir el ícono')
  input.value = ''
}

// ─── Modal Roles ──────────────────────────────────────────────────────────
const showRolesModal = ref(false)
const viewingMenu    = ref<MenuCatalogo | null>(null)
const rolesConAcceso = ref<GrupoConAcceso[]>([])
const loadingRoles   = ref(false)

async function openRolesModal(menu: MenuCatalogo) {
  viewingMenu.value = menu
  showRolesModal.value = true
  loadingRoles.value = true
  const res = await MenuCatalogoService.getGruposConAcceso(menu.id)
  loadingRoles.value = false
  rolesConAcceso.value = res.data ?? []
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletingMenu    = ref<MenuCatalogo | null>(null)
const deleting        = ref(false)

function confirmDelete(menu: MenuCatalogo) { deletingMenu.value = menu; showDeleteModal.value = true }

async function deleteMenu() {
  if (!deletingMenu.value) return
  deleting.value = true
  const res = await MenuCatalogoService.deleteMenu(deletingMenu.value.id)
  deleting.value = false
  showDeleteModal.value = false
  if (res.success) await loadMenus()
  else alert(res.message ?? 'No se pudo eliminar el menú')
}

// ─── Icon Picker ──────────────────────────────────────────────────────────
const showIconPicker = ref(false)
const iconSearch     = ref('')
const pickerTab      = ref('heroicons')
const pickerIcons    = ref<string[]>([])
const loadingIcons   = ref(false)

const iconLibraries = [
  { label: 'Heroicons', prefix: 'heroicons' },
  { label: 'Material (MDI)', prefix: 'mdi' },
  { label: 'Tabler', prefix: 'tabler' },
]

const defaultIcons: Record<string, string[]> = {
  heroicons: ['heroicons:home','heroicons:user','heroicons:users','heroicons:cog-6-tooth','heroicons:document-text','heroicons:folder','heroicons:chart-bar','heroicons:shopping-cart','heroicons:truck','heroicons:building-office','heroicons:lock-closed','heroicons:academic-cap','heroicons:newspaper','heroicons:calculator','heroicons:circle-stack','heroicons:clipboard','heroicons:bell','heroicons:star','heroicons:pencil','heroicons:trash','heroicons:eye','heroicons:inbox','heroicons:calendar','heroicons:map-pin','heroicons:globe-alt','heroicons:shield-check','heroicons:squares-2x2','heroicons:table-cells','heroicons:chart-pie','heroicons:currency-dollar'],
  mdi: ['mdi:account','mdi:account-group','mdi:home','mdi:settings','mdi:file-document','mdi:folder','mdi:chart-bar','mdi:cart','mdi:truck','mdi:office-building','mdi:lock','mdi:school','mdi:newspaper','mdi:calculator','mdi:database','mdi:clipboard-text','mdi:bell','mdi:star','mdi:pencil','mdi:delete','mdi:eye','mdi:email','mdi:calendar','mdi:map-marker','mdi:web','mdi:shield-check','mdi:view-grid','mdi:table','mdi:chart-pie','mdi:currency-usd'],
  tabler: ['tabler:home','tabler:user','tabler:users','tabler:settings','tabler:file-text','tabler:folder','tabler:chart-bar','tabler:shopping-cart','tabler:truck','tabler:building','tabler:lock','tabler:school','tabler:news','tabler:calculator','tabler:database','tabler:clipboard','tabler:bell','tabler:star','tabler:pencil','tabler:trash','tabler:eye','tabler:mail','tabler:calendar','tabler:map-pin','tabler:world','tabler:shield-check','tabler:layout-grid','tabler:table','tabler:chart-pie','tabler:currency-dollar'],
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => searchIcons(), 400)
}

async function searchIcons() {
  const q = iconSearch.value.trim()
  if (!q) { pickerIcons.value = defaultIcons[pickerTab.value] ?? []; return }
  loadingIcons.value = true
  try {
    const url = `https://api.iconify.design/search?query=${encodeURIComponent(q)}&prefixes=${pickerTab.value}&limit=60`
    const json = await (await fetch(url)).json()
    pickerIcons.value = (json.icons ?? []).map((name: string) => name.includes(':') ? name : `${pickerTab.value}:${name}`)
  } catch { pickerIcons.value = [] }
  finally { loadingIcons.value = false }
}

function selectIcon(icon: string) { form.icono = icon; showIconPicker.value = false }

watch(showIconPicker, (val) => {
  if (val) { iconSearch.value = ''; pickerIcons.value = defaultIcons[pickerTab.value] ?? [] }
})

// ─── Helpers ──────────────────────────────────────────────────────────────
function isIconUrl(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith('/') || icon.startsWith('http'))
}

// ─── Load ─────────────────────────────────────────────────────────────────
async function loadMenus() {
  loading.value = true
  const res = await MenuCatalogoService.getMenus()
  menus.value = res.data ?? []
  loading.value = false
}

onMounted(loadMenus)
</script>
