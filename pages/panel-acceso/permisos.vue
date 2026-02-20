<template>
  <div class="p-6">
    <PageHeader title="Gestión de Permisos de Menú" icon="i-heroicons-lock-closed" />

    <!-- Selectores -->
    <UCard class="mb-5">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Empresa (solo root) -->
        <UFormField v-if="isRoot" label="Empresa" class="min-w-48">
          <USelect
            v-model="selectedEmpresaId"
            :items="empresasOptions"
            placeholder="Seleccionar empresa"
            class="w-full"
            @update:model-value="onEmpresaChange"
          />
        </UFormField>

        <!-- Organización (solo root) -->
        <UFormField v-if="isRoot" label="Organización" class="min-w-48">
          <USelect
            v-model="selectedOrgId"
            :items="orgsOptions"
            placeholder="Seleccionar organización"
            class="w-full"
            @update:model-value="onOrgChange"
          />
        </UFormField>

        <!-- Cargo -->
        <UFormField label="Cargo" class="min-w-64 flex-1">
          <USelect
            v-model="selectedGrupoId"
            :items="gruposOptions"
            placeholder="Seleccionar cargo"
            class="w-full"
            @update:model-value="loadMenuPermisos"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Tabla de permisos -->
    <UCard v-if="menus.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th class="text-center py-3 px-3 w-10">
                <UCheckbox v-model="checkAll" @change="toggleAllMenus" />
              </th>
              <th class="text-left py-3 px-4">Menú</th>
              <th class="text-center py-3 px-3 w-24">Consultar</th>
              <th class="text-center py-3 px-3 w-24">Agregar</th>
              <th class="text-center py-3 px-3 w-24">Editar</th>
              <th class="text-center py-3 px-3 w-24">Eliminar</th>
              <th class="text-center py-3 px-3 w-24">
                <UButton
                  size="sm"
                  icon="i-heroicons-check"
                  label="Guardar"
                  color="success"
                  :loading="saving"
                  @click="guardarPermisos"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(grupo, key) in menusPorPadre" :key="key">
              <!-- Cabecera de grupo -->
              <tr class="bg-gray-50 dark:bg-gray-700">
                <td colspan="7" class="py-2 px-4 font-bold text-gray-700 dark:text-gray-200">
                  {{ key }}
                </td>
              </tr>
              <!-- Filas de menú -->
              <tr
                v-for="(menu, index) in grupo"
                :key="menu.ID_Menu"
                class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="text-right py-2 px-3 text-gray-400 text-xs">{{ index + 1 }}.</td>
                <td class="py-2 px-4">
                  {{ menu.No_Menu }}
                  <a
                    v-if="menu.Txt_Url_Video"
                    :href="menu.Txt_Url_Video"
                    target="_blank"
                    class="ml-2 text-red-500 hover:text-red-700"
                    title="Ver video"
                  >
                    <UIcon name="i-mdi-youtube" />
                  </a>
                </td>
                <td class="text-center py-2 px-3">
                  <UCheckbox v-model="permisos[menu.ID_Menu].Nu_Consultar" />
                </td>
                <td class="text-center py-2 px-3">
                  <UCheckbox v-model="permisos[menu.ID_Menu].Nu_Agregar" />
                </td>
                <td class="text-center py-2 px-3">
                  <UCheckbox v-model="permisos[menu.ID_Menu].Nu_Editar" />
                </td>
                <td class="text-center py-2 px-3">
                  <UCheckbox v-model="permisos[menu.ID_Menu].Nu_Eliminar" />
                </td>
                <td></td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th class="text-center py-3 px-3">
                <UCheckbox v-model="checkAll" @change="toggleAllMenus" />
              </th>
              <th class="text-left py-3 px-4">Menú</th>
              <th class="text-center py-3 px-3">Consultar</th>
              <th class="text-center py-3 px-3">Agregar</th>
              <th class="text-center py-3 px-3">Editar</th>
              <th class="text-center py-3 px-3">Eliminar</th>
              <th class="text-center py-3 px-3">
                <UButton
                  size="sm"
                  icon="i-heroicons-check"
                  label="Guardar"
                  color="success"
                  :loading="saving"
                  @click="guardarPermisos"
                />
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </UCard>

    <div v-else-if="loadingMenus" class="text-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
      <p class="mt-2">Cargando permisos...</p>
    </div>

    <div v-else-if="selectedGrupoId && !loadingMenus" class="text-center py-10 text-gray-500">
      <p>{{ noMenusMessage || 'Selecciona un cargo para ver sus permisos' }}</p>
    </div>

    <p v-if="saveMessage" class="mt-3 text-center" :class="saveSuccess ? 'text-green-600' : 'text-red-600'">
      {{ saveMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { MenuAccesoService } from '~/services/panelAcceso/menuAccesoService'
import { OptionsService }    from '~/services/panelAcceso/optionsService'
import type { MenuConPermiso } from '~/services/panelAcceso/menuAccesoService'
import AuthService from '~/services/authService'

const authUser  = AuthService.getInstance().currentUser as any
const isRoot    = computed(() => authUser?.name === 'root' || authUser?.raw?.No_Usuario === 'root')

const defaultEmpresaId = computed(() => authUser?.raw?.ID_Empresa ?? 1)
const defaultOrgId     = computed(() => authUser?.raw?.ID_Organizacion ?? 1)

// Selectores
const selectedEmpresaId = ref<number>(defaultEmpresaId.value)
const selectedOrgId     = ref<number>(defaultOrgId.value)
const selectedGrupoId   = ref<number>(0)

const empresasOptions = ref<{ label: string; value: number }[]>([])
const orgsOptions     = ref<{ label: string; value: number }[]>([])
const gruposOptions   = ref<{ label: string; value: number }[]>([])

// Menús y permisos
const menus        = ref<MenuConPermiso[]>([])
const loadingMenus = ref(false)
const noMenusMessage = ref('')

interface PermisoState {
  Nu_Consultar: boolean
  Nu_Agregar:   boolean
  Nu_Editar:    boolean
  Nu_Eliminar:  boolean
}
const permisos = ref<Record<number, PermisoState>>({})
const checkAll = ref(false)

// Guardar
const saving      = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)

// Agrupar menús por nombre de padre
const menusPorPadre = computed(() => {
  const grupos: Record<string, MenuConPermiso[]> = {}
  for (const m of menus.value) {
    const key = m.No_Menu_Padre || 'General'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(m)
  }
  return grupos
})

async function initOptions() {
  if (isRoot.value) {
    const empresas = await OptionsService.getEmpresas()
    empresasOptions.value = empresas.map(e => ({ label: e.nombre, value: e.id }))
  }
  await loadOrgs()
  await loadGrupos()
}

async function loadOrgs() {
  const orgs = await OptionsService.getOrganizaciones(selectedEmpresaId.value)
  orgsOptions.value = orgs.map(o => ({ label: o.nombre, value: o.id }))
  if (!isRoot.value) {
    selectedOrgId.value = defaultOrgId.value
  }
}

async function loadGrupos() {
  const grupos = await OptionsService.getGrupos(selectedEmpresaId.value, selectedOrgId.value)
  gruposOptions.value = grupos.map(g => ({ label: g.nombre, value: g.id }))
  selectedGrupoId.value = 0
  menus.value = []
}

async function onEmpresaChange() {
  await loadOrgs()
  await loadGrupos()
}

async function onOrgChange() {
  await loadGrupos()
}

async function loadMenuPermisos() {
  if (!selectedGrupoId.value) return

  loadingMenus.value = true
  noMenusMessage.value = ''
  menus.value = []
  permisos.value = {}
  saveMessage.value = ''

  const res = await MenuAccesoService.getMenuPorGrupo(
    selectedEmpresaId.value,
    selectedOrgId.value,
    selectedGrupoId.value
  )

  loadingMenus.value = false

  if (!res.success) {
    noMenusMessage.value = res.message ?? 'Error al cargar permisos'
    return
  }

  menus.value = res.data

  // Inicializar estado de permisos
  for (const m of res.data) {
    permisos.value[m.ID_Menu] = {
      Nu_Consultar: m.Nu_Consultar === 1,
      Nu_Agregar:   m.Nu_Agregar   === 1,
      Nu_Editar:    m.Nu_Editar    === 1,
      Nu_Eliminar:  m.Nu_Eliminar  === 1,
    }
  }

  // Actualizar checkAll
  checkAll.value = res.data.some(m => m.Nu_Consultar === 1)
}

function toggleAllMenus() {
  const val = checkAll.value
  for (const id in permisos.value) {
    permisos.value[id].Nu_Consultar = val
    permisos.value[id].Nu_Agregar   = val
    permisos.value[id].Nu_Editar    = val
    permisos.value[id].Nu_Eliminar  = val
  }
}

async function guardarPermisos() {
  if (!selectedGrupoId.value) return

  saving.value = true
  saveMessage.value = ''

  // Construir payload de menús en el formato que espera el backend
  const menusPayload: Record<number, object> = {}
  for (const m of menus.value) {
    const p = permisos.value[m.ID_Menu]
    if (p.Nu_Consultar || p.Nu_Agregar || p.Nu_Editar || p.Nu_Eliminar) {
      menusPayload[m.ID_Menu] = {
        ...(p.Nu_Consultar ? { Nu_Consultar: true } : {}),
        ...(p.Nu_Agregar   ? { Nu_Agregar:   true } : {}),
        ...(p.Nu_Editar    ? { Nu_Editar:    true } : {}),
        ...(p.Nu_Eliminar  ? { Nu_Eliminar:  true } : {}),
      }
    }
  }

  const res = await MenuAccesoService.guardarPermisos({
    id_empresa: selectedEmpresaId.value,
    id_org:     selectedOrgId.value,
    id_grupo:   selectedGrupoId.value,
    menus:      menusPayload,
  })

  saving.value = false
  saveSuccess.value = res.success
  saveMessage.value = res.message ?? (res.success ? 'Permisos guardados' : 'Error al guardar')

  setTimeout(() => { saveMessage.value = '' }, 3000)
}

onMounted(initOptions)
</script>
