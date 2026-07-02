<template>
  <div class="p-6">
    <PageHeader title="Gestión de Cargos" icon="i-heroicons-identification" />

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Buscar cargo..."
        icon="i-heroicons-magnifying-glass"
        class="w-64"
        @input="loadGrupos"
      />
      <div class="flex-1" />
      <UButton
        icon="i-heroicons-plus"
        label="Agregar Cargo"
        @click="openModal()"
      />
    </div>

    <!-- Tabla -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th v-if="isRoot" class="text-left py-3 px-4">Empresa</th>
              <th v-if="isRoot" class="text-left py-3 px-4">Organización</th>
              <th class="text-left py-3 px-4">Privilegio</th>
              <th class="text-left py-3 px-4">Cargo</th>
              <th class="text-left py-3 px-4">Descripción</th>
              <th class="text-center py-3 px-4">Notificación</th>
              <th class="text-center py-3 px-4">Estado</th>
              <th class="text-center py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="isRoot ? 8 : 6" class="text-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="grupos.length === 0">
              <td :colspan="isRoot ? 8 : 6" class="text-center py-8 text-gray-500">No hay registros</td>
            </tr>
            <tr
              v-for="g in grupos"
              :key="g.id"
              class="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td v-if="isRoot" class="py-2 px-4 text-gray-500 text-xs">{{ g.empresa || '—' }}</td>
              <td v-if="isRoot" class="py-2 px-4 text-gray-500 text-xs">{{ g.organizacion || '—' }}</td>
              <td class="py-2 px-4">
                <UBadge variant="soft" color="primary">{{ g.privilegio_nombre }}</UBadge>
              </td>
              <td class="py-2 px-4 font-medium">{{ g.cargo }}</td>
              <td class="py-2 px-4 text-gray-500">{{ g.descripcion || '—' }}</td>
              <td class="py-2 px-4 text-center">
                <UButton
                  size="xs"
                  :color="g.notificacion === 1 ? 'success' : 'neutral'"
                  :variant="g.notificacion === 1 ? 'soft' : 'outline'"
                  :label="g.notificacion === 1 ? 'Activa' : 'Inactiva'"
                  @click="toggleNotificacion(g)"
                />
              </td>
              <td class="py-2 px-4 text-center">
                <UBadge :color="g.estado === 1 ? 'success' : 'neutral'">
                  {{ g.estado === 1 ? 'Activo' : 'Inactivo' }}
                </UBadge>
              </td>
              <td class="py-2 px-4 text-center">
                <div class="flex justify-center gap-2">
                  <UButton
                    size="xs"
                    icon="i-heroicons-pencil"
                    color="primary"
                    variant="ghost"
                    @click="openModal(g)"
                  />
                  <UButton
                    size="xs"
                    icon="i-heroicons-trash"
                    color="error"
                    variant="ghost"
                    @click="confirmDelete(g)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal Crear/Editar -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ editingGrupo ? 'Editar Cargo' : 'Nuevo Cargo' }}
              </h3>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="showModal = false" />
            </div>
          </template>

          <form @submit.prevent="submitForm" class="space-y-4">
            <!-- Empresa (solo root) -->
            <UFormField v-if="isRoot" label="Empresa" required>
              <USelect
                v-model="form.id_empresa"
                :items="empresasOptions"
                placeholder="Seleccionar empresa"
                class="w-full"
                @update:model-value="onModalEmpresaChange"
              />
            </UFormField>

            <!-- Organización (solo root) -->
            <UFormField v-if="isRoot" label="Organización" required>
              <USelect
                v-model="form.id_org"
                :items="orgsOptions"
                placeholder="Seleccionar organización"
                class="w-full"
                :disabled="loadingOrgs"
              />
            </UFormField>

            <UFormField label="Privilegio" required>
              <USelect
                v-model="form.privilegio"
                :items="tiposPrivilegio"
                placeholder="Seleccionar privilegio"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Cargo" required>
              <UInput
                v-model="form.cargo"
                placeholder="Nombre del cargo"
                maxlength="30"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Descripción">
              <UInput
                v-model="form.descripcion"
                placeholder="Descripción (opcional)"
                maxlength="100"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Estado" required>
              <USelect
                v-model="form.estado"
                :items="[{ label: 'Activo', value: 1 }, { label: 'Inactivo', value: 0 }]"
                class="w-full"
              />
            </UFormField>

            <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>
          </form>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showModal = false" />
              <UButton
                label="Guardar"
                icon="i-heroicons-check"
                :loading="saving"
                @click="submitForm"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Modal Confirmar Eliminación -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Eliminación</h3>
          </template>
          <p>
            ¿Deseas eliminar el cargo <strong>{{ deletingGrupo?.cargo }}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="outline" label="Cancelar" @click="showDeleteModal = false" />
              <UButton
                color="error"
                label="Eliminar"
                icon="i-heroicons-trash"
                :loading="deleting"
                @click="deleteGrupo"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { GrupoService, TIPOS_PRIVILEGIO } from '~/services/panelAcceso/grupoService'
import type { Grupo, CreateGrupoRequest } from '~/services/panelAcceso/grupoService'
import { OptionsService } from '~/services/panelAcceso/optionsService'
import AuthService from '~/services/authService'

