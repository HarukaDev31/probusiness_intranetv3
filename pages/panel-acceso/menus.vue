<template>
  <div class="p-6">
    <PageHeader title="Gestión de Menús" icon="i-heroicons-squares-2x2" />

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Buscar menú..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
      />
      <div class="flex-1" />
      <UButton icon="i-heroicons-plus" label="Agregar Menú" @click="openModal()" />
    </div>

    <!-- Tabla agrupada por padre -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th class="text-center py-3 px-3 w-16">Orden</th>
              <th class="text-center py-3 px-3 w-12">Ícono</th>
              <th class="text-left py-3 px-4">Nombre</th>
              <th class="text-left py-3 px-4">Ruta Nuxt</th>
              <th class="text-center py-3 px-3 w-24">Estado</th>
              <th class="text-center py-3 px-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="filteredMenus.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-500">No hay menús registrados</td>
            </tr>
            <template v-for="(grupo, padreNombre) in menusPorPadre" :key="padreNombre">
              <!-- Cabecera de grupo -->
              <tr class="bg-gray-50 dark:bg-gray-700">
                <td colspan="6" class="py-2 px-4 font-bold text-gray-700 dark:text-gray-200">
                  {{ padreNombre }}
                </td>
              </tr>
              <!-- Filas de menú -->
              <tr
                v-for="menu in grupo"
                :key="menu.id"
                class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="text-center py-2 px-3 text-gray-500">{{ menu.orden }}</td>
                <td class="text-center py-2 px-3">
                  <span v-if="isIconUrl(menu.icono)">
                    <img :src="menu.icono!" class="w-5 h-5 mx-auto object-contain" />
                  </span>
                  <UIcon
                    v-else-if="menu.icono"
                    :name="menu.icono"
                    class="w-5 h-5 mx-auto text-gray-500"
                  />
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
                <td class="py-2 px-4 font-medium">{{ menu.nombre }}</td>
                <td class="py-2 px-4 text-gray-500 font-mono text-xs">{{ menu.ruta || '—' }}</td>
                <td class="py-2 px-3 text-center">
                  <UBadge :color="menu.activo === 1 ? 'success' : 'neutral'">
                    {{ menu.activo === 1 ? 'Activo' : 'Inactivo' }}
                  </UBadge>
                </td>
                <td class="py-2 px-3 text-center">
                  <div class="flex justify-center gap-1">
                    <UButton
                      size="xs"
                      icon="i-heroicons-user-group"
                      color="info"
                      variant="ghost"
                      title="Ver roles con acceso"
                      @click="openRolesModal(menu)"
                    />
                    <UButton
                      size="xs"
                      icon="i-heroicons-pencil"
                      color="primary"
                      variant="ghost"
                      @click="openModal(menu)"
                    />
                    <UButton
                      size="xs"
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      @click="confirmDelete(menu)"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </UCard>

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
            <!-- Menú Padre -->
            <UFormField label="Menú Padre">
              <USelect
                v-model="form.id_padre"
                :items="padreOptions"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <!-- Nombre -->
              <UFormField label="Nombre" required>
                <UInput v-model="form.nombre" placeholder="Nombre del menú" maxlength="100" class="w-full" />
              </UFormField>
              <!-- Orden -->
              <UFormField label="Orden" required>
                <UInput v-model.number="form.orden" type="number" min="0" class="w-full" />
              </UFormField>
            </div>

            <!-- Ruta Nuxt -->
            <UFormField label="Ruta Nuxt">
              <UInput v-model="form.ruta" placeholder="/panel-acceso/cargos" class="w-full" />
            </UFormField>

            <!-- Ícono -->
            <UFormField label="Ícono">
              <div class="flex gap-2 items-center">
                <!-- Preview -->
                <div class="flex-shrink-0 w-9 h-9 border rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <img v-if="isIconUrl(form.icono)" :src="form.icono" class="w-6 h-6 object-contain" />
                  <UIcon v-else-if="form.icono" :name="form.icono" class="w-6 h-6 text-gray-500" />
                  <UIcon v-else name="i-heroicons-photo" class="w-5 h-5 text-gray-300" />
                </div>
                <!-- Input -->
                <UInput
                  v-model="form.icono"
                  placeholder="heroicons:home  o  mdi:account  o  URL"
                  class="flex-1"
                />
                <!-- Botón buscar -->
                <UButton
                  size="sm"
                  icon="i-heroicons-magnifying-glass"
                  variant="outline"
                  title="Buscar ícono"
                  @click="showIconPicker = true"
                />
                <!-- Botón subir imagen -->
                <label class="cursor-pointer">
                  <UButton
                    size="sm"
                    icon="i-heroicons-arrow-up-tray"
                    variant="outline"
                    title="Subir imagen personalizada"
                    :loading="uploadingIcon"
                    as="span"
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/svg+xml"
                    class="hidden"
                    @change="handleIconUpload"
                  />
                </label>
              </div>
              <p class="text-xs text-gray-400 mt-1">
                Ej: <code>heroicons:home</code>, <code>mdi:account</code>, <code>tabler:truck</code>
              </p>
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <!-- URL Video -->
              <UFormField label="URL de Video">
                <UInput v-model="form.url_video" placeholder="https://youtube.com/..." class="w-full" />
              </UFormField>
              <!-- Estado -->
              <UFormField label="Estado" required>
                <USelect
                  v-model="form.activo"
                  :items="[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Mostrar padre -->
            <UFormField label="">
              <div class="flex items-center gap-2">
                <UCheckbox v-model="form.show_father" />
                <span class="text-sm">Mostrar padre en sidebar</span>
              </div>
            </UFormField>

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

    <!-- ===== Modal Ver Roles con Acceso ===== -->
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
            Ningún cargo tiene asignado este menú todavía.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="g in rolesConAcceso"
              :key="g.id"
              class="flex items-center justify-between rounded border px-3 py-2"
            >
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

    <!-- ===== Modal Confirmar Eliminación ===== -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Eliminación</h3>
          </template>
          <p>
            ¿Eliminar el menú <strong>{{ deletingMenu?.nombre }}</strong>?
          </p>
          <p class="mt-2 text-sm text-amber-600">
            Se desasignará de todos los roles que lo tengan asignado.
          </p>
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

          <!-- Tabs de librerías -->
          <div class="flex gap-1 mb-3 border-b">
            <button
              v-for="lib in iconLibraries"
              :key="lib.prefix"
              class="px-4 py-2 text-sm font-medium transition-colors"
              :class="pickerTab === lib.prefix
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'"
              @click="pickerTab = lib.prefix; searchIcons()"
            >
              {{ lib.label }}
            </button>
          </div>

          <!-- Buscador -->
          <UInput
            v-model="iconSearch"
            placeholder="Buscar ícono..."
            icon="i-heroicons-magnifying-glass"
            class="mb-3"
            @input="debouncedSearch"
          />

          <!-- Grid de iconos -->
          <div v-if="loadingIcons" class="text-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
            <p class="text-sm text-gray-500 mt-2">Buscando en Iconify...</p>
          </div>
          <div v-else-if="pickerIcons.length === 0" class="text-center py-8 text-gray-400">
            Sin resultados. Prueba otra búsqueda.
          </div>
          <div v-else class="grid grid-cols-8 gap-1 max-h-72 overflow-y-auto">
            <button
              v-for="icon in pickerIcons"
              :key="icon"
              class="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              :title="icon"
              @click="selectIcon(icon)"
            >
              <UIcon :name="icon" class="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span class="text-[9px] text-gray-400 truncate w-full text-center">{{ icon.split(':')[1] }}</span>
            </button>
          </div>

          <template #footer>
            <div class="flex justify-between items-center">
              <p class="text-xs text-gray-400">
                Resultados de <a href="https://iconify.design" target="_blank" class="underline">Iconify API</a>
              </p>
              <UButton variant="outline" label="Cancelar" @click="showIconPicker = false" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { MenuCatalogoService } from '~/services/panelAcceso/menuCatalogoService'
import type { MenuCatalogo, GrupoConAcceso } from '~/services/panelAcceso/menuCatalogoService'

// ─── Data ────────────────────────────────────────────────────────────────────
const menus   = ref<MenuCatalogo[]>([])
const loading = ref(false)
const search  = ref('')

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredMenus = computed(() => {
  if (!search.value) return menus.value
  const q = search.value.toLowerCase()
  return menus.value.filter(m =>
    m.nombre.toLowerCase().includes(q) ||
    (m.ruta ?? '').toLowerCase().includes(q) ||
    (m.padre_nombre ?? '').toLowerCase().includes(q)
  )
})

const menusPorPadre = computed(() => {
  const grupos: Record<string, MenuCatalogo[]> = {}
  for (const m of filteredMenus.value) {
    const key = m.id_padre === 0 ? 'Raíz' : (m.padre_nombre ?? 'Sin padre')
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(m)
  }
  return grupos
})

// Options para el select de padre en el modal
const padreOptions = computed(() => {
  const opts = [{ label: 'Ninguno (raíz)', value: 0 }]
  for (const m of menus.value) {
    opts.push({ label: m.nombre, value: m.id })
  }
  return opts
})

// ─── Modal Crear/Editar ───────────────────────────────────────────────────────
const showModal    = ref(false)
const editingMenu  = ref<MenuCatalogo | null>(null)
const saving       = ref(false)
const formError    = ref('')
const uploadingIcon = ref(false)