const authUser = AuthService.getInstance().currentUser as any
const isRoot = computed(() => authUser?.name === 'root' || authUser?.raw?.No_Usuario === 'root')

const empresaId = computed(() => authUser?.raw?.ID_Empresa ?? 1)
const orgId     = computed(() => authUser?.raw?.ID_Organizacion ?? 1)

const tiposPrivilegio = TIPOS_PRIVILEGIO

// Opciones para selects en modal (solo root)
const empresasOptions = ref<{ label: string; value: number }[]>([])
const orgsOptions     = ref<{ label: string; value: number }[]>([])
const loadingOrgs     = ref(false)

const grupos   = ref<Grupo[]>([])
const loading  = ref(false)
const search   = ref('')

const showModal    = ref(false)
const editingGrupo = ref<Grupo | null>(null)
const saving       = ref(false)
const formError    = ref('')

const showDeleteModal = ref(false)
const deletingGrupo   = ref<Grupo | null>(null)
const deleting        = ref(false)

const form = reactive<CreateGrupoRequest & { descripcion: string }>({
  id_empresa: empresaId.value,
  id_org:     orgId.value,
  cargo:      '',
  descripcion:'',
  privilegio: 1,
  estado:     1,
})

async function loadGrupos() {
  loading.value = true
  const res = await GrupoService.getGrupos({
    empresa_id: isRoot.value ? undefined : empresaId.value,
    org_id:     isRoot.value ? undefined : orgId.value,
    search:     search.value || undefined,
  })
  grupos.value = res.data ?? []
  loading.value = false
}

async function loadEmpresas() {
  const empresas = await OptionsService.getEmpresas()
  empresasOptions.value = empresas.map(e => ({ label: e.nombre, value: e.id }))
}

async function loadOrgsForEmpresa(empresaId: number) {
  loadingOrgs.value = true
  const orgs = await OptionsService.getOrganizaciones(empresaId)
  orgsOptions.value = orgs.map(o => ({ label: o.nombre, value: o.id }))
  loadingOrgs.value = false
}

async function onModalEmpresaChange() {
  form.id_org = 0
  await loadOrgsForEmpresa(form.id_empresa)
  if (orgsOptions.value.length > 0) {
    form.id_org = orgsOptions.value[0].value
  }
}

async function openModal(grupo?: Grupo) {
  formError.value = ''

  if (isRoot.value) {
    if (empresasOptions.value.length === 0) {
      await loadEmpresas()
    }
  }

  if (grupo) {
    editingGrupo.value = grupo
    form.id_empresa  = grupo.id_empresa
    form.id_org      = grupo.id_org
    form.cargo       = grupo.cargo
    form.descripcion = grupo.descripcion ?? ''
    form.privilegio  = grupo.privilegio
    form.estado      = grupo.estado

    if (isRoot.value) {
      await loadOrgsForEmpresa(grupo.id_empresa)
    }
  } else {
    editingGrupo.value = null
    form.id_empresa  = empresaId.value
    form.id_org      = orgId.value
    form.cargo       = ''
    form.descripcion = ''
    form.privilegio  = 1
    form.estado      = 1

    if (isRoot.value) {
      await loadOrgsForEmpresa(form.id_empresa)
    }
  }

  showModal.value = true
}

async function submitForm() {
  if (isRoot.value && !form.id_empresa) {
    formError.value = 'Debes seleccionar una empresa'
    return
  }
  if (isRoot.value && !form.id_org) {
    formError.value = 'Debes seleccionar una organización'
    return
  }
  if (!form.cargo.trim()) {
    formError.value = 'El nombre del cargo es requerido'
    return
  }
  formError.value = ''
  saving.value = true

  const payload = {
    id_empresa:  form.id_empresa,
    id_org:      form.id_org,
    cargo:       form.cargo.trim(),
    descripcion: form.descripcion || undefined,
    privilegio:  Number(form.privilegio),
    estado:      Number(form.estado),
  }

  const res = editingGrupo.value
    ? await GrupoService.updateGrupo(editingGrupo.value.id, payload)
    : await GrupoService.createGrupo(payload)

  saving.value = false

  if (res.success) {
    showModal.value = false
    await loadGrupos()
  } else {
    formError.value = typeof res.message === 'string' ? res.message : 'Error al guardar'
  }
}

function confirmDelete(grupo: Grupo) {
  deletingGrupo.value = grupo
  showDeleteModal.value = true
}

async function deleteGrupo() {
  if (!deletingGrupo.value) return
  deleting.value = true
  const res = await GrupoService.deleteGrupo(deletingGrupo.value.id)
  deleting.value = false
  showDeleteModal.value = false
  if (res.success) {
    await loadGrupos()
  } else {
    alert(res.message ?? 'No se pudo eliminar el cargo')
  }
}

async function toggleNotificacion(grupo: Grupo) {
  const nuevaNotif = grupo.notificacion === 1 ? 0 : 1
  const res = await GrupoService.updateNotificacion(grupo.id, nuevaNotif as 0 | 1)
  if (res.success) {
    grupo.notificacion = nuevaNotif
  }
}

onMounted(loadGrupos)
</script>