const form = reactive({
  nombre:      '',
  id_padre:    0,
  orden:       0,
  icono:       '',
  ruta:        '',
  activo:      true,
  url_video:   '',
  show_father: false,
})

async function openModal(menu?: MenuCatalogo) {
  formError.value = ''
  if (menu) {
    editingMenu.value = menu
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
  if (!form.nombre.trim()) {
    formError.value = 'El nombre del menú es requerido'
    return
  }
  formError.value = ''
  saving.value = true

  const payload = {
    nombre:      form.nombre.trim(),
    id_padre:    Number(form.id_padre),
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

  if (res.success) {
    showModal.value = false
    await loadMenus()
  } else {
    formError.value = typeof res.message === 'string' ? res.message : 'Error al guardar'
  }
}

// ─── Subir ícono personalizado ────────────────────────────────────────────────
async function handleIconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingIcon.value = true
  const res = await MenuCatalogoService.uploadIcon(file)
  uploadingIcon.value = false

  if (res.success && res.url) {
    form.icono = res.url
  } else {
    alert(res.message ?? 'Error al subir el ícono')
  }

  // Reset input para permitir volver a subir el mismo archivo
  input.value = ''
}

// ─── Modal Ver Roles ──────────────────────────────────────────────────────────
const showRolesModal  = ref(false)
const viewingMenu     = ref<MenuCatalogo | null>(null)
const rolesConAcceso  = ref<GrupoConAcceso[]>([])
const loadingRoles    = ref(false)

async function openRolesModal(menu: MenuCatalogo) {
  viewingMenu.value = menu
  showRolesModal.value = true
  loadingRoles.value = true
  const res = await MenuCatalogoService.getGruposConAcceso(menu.id)
  loadingRoles.value = false
  rolesConAcceso.value = res.data ?? []
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletingMenu    = ref<MenuCatalogo | null>(null)
const deleting        = ref(false)

function confirmDelete(menu: MenuCatalogo) {
  deletingMenu.value = menu
  showDeleteModal.value = true
}

async function deleteMenu() {
  if (!deletingMenu.value) return
  deleting.value = true
  const res = await MenuCatalogoService.deleteMenu(deletingMenu.value.id)
  deleting.value = false
  showDeleteModal.value = false
  if (res.success) {
    await loadMenus()
  } else {
    alert(res.message ?? 'No se pudo eliminar el menú')
  }
}

// ─── Icon Picker ──────────────────────────────────────────────────────────────
const showIconPicker = ref(false)
const iconSearch     = ref('')
const pickerTab      = ref('heroicons')
const pickerIcons    = ref<string[]>([])
const loadingIcons   = ref(false)

const iconLibraries = [
  { label: 'Heroicons',     prefix: 'heroicons' },
  { label: 'Material (MDI)', prefix: 'mdi' },
  { label: 'Tabler',        prefix: 'tabler' },
]

// Iconos populares por defecto cuando no hay búsqueda
const defaultIcons: Record<string, string[]> = {
  heroicons: [
    'heroicons:home','heroicons:user','heroicons:users','heroicons:cog-6-tooth',
    'heroicons:document-text','heroicons:folder','heroicons:chart-bar',
    'heroicons:shopping-cart','heroicons:truck','heroicons:building-office',
    'heroicons:lock-closed','heroicons:academic-cap','heroicons:newspaper',
    'heroicons:calculator','heroicons:circle-stack','heroicons:clipboard',
    'heroicons:arrow-path','heroicons:magnifying-glass','heroicons:bell',
    'heroicons:star','heroicons:check','heroicons:plus','heroicons:pencil',
    'heroicons:trash','heroicons:eye','heroicons:inbox','heroicons:calendar',
    'heroicons:map-pin','heroicons:globe-alt','heroicons:shield-check',
  ],
  mdi: [
    'mdi:account','mdi:account-group','mdi:home','mdi:settings','mdi:file-document',
    'mdi:folder','mdi:chart-bar','mdi:cart','mdi:truck','mdi:office-building',
    'mdi:lock','mdi:school','mdi:newspaper','mdi:calculator','mdi:database',
    'mdi:clipboard-text','mdi:refresh','mdi:magnify','mdi:bell','mdi:star',
    'mdi:check','mdi:plus','mdi:pencil','mdi:delete','mdi:eye','mdi:email',
    'mdi:calendar','mdi:map-marker','mdi:web','mdi:shield-check',
  ],
  tabler: [
    'tabler:home','tabler:user','tabler:users','tabler:settings','tabler:file-text',
    'tabler:folder','tabler:chart-bar','tabler:shopping-cart','tabler:truck',
    'tabler:building','tabler:lock','tabler:school','tabler:news','tabler:calculator',
    'tabler:database','tabler:clipboard','tabler:refresh','tabler:search',
    'tabler:bell','tabler:star','tabler:check','tabler:plus','tabler:pencil',
    'tabler:trash','tabler:eye','tabler:mail','tabler:calendar','tabler:map-pin',
    'tabler:world','tabler:shield-check',
  ],
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => searchIcons(), 400)
}

async function searchIcons() {
  const q = iconSearch.value.trim()

  if (!q) {
    pickerIcons.value = defaultIcons[pickerTab.value] ?? []
    return
  }

  loadingIcons.value = true
  try {
    const url = `https://api.iconify.design/search?query=${encodeURIComponent(q)}&prefixes=${pickerTab.value}&limit=60`
    const res = await fetch(url)
    const json = await res.json()
    // Iconify devuelve { icons: ['heroicons:home', ...] }
    pickerIcons.value = (json.icons ?? []).map((name: string) => {
      // Si el nombre ya incluye prefijo (heroicons:home), usarlo tal cual
      if (name.includes(':')) return name
      return `${pickerTab.value}:${name}`
    })
  } catch {
    pickerIcons.value = []
  } finally {
    loadingIcons.value = false
  }
}

function selectIcon(icon: string) {
  form.icono = icon
  showIconPicker.value = false
}

// Al abrir el picker, cargar iconos por defecto
watch(showIconPicker, (val) => {
  if (val) {
    iconSearch.value = ''
    pickerIcons.value = defaultIcons[pickerTab.value] ?? []
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isIconUrl(icon: string | null | undefined): boolean {
  if (!icon) return false
  return icon.startsWith('/') || icon.startsWith('http')
}

// ─── Load ─────────────────────────────────────────────────────────────────────
async function loadMenus() {
  loading.value = true
  const res = await MenuCatalogoService.getMenus()
  menus.value = res.data ?? []
  loading.value = false
}

onMounted(loadMenus)
</script>
